#!/usr/bin/env python3
"""
Unified syllabus CSV parser for syllabus-planner.

Usage:
  python3 parse_syllabus_csv.py --csv <path> --list
  python3 parse_syllabus_csv.py --csv <path> --tree
  python3 parse_syllabus_csv.py --csv <path> --week 1 --day 1
  python3 parse_syllabus_csv.py --csv <path> --week 1 --day 1 --include-prior
  python3 parse_syllabus_csv.py --csv <path> --search "tailwind"
  python3 parse_syllabus_csv.py --csv <path> --section "WEB UI"
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

DEFAULT_PRIOR_WINDOW = 15

DETAIL_DAY_MARKERS = (
    "en syllabus",
    "approved",
    "teoría pendiente",
    "teoria pendiente",
    "proyecto pendiente",
    "pendiente evaluación",
    "pendiente evaluacion",
    "pendiente aprobación",
    "pendiente aprobacion",
)

CONTENT_SECTION_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^>\s*Teor(?:ía|y)", re.I), "theory"),
    (re.compile(r"^>\s*Theory", re.I), "theory"),
    (re.compile(r"^>\s*Proyecto", re.I), "project"),
    (re.compile(r"^>\s*Project", re.I), "project"),
    (re.compile(r"^>\s*Pr[aá]cticas?", re.I), "exercise"),
    (re.compile(r"^>\s*Practica", re.I), "exercise"),
    (re.compile(r"^>\s*Exercise", re.I), "exercise"),
    (re.compile(r"^>\s*Sólo práctica", re.I), "exercise"),
]

INSTRUCTOR_SECTION = re.compile(
    r"^>\s*(?:Instrucciones al profesor|Propuesta para guiar)",
    re.I,
)

HEADER_WITH_TITLE = re.compile(
    r"^>\s*"
    r"(?:Teor(?:ía|y)|Theory|Proyecto|Project|Pr[aá]cticas?|Practica|Exercise)"
    r"(?:\s*\([^)]+\))?"
    r"(?:\s*\d+)?"
    r"\s*[:：\-—–]\s*(.+)$",
    re.I,
)

NUMBERED_STEP = re.compile(r"^\d+\.\s+")


@dataclass
class ContentItem:
    type: str
    title: str
    body: str | None = None
    children: list[dict[str, Any]] = field(default_factory=list)
    steps: list[str] = field(default_factory=list)


@dataclass
class ContentBlock:
    status: str | None = None
    content: str | None = None
    how_to_think: str | None = None
    best_practices: str | None = None
    patterns: str | None = None
    anti_patterns: str | None = None
    limitations: str | None = None
    instructor_notes: list[str] = field(default_factory=list)
    items: list[ContentItem] = field(default_factory=list)


@dataclass
class ParsedModule:
    week: str
    day: str
    skill_raw: str
    skill_name: str
    skills: list[str] = field(default_factory=list)
    is_milestone: bool = False
    milestone_id: str | None = None
    blocks: list[ContentBlock] = field(default_factory=list)


@dataclass
class ParsedSection:
    title: str
    phase: str | None = None
    modules: list[ParsedModule] = field(default_factory=list)


@dataclass
class ParsedSyllabus:
    title: str
    phases: list[str] = field(default_factory=list)
    sections: list[ParsedSection] = field(default_factory=list)


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    text = str(value).strip()
    return text if text else None


def _is_status_day(day: str) -> bool:
    lowered = day.lower()
    return any(marker in lowered for marker in DETAIL_DAY_MARKERS)


def _is_milestone_row(row: list[str]) -> bool:
    week = _clean(row[0] if len(row) > 0 else None)
    return bool(week and week.upper().startswith("HITO"))


def _is_day_row(row: list[str]) -> bool:
    week = _clean(row[0] if len(row) > 0 else None)
    day = _clean(row[1] if len(row) > 1 else None)
    content = _clean(row[2] if len(row) > 2 else None)
    if not week or not day or not content:
        return False
    if week.upper().startswith("HITO"):
        return False
    if _is_status_day(day):
        return False
    if "skill:" in content.lower():
        return True
    try:
        float(str(week).replace(",", "."))
        return True
    except ValueError:
        return False


def _extract_milestone_title(milestone_id: str, content: str) -> str:
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        if re.search(r"[Hh]ito\s+\d+\s*[—–-]", line):
            return f"[{milestone_id}] {line}"
    first = next((line.strip()
                 for line in content.splitlines() if line.strip()), "")
    return f"[{milestone_id}] {first[:80]}" if first else milestone_id


def _parse_skills(content: str) -> list[str]:
    skills: list[str] = []
    for line in content.splitlines():
        match = re.search(r"[Ss]kill\s*(?:x\s*)?:\s*(.+)", line.strip())
        if match:
            skills.append(match.group(1).strip())
    if skills:
        return skills
    first_line = next((line.strip()
                      for line in content.splitlines() if line.strip()), "")
    return [first_line] if first_line else []


def _extract_skill_name(content: str) -> str:
    skills = _parse_skills(content)
    return " | ".join(skills) if skills else content.strip()


def _strip_section_title(content: str) -> str:
    return content.removeprefix("###").removesuffix("###").strip()


def _strip_phase_title(content: str) -> str:
    return content.strip("- ").strip()


def _build_block(row: list[str]) -> ContentBlock:
    content = _clean(row[2] if len(row) > 2 else None)
    block = ContentBlock(
        status=_clean(row[1] if len(row) > 1 else None),
        content=content,
        how_to_think=_clean(row[3] if len(row) > 3 else None),
        best_practices=_clean(row[4] if len(row) > 4 else None),
        patterns=_clean(row[5] if len(row) > 5 else None),
        anti_patterns=_clean(row[6] if len(row) > 6 else None),
        limitations=_clean(row[7] if len(row) > 7 else None),
    )
    if content:
        block.items, block.instructor_notes = extract_content_items(content)
    return block


def _pad_row(row: list[str]) -> list[str]:
    while len(row) < 8:
        row.append("")
    return row


def _detect_section_type(line: str) -> str | None:
    for pattern, content_type in CONTENT_SECTION_PATTERNS:
        if pattern.search(line):
            return content_type
    return None


def _bullet_depth(stripped: str) -> int | None:
    if stripped.startswith("-- "):
        return 2
    if stripped.startswith("- "):
        return 1
    return None


def _append_child(item: ContentItem, depth: int, title: str) -> None:
    item.children.append({"depth": depth, "title": title})


def extract_content_items(text: str) -> tuple[list[ContentItem], list[str]]:
    items: list[ContentItem] = []
    instructor_notes: list[str] = []
    current_type = "theory"
    current_item: ContentItem | None = None
    body_lines: list[str] = []
    in_instructor = False
    saw_section_header = False
    pending_project: ContentItem | None = None

    def flush_item() -> None:
        nonlocal current_item, body_lines
        if current_item is None:
            body_lines = []
            return
        body = "\n".join(body_lines).strip()
        if body:
            current_item.body = body
        items.append(current_item)
        current_item = None
        body_lines = []

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            if current_item is not None:
                body_lines.append(line)
            continue

        if INSTRUCTOR_SECTION.search(stripped):
            flush_item()
            in_instructor = True
            continue

        if stripped.startswith(">"):
            section_type = _detect_section_type(stripped)
            if section_type:
                flush_item()
                in_instructor = False
                saw_section_header = True
                current_type = section_type
                title_match = HEADER_WITH_TITLE.match(stripped)
                if title_match:
                    title = title_match.group(1).strip()
                    current_item = ContentItem(type=current_type, title=title)
                    if current_type == "project":
                        pending_project = current_item
                continue
            if in_instructor:
                continue

        if in_instructor:
            if stripped.startswith("- "):
                instructor_notes.append(stripped[2:].strip())
            else:
                instructor_notes.append(stripped)
            continue

        if stripped.startswith("+ "):
            flush_item()
            current_item = ContentItem(
                type=current_type, title=stripped[2:].strip())
            continue

        bullet_depth = _bullet_depth(stripped)
        if bullet_depth is not None:
            title = stripped.lstrip("- ").strip()
            if current_item is not None:
                _append_child(current_item, bullet_depth, title)
            elif not saw_section_header and items and items[-1].type == "note":
                _append_child(items[-1], bullet_depth, title)
            elif not saw_section_header:
                items.append(ContentItem(type="note", title=title))
            else:
                flush_item()
                current_item = ContentItem(type=current_type, title=title)
            continue

        if NUMBERED_STEP.match(stripped):
            if current_item is not None:
                current_item.steps.append(stripped)
            elif current_type == "project":
                if pending_project is None:
                    pending_project = ContentItem(
                        type="project", title="Project steps")
                    current_item = pending_project
                else:
                    current_item = pending_project
                current_item.steps.append(stripped)
            continue

        if current_item is not None:
            body_lines.append(line)
        elif saw_section_header and current_type == "project" and pending_project:
            pending_project.body = (
                f"{pending_project.body}\n{stripped}".strip()
                if pending_project.body
                else stripped
            )

    flush_item()

    if not items and text.strip():
        items.append(ContentItem(type=current_type, title=text.strip()[:2000]))

    return items, instructor_notes


def parse_syllabus_csv(csv_path: str | Path, title: str | None = None) -> ParsedSyllabus:
    path = Path(csv_path)
    parsed_title = title or path.stem
    phases: list[str] = []
    sections: list[ParsedSection] = []
    current_phase: str | None = None
    current_section: ParsedSection | None = None
    current_module: ParsedModule | None = None

    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        next(reader, None)

        for raw_row in reader:
            row = _pad_row(list(raw_row))
            content_val = _clean(row[2])

            if content_val and content_val.startswith("---"):
                if current_module and current_section:
                    current_section.modules.append(current_module)
                    current_module = None
                current_phase = _strip_phase_title(content_val)
                if current_phase and current_phase not in phases:
                    phases.append(current_phase)
                continue

            if content_val and content_val.startswith("###"):
                if current_module and current_section:
                    current_section.modules.append(current_module)
                    current_module = None
                if current_section and current_section.modules:
                    sections.append(current_section)
                current_section = ParsedSection(
                    title=_strip_section_title(content_val),
                    phase=current_phase,
                )
                continue

            if _is_milestone_row(row):
                if current_module and current_section:
                    current_section.modules.append(current_module)
                milestone_id = _clean(row[0]) or ""
                skill_name = _extract_milestone_title(
                    milestone_id, content_val or "")
                current_module = ParsedModule(
                    week=milestone_id,
                    day=_clean(row[1]) or "",
                    skill_raw=content_val or "",
                    skill_name=skill_name,
                    skills=[skill_name],
                    is_milestone=True,
                    milestone_id=milestone_id,
                )
                block = _build_block(row)
                if _block_has_data(block):
                    current_module.blocks.append(block)
                continue

            if _is_day_row(row):
                if current_module and current_section:
                    current_section.modules.append(current_module)
                if current_section is None:
                    current_section = ParsedSection(
                        title="General", phase=current_phase)
                skill_raw = content_val or ""
                current_module = ParsedModule(
                    week=_clean(row[0]) or "",
                    day=_clean(row[1]) or "",
                    skill_raw=skill_raw,
                    skill_name=_extract_skill_name(skill_raw),
                    skills=_parse_skills(skill_raw),
                )
                continue

            if current_module is not None and content_val:
                current_module.blocks.append(_build_block(row))

    if current_module and current_section:
        current_section.modules.append(current_module)
    if current_section and (current_section.modules or current_section.title):
        sections.append(current_section)

    return ParsedSyllabus(title=parsed_title, phases=phases, sections=sections)


def _block_has_data(block: ContentBlock) -> bool:
    return bool(
        block.content
        or block.how_to_think
        or block.best_practices
        or block.patterns
        or block.anti_patterns
        or block.limitations
    )


def lessons_with_context(csv_path: str | Path) -> list[dict[str, Any]]:
    tree = parse_syllabus_csv(csv_path)
    out: list[dict[str, Any]] = []
    for section in tree.sections:
        for module in section.modules:
            out.append(
                {
                    "section": section.title,
                    "phase": section.phase,
                    **format_module(module),
                }
            )
    return out


def _merge_block_fields(blocks: list[ContentBlock]) -> dict[str, Any]:
    merged: dict[str, list[str]] = {
        "content": [],
        "how_to_think": [],
        "best_practices": [],
        "patterns": [],
        "anti_patterns": [],
        "limitations": [],
        "statuses": [],
        "instructor_notes": [],
    }
    all_items: list[ContentItem] = []

    for block in blocks:
        if block.content:
            merged["content"].append(block.content)
        for key in (
            "how_to_think",
            "best_practices",
            "patterns",
            "anti_patterns",
            "limitations",
        ):
            value = getattr(block, key)
            if value:
                merged[key].append(value)
        if block.status:
            merged["statuses"].append(block.status)
        merged["instructor_notes"].extend(block.instructor_notes)
        all_items.extend(block.items)

    result: dict[str, Any] = {
        k: "\n\n---\n\n".join(v) if v else None for k, v in merged.items()
    }
    result["contents"] = [asdict(item) for item in all_items]
    return result


def format_module(module: ParsedModule, *, include_raw: bool = False) -> dict[str, Any]:
    merged = _merge_block_fields(module.blocks)
    out: dict[str, Any] = {
        "week": module.week,
        "day": module.day,
        "is_milestone": module.is_milestone,
        "skill": module.skill_name,
        "skills": module.skills,
        "content": merged["content"],
        "how_to_think": merged["how_to_think"],
        "best_practices": merged["best_practices"],
        "patterns": merged["patterns"],
        "anti_patterns": merged["anti_patterns"],
        "limitations": merged["limitations"],
        "statuses": merged["statuses"],
        "instructor_notes": merged["instructor_notes"] or None,
        "contents": merged["contents"],
    }
    if include_raw:
        out["skill_raw"] = module.skill_raw
    if module.milestone_id:
        out["milestone_id"] = module.milestone_id
    return out


def module_ref(module: ParsedModule, section: ParsedSection) -> dict[str, Any]:
    return {
        "section": section.title,
        "phase": section.phase,
        "week": module.week,
        "day": module.day,
        "skill": module.skill_name,
        "is_milestone": module.is_milestone,
    }


def build_prior_skills(
    lessons: list[dict[str, Any]],
    idx: int,
    *,
    mode: str = "smart",
    window: int = DEFAULT_PRIOR_WINDOW,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    prior = lessons[:idx]
    total = len(prior)

    def ref(lesson: dict[str, Any]) -> dict[str, Any]:
        return {
            "section": lesson.get("section"),
            "week": lesson["week"],
            "day": lesson["day"],
            "skill": lesson["skill"],
            "is_milestone": lesson["is_milestone"],
        }

    if mode == "full":
        refs = [ref(lesson) for lesson in prior]
        return refs, {"mode": "full", "total_prior": total, "returned": len(refs)}

    if mode == "milestones":
        refs = [ref(lesson) for lesson in prior if lesson["is_milestone"]]
        return refs, {"mode": "milestones", "total_prior": total, "returned": len(refs)}

    regular_positions = [i for i, lesson in enumerate(
        prior) if not lesson["is_milestone"]]
    recent_positions = set(
        regular_positions[-window:]) if window > 0 else set()
    refs = [
        ref(lesson)
        for i, lesson in enumerate(prior)
        if lesson["is_milestone"] or i in recent_positions
    ]
    return refs, {
        "mode": "smart",
        "window": window,
        "total_prior": total,
        "returned": len(refs),
    }


def _lesson_index(lessons: list[dict[str, Any]], week: str, day: str) -> int | None:
    for i, lesson in enumerate(lessons):
        if lesson["week"] == week and lesson["day"] == day:
            return i
    return None


def syllabus_to_dict(tree: ParsedSyllabus) -> dict[str, Any]:
    return {
        "title": tree.title,
        "phases": tree.phases,
        "sections": [
            {
                "title": section.title,
                "phase": section.phase,
                "modules": [format_module(module) for module in section.modules],
            }
            for section in tree.sections
        ],
    }


def _search_haystack(lesson: dict[str, Any]) -> str:
    parts = [
        lesson.get("section") or "",
        lesson.get("skill") or "",
        lesson.get("content") or "",
        " ".join(item.get("title", "")
                 for item in lesson.get("contents") or []),
    ]
    return " ".join(parts).lower()


def _dump(data: Any, *, pretty: bool = False) -> None:
    if pretty:
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Parse 4Geeks syllabus planning CSV.")
    parser.add_argument("--csv", required=True, help="Path to planning CSV")
    parser.add_argument("--week", help="Week (e.g. 1, 0, HITO 01)")
    parser.add_argument("--day", help='Day (e.g. 1, -1, "En Syllabus")')
    parser.add_argument("--list", action="store_true", help="List all modules")
    parser.add_argument("--tree", action="store_true",
                        help="Full syllabus tree JSON")
    parser.add_argument(
        "--section",
        help="Filter --list or --tree to sections whose title contains this text",
    )
    parser.add_argument("--search", help="Keyword search (index rows)")
    parser.add_argument("--include-prior", action="store_true")
    parser.add_argument("--prior-full", action="store_true")
    parser.add_argument("--prior-milestones-only", action="store_true")
    parser.add_argument("--prior-window", type=int,
                        default=DEFAULT_PRIOR_WINDOW)
    parser.add_argument("--pretty", action="store_true")
    parser.add_argument("--include-raw", action="store_true")
    args = parser.parse_args()

    if args.prior_window < 0:
        parser.error("--prior-window must be >= 0")

    tree = parse_syllabus_csv(args.csv)
    lessons = lessons_with_context(args.csv)
    pretty = args.pretty

    def section_match(title: str) -> bool:
        if not args.section:
            return True
        return args.section.lower() in title.lower()

    if args.tree:
        filtered = {
            **syllabus_to_dict(tree),
            "sections": [
                section
                for section in syllabus_to_dict(tree)["sections"]
                if section_match(section["title"])
            ],
        }
        _dump(filtered, pretty=pretty)
        return

    if args.list:
        index = [
            module_ref(module, section)
            for section in tree.sections
            if section_match(section.title)
            for module in section.modules
        ]
        _dump(index, pretty=pretty)
        return

    if args.search:
        keyword = args.search.lower()
        matches = [
            {
                "section": lesson["section"],
                "week": lesson["week"],
                "day": lesson["day"],
                "skill": lesson["skill"],
                "is_milestone": lesson["is_milestone"],
            }
            for lesson in lessons
            if keyword in _search_haystack(lesson)
        ]
        _dump(
            {
                "query": args.search,
                "count": len(matches),
                "matches": matches,
                "next": "Run --week and --day on a match for full module context.",
            },
            pretty=pretty,
        )
        return

    if not args.week or not args.day:
        parser.error(
            "Provide --week and --day (or --list / --tree / --search).")

    idx = _lesson_index(lessons, args.week, args.day)
    if idx is None:
        _dump(
            {"error": f"No module found for week={args.week} day={args.day}"},
            pretty=pretty,
        )
        sys.exit(1)

    result: dict[str, Any] = {
        "current": {
            "section": lessons[idx]["section"],
            "phase": lessons[idx].get("phase"),
            **{k: v for k, v in lessons[idx].items() if k not in ("section", "phase")},
        }
    }
    if args.include_raw:
        result["current"]["skill_raw"] = lessons[idx].get("skill_raw")

    if args.include_prior and idx > 0:
        mode = (
            "full"
            if args.prior_full
            else "milestones"
            if args.prior_milestones_only
            else "smart"
        )
        prior, meta = build_prior_skills(
            lessons, idx, mode=mode, window=args.prior_window
        )
        result["prior_skills"] = prior
        result["prior_skills_meta"] = meta

    _dump(result, pretty=pretty)


if __name__ == "__main__":
    main()
