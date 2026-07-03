---
name: syllabus-csv-reader
description: >-
  Parses 4Geeks syllabus planning CSV for syllabus-planner: sections, modules,
  structured contents (theory/project/exercise), thinking framework, prior skills,
  and milestones. Use when importing CSV into syllabus-planner, debugging
  import_csv.py, reading week/day context, listing modules, parsing > Teoría /
  > Proyecto blocks, or hitos. Official CSV lives in course-outline-generator.
---

# Syllabus CSV Reader (syllabus-planner)

Canonical parser skill for **syllabus-planner**. Reads planning CSV — not `syllabus.md`.

## Official CSV (external)

| File                                                                                                   | Role                           |
| ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `../course-outline-generator/ai-engineering/New Syllabus AI Engineer - Planificación del programa.csv` | Source of truth                |
| `syllabus-planner/backend/tests/fixtures/sample_syllabus.csv`                                          | Minimal fixture for unit tests |

## When to use

- Import or validate syllabus structure before/alongside `backend/app/services/import_csv.py`
- Inspect sections → modules → contents tree (`--tree`)
- Query one module by week/day or HITO
- Debug content extraction (`+`, `-`, `--`, numbered project steps)

## Script

`.cursor/skills/syllabus-csv-reader/scripts/parse_syllabus_csv.py` — stdlib only.

```bash
cd syllabus-planner/.cursor/skills/syllabus-csv-reader/scripts

CSV="../../../../course-outline-generator/ai-engineering/New Syllabus AI Engineer - Planificación del programa.csv"

python3 parse_syllabus_csv.py --csv "$CSV" --list
python3 parse_syllabus_csv.py --csv "$CSV" --tree --section "WEB UI" --pretty
python3 parse_syllabus_csv.py --csv "$CSV" --week 1 --day 1 --include-prior
python3 parse_syllabus_csv.py --csv "$CSV" --week "HITO 01" --day "En Syllabus"
python3 parse_syllabus_csv.py --csv "$CSV" --search "tailwind"
```

### Flags

| Flag                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `--list`                  | Index: section, phase, week, day, skill, is_milestone |
| `--tree`                  | Full JSON tree with parsed `contents`                 |
| `--section "WEB UI"`      | Filter by section title substring                     |
| `--week` / `--day`        | Single module (quote values with spaces)              |
| `--include-prior`         | Add `prior_skills` (smart default)                    |
| `--prior-full`            | All prior modules                                     |
| `--prior-milestones-only` | Prior hitos only                                      |
| `--prior-window N`        | Smart mode window (default 15)                        |
| `--pretty`                | Indented JSON                                         |

## Output (module query)

Key fields in `current`:

- `section`, `phase`, `week`, `day`, `skill`, `skills`
- `content` — raw merged blocks (`---` separated)
- `how_to_think`, `best_practices`, `patterns`, `anti_patterns`, `limitations`
- `instructor_notes` — from `> Instrucciones al profesor` (not student content)
- `contents` — parsed items: `type`, `title`, `children` (depth 1/2), `steps`, `body`

## Parsing rules

Unified from syllabus-planner `import_csv.py` + course-outline-generator context-reader patterns.

### Rows (first match wins)

| Pattern                                                     | Result                         |
| ----------------------------------------------------------- | ------------------------------ |
| Col C `---`                                                 | Phase; flush module            |
| Col C `###`                                                 | Section; flush module          |
| Col A `HITO`                                                | Milestone module               |
| Week + day + `Skill:` (or numeric week/day, not status day) | Module header                  |
| Empty week + status day (`En Syllabus`, …)                  | Detail block on current module |

### Content markers

| Marker                                   | Meaning                        |
| ---------------------------------------- | ------------------------------ |
| `> Teoría` / `> Proyecto` / `> Práctica` | Section type                   |
| `> Proyecto 1: Title`                    | Title on same line (extracted) |
| `> Instrucciones al profesor`            | → `instructor_notes`           |
| `+ Title`                                | Content item                   |
| `-` / `--`                               | Child depth 1 / 2              |
| `1. step`                                | Project step                   |
| `-` before first `>`                     | `type: "note"`                 |

## Agent workflow

```text
1. --search or --list to locate week/day
2. --week X --day Y --include-prior
3. Map current.contents → syllabus-planner Content records
4. Map metadata columns → ModuleMetadata
5. prior_skills = ceiling for prerequisite assumptions
```

## Tests

```bash
cd syllabus-planner/.cursor/skills/syllabus-csv-reader/scripts
python3 -m unittest test_parse_syllabus_csv.py -v
```

## Backend integration

Target: `backend/app/services/import_csv.py` should import from this parser (or share module) instead of duplicating logic.

More conventions: [reference.md](reference.md)
