# System Patterns

## Monorepo layout

```
syllabus-planner/
├── backend/          FastAPI + SQLModel
├── frontend/         Next.js App Router + shadcn
├── docker-compose.yml          dev stack (live reload)
├── docker-compose.prod.yml     production stack
├── .cursor/          rules + agent skills
└── memory-bank/      this context
```

## Data model

All entities in `backend/app/models.py`:

| Table                | Role                                                           |
| -------------------- | -------------------------------------------------------------- |
| `syllabus`           | Program or section (same table; sections linked via hierarchy) |
| `syllabus_hierarchy` | parent→child section links + `order_index`                     |
| `module`             | Module title                                                   |
| `syllabus_module`    | section→module links + `order_index`                           |
| `content`            | module contents: `type`, `title`, `body`, `order_index`        |
| `module_metadata`    | reflective fields (1:1 with module)                            |
| `skill`              | skill catalog                                                  |
| `module_skill`       | module↔skill M:N                                               |

**Key pattern:** Sections are `Syllabus` rows linked to parent via `SyllabusHierarchy`. Root programs are syllabuses not appearing as `child_id` in hierarchy.

## Content model

Content types: `theory`, `exercise`, `project`, `quiz`

Content text convention: single textarea, first line = title, rest = body. Backend auto-splits via `split_content_text()` in `content_display.py`. The `title` column stores the first line; `body` stores the rest.

Validation: `schemas.py` uses `CONTENT_TYPES = ("theory", "exercise", "project", "quiz")` with `field_validator`.

## Backend layers

```
routers/     HTTP handlers, validation, HTTP errors
services/    Business logic (tree building, export, import, display)
schemas.py   Pydantic request/response models
database.py  Engine, session, migrations, settings
```

### Key services

- `syllabus_tree.py` — nested tree assembly, reorder, module summaries
- `export.py` — CSV generation
- `import_csv.py` — CSV import
- `syllabus_csv_parser.py` — CSV parsing
- `content_display.py` — title/body splitting (`split_content_text`, `split_legacy_content_title`)

## API design

- Prefix: `/syllabuses`, `/modules`, `/skills`
- Reorder endpoints: `PATCH .../reorder` with `{ "ordered_ids": [...] }`
- Tree detail: `GET /syllabuses/{id}` returns nested sections + modules + contents + totals
- Export: `GET /syllabuses/{id}/export` → streaming CSV
- Search: `GET /syllabuses/search?q=...` → find syllabuses by title (for section import)
- Content update: `PUT /modules/{id}/contents/{content_id}` with `{ "text": "..." }` (auto-splits title/body)
- Syllabus update: `PATCH /syllabuses/{id}` with `{ "title": "..." }`

Full endpoint list: `.cursor/skills/syllabus-planner-api.skill.md`

## Frontend patterns

- `src/lib/api.ts` — fetch wrapper against `NEXT_PUBLIC_API_URL`
- `src/types/index.ts` — mirrors backend response shapes
- `@dnd-kit` for drag-and-drop (sections, modules, contents)
- Components: `SyllabusPlanner` (orchestrator), `SyllabusTree`, `ModuleEditor`, `SectionCard`, `DraggableItem`, `InlineEditor`
- Inline editing: `InlineEditor` component for click-to-edit titles and content text
- Section creation: dropdown with "New section" vs "Import existing syllabus" (search + attach)

## Agents-first workflow

1. Add/update backend endpoint + tests
2. Update `syllabus-planner-api.skill.md`
3. Wire frontend via `api.ts`

Never ship frontend-only features without API backing.

## CSV round-trip

- Export: `backend/app/services/export.py`
- Import: `backend/app/services/import_csv.py`
- Standalone parser skill: `.cursor/skills/syllabus-csv-reader/`
- Format must match `course-outline-generator` planning CSV

## Testing

- Backend: pytest in `backend/tests/` — TDD, >80% coverage target on app code
- Frontend: Vitest + React Testing Library in `frontend/src/`
- Test files: `test_syllabuses`, `test_modules`, `test_tree`, `test_export`, `test_import`, `test_content_display`, `test_models`
- Frontend tests: `InlineEditor.test.tsx`, `ContentTypeIcon.test.tsx`, `content.test.ts`
- Fixture CSV: `backend/tests/fixtures/sample_syllabus.csv`

## CI

`.cursor/skills/syllabus-planner-ci/scripts/run-ci.sh` — backend pytest + frontend test + lint + build. Mandatory before PR.
