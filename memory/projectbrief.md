# Project Brief

## Product

**Syllabus Planner** — 4Geeks internal tool to design, structure, and export bootcamp program syllabuses.

## Core domain

Hierarchical program structure:

```
Syllabus (program)
└── Section / microsyllabus (reusable child syllabus)
    └── Module
        ├── Contents (theory | exercise | project)
        ├── Skills (1+ per module, autocomplete or create)
        └── Metadata (reflective teaching guidelines)
```

### Section / microsyllabus

- Reusable: a syllabus can be attached as a section inside another syllabus
- Fields: title, description, hours per module, extra hours per module
- Totals: days/modules count, total hours

### Module

- Title + ordered contents
- Content types: `theory`, `exercise`, `project` (Learnpack-style schemas)
- Metadata fields: how to think, best practices, patterns, antipatterns, limitations

## Hard requirements

1. **Agents-first API** — every user action must exist as a FastAPI endpoint before frontend; document in `.cursor/skills/syllabus-planner-api.skill.md`
2. **Drag-and-drop UI** — reorder sections, modules, contents; visual grouping must distinguish hierarchy levels
3. **CSV export/import** — round-trip compatible with 4Geeks planning CSV format (`course-outline-generator` canonical file)
4. **Docker-first dev** — Postgres + backend + frontend via `docker compose`
5. **CI gate** — backend pytest + frontend lint/build must pass before PR claims

## CSV format markers (export)

| Element        | Format                 |
| -------------- | ---------------------- |
| Section title  | `### MODULE TITLE ###` |
| Theory block   | `> Theory:`            |
| Exercises      | `> Exercises`          |
| Projects       | `> Projects`           |
| Lesson/content | `+ Lesson title`       |

## Out of scope (current)

- Auth / multi-tenant
- Real-time collaboration
- Direct Learnpack integration (content schemas referenced, not synced)

## Origin

Spec from `MAIN_PROMPTS.md`. Initial stack: Tailwind + shadcn + Next.js + FastAPI. DB: Postgres in Docker (SQLite fallback for local dev/tests).
