# Project Brief

## Product

**Syllabus Planner** — 4Geeks internal tool to design, structure, and export bootcamp program syllabuses. It is a **planning and design tool**, not a content authoring platform. Users define the program structure, annotate what each content item should cover, and export the plan as CSV.

## Core domain

Hierarchical program structure:

```
Syllabus (program)
└── Section / microsyllabus (reusable child syllabus)
    └── Module
        ├── Contents (theory | exercise | project | quiz)
        ├── Skills (1+ per module, autocomplete or create)
        └── Metadata (reflective teaching guidelines)
```

### Section / microsyllabus

- Reusable: a syllabus can be attached as a section inside another syllabus
- Fields: title, description, hours per module, extra hours per module
- Totals: days/modules count, total hours

### Module

- Title + ordered contents
- Content types: `theory`, `exercise`, `project`, `quiz`
- Metadata fields: how to think, best practices, patterns, antipatterns, limitations

### Content (text-only annotations)

- Single text blob: first line = title, rest = body (split on save via `split_content_text`)
- Users write annotations about what to develop for that content
- All elements are drag-and-drop reorderable within and across modules

## UX requirements

- **Inline click-to-edit** — titles and content text edited in place (no modals)
- **Quick-add buttons** — "Add Lesson", "Add Exercise", "Add Project", "Add Quiz" per module
- **Section creation** — two options: "New section" or "Import existing syllabus"
- **Drag-and-drop** — reorder sections, modules, contents with visual feedback

## Hard requirements

1. **Agents-first API** — every user action must exist as a FastAPI endpoint before frontend; document in `.cursor/skills/syllabus-planner-api.skill.md`
2. **Drag-and-drop UI** — reorder sections, modules, contents; visual grouping must distinguish hierarchy levels
3. **CSV export/import** — round-trip compatible with 4Geeks planning CSV format (`course-outline-generator` canonical file)
4. **Docker-first dev** — Postgres + backend + frontend via `docker compose`
5. **CI gate** — backend pytest + frontend test/lint/build must pass before PR claims

## CSV format markers (export)

| Element        | Format                 |
| -------------- | ---------------------- |
| Section title  | `### MODULE TITLE ###` |
| Theory block   | `> Theory:`            |
| Exercises      | `> Exercises`          |
| Projects       | `> Projects`           |
| Quizzes        | `> Quizzes`            |
| Lesson/content | `+ Lesson title`       |

## Out of scope (current)

- Auth / multi-tenant
- Real-time collaboration
- Direct Learnpack integration (content schemas referenced, not synced)
- Cross-section content drag (move content between modules in different sections)

## Origin

Spec from `MAIN_PROMPTS.md`. Initial stack: Tailwind + shadcn + Next.js + FastAPI. DB: Postgres in Docker (SQLite fallback for local dev/tests).
