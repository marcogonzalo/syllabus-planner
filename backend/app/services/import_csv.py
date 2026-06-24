from pathlib import Path

from sqlmodel import Session, select

from app.models import (
    Content,
    Module,
    ModuleMetadata,
    ModuleSkill,
    Skill,
    Syllabus,
    SyllabusHierarchy,
    SyllabusModule,
)
from app.services.syllabus_csv_parser import (
    ContentBlock,
    ContentItem,
    ParsedModule,
    parse_syllabus_csv,
)

# Re-export for tests and API consumers
__all__ = ["import_syllabus_from_csv", "parse_syllabus_csv"]


def _module_title(parsed_module: ParsedModule) -> str:
    if parsed_module.skill_name:
        title = parsed_module.skill_name
        if len(title) > 120:
            return title[:117] + "..."
        return title
    return f"Week {parsed_module.week} Day {parsed_module.day}"


def _content_item_to_body(item: ContentItem, max_len: int = 8000) -> str | None:
    lines: list[str] = []
    if item.body:
        lines.append(item.body)
    for child in item.children:
        indent = "  " * child["depth"]
        marker = "-- " if child["depth"] >= 2 else "- "
        lines.append(f"{indent}{marker}{child['title']}")
    lines.extend(item.steps)
    text = "\n".join(lines).strip()
    return text[:max_len] if text else None


def _normalize_content_type(content_type: str) -> str:
    if content_type in ("theory", "exercise", "project"):
        return content_type
    return "theory"


def _merge_metadata(blocks: list[ContentBlock]) -> dict[str, str | None]:
    merged: dict[str, list[str]] = {
        "how_to_think": [],
        "best_practices": [],
        "patterns": [],
        "antipatterns": [],
        "limitations": [],
    }
    for block in blocks:
        if block.how_to_think:
            merged["how_to_think"].append(block.how_to_think)
        if block.best_practices:
            merged["best_practices"].append(block.best_practices)
        if block.patterns:
            merged["patterns"].append(block.patterns)
        if block.anti_patterns:
            merged["antipatterns"].append(block.anti_patterns)
        if block.limitations:
            merged["limitations"].append(block.limitations)
    return {key: "\n\n".join(values) if values else None for key, values in merged.items()}


def _get_or_create_skill(session: Session, name: str, cache: dict[str, Skill]) -> Skill:
    if name in cache:
        return cache[name]
    existing = session.exec(select(Skill).where(Skill.name == name)).first()
    if existing:
        cache[name] = existing
        return existing
    skill = Skill(name=name)
    session.add(skill)
    session.flush()
    cache[name] = skill
    return skill


def _delete_module(session: Session, module_id: int) -> None:
    for content in session.exec(select(Content).where(Content.module_id == module_id)).all():
        session.delete(content)
    metadata = session.get(ModuleMetadata, module_id)
    if metadata:
        session.delete(metadata)
    for link in session.exec(select(ModuleSkill).where(ModuleSkill.module_id == module_id)).all():
        session.delete(link)
    for link in session.exec(select(SyllabusModule).where(SyllabusModule.module_id == module_id)).all():
        session.delete(link)
    module = session.get(Module, module_id)
    if module:
        session.delete(module)


def _delete_syllabus_tree(session: Session, syllabus_id: int) -> None:
    child_links = session.exec(
        select(SyllabusHierarchy).where(
            SyllabusHierarchy.parent_id == syllabus_id)
    ).all()
    for link in child_links:
        _delete_syllabus_tree(session, link.child_id)

    for link in session.exec(
        select(SyllabusHierarchy).where(
            SyllabusHierarchy.child_id == syllabus_id)
    ).all():
        session.delete(link)

    for link in session.exec(
        select(SyllabusModule).where(SyllabusModule.syllabus_id == syllabus_id)
    ).all():
        _delete_module(session, link.module_id)
        session.delete(link)

    syllabus = session.get(Syllabus, syllabus_id)
    if syllabus:
        session.delete(syllabus)
    session.flush()


def import_syllabus_from_csv(
    session: Session,
    csv_path: str | Path,
    *,
    title: str | None = None,
    replace_existing: bool = True,
) -> Syllabus:
    parsed = parse_syllabus_csv(csv_path, title=title)

    if replace_existing:
        existing = session.exec(
            select(Syllabus).where(Syllabus.title == parsed.title)
        ).all()
        for syllabus in existing:
            _delete_syllabus_tree(session, syllabus.id)
        session.commit()

    root = Syllabus(title=parsed.title)
    session.add(root)
    session.flush()

    skill_cache: dict[str, Skill] = {}

    for section_index, parsed_section in enumerate(parsed.sections):
        description = (
            f"Phase: {parsed_section.phase}" if parsed_section.phase else None
        )
        section = Syllabus(
            title=parsed_section.title,
            description=description,
        )
        session.add(section)
        session.flush()

        session.add(
            SyllabusHierarchy(
                parent_id=root.id,
                child_id=section.id,
                order_index=section_index,
            )
        )

        for module_index, parsed_module in enumerate(parsed_section.modules):
            module = Module(title=_module_title(parsed_module))
            session.add(module)
            session.flush()

            session.add(
                SyllabusModule(
                    syllabus_id=section.id,
                    module_id=module.id,
                    order_index=module_index,
                )
            )

            metadata_values = _merge_metadata(parsed_module.blocks)
            session.add(
                ModuleMetadata(
                    module_id=module.id,
                    how_to_think=metadata_values["how_to_think"],
                    best_practices=metadata_values["best_practices"],
                    patterns=metadata_values["patterns"],
                    antipatterns=metadata_values["antipatterns"],
                    limitations=metadata_values["limitations"],
                )
            )

            for skill_name in parsed_module.skills:
                skill = _get_or_create_skill(session, skill_name, skill_cache)
                session.add(ModuleSkill(
                    module_id=module.id, skill_id=skill.id))

            content_index = 0
            for block in parsed_module.blocks:
                for item in block.items:
                    session.add(
                        Content(
                            module_id=module.id,
                            type=_normalize_content_type(item.type),
                            title=item.title[:500],
                            body=_content_item_to_body(item),
                            order_index=content_index,
                        )
                    )
                    content_index += 1

    session.commit()
    session.refresh(root)
    return root
