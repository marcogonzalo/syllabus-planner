# Progress

> Last updated: 2026-06-24

## Done

### Backend

- [x] SQLModel schema (syllabus, hierarchy, modules, contents, metadata, skills)
- [x] FastAPI routers: syllabuses, modules, skills
- [x] Nested tree builder with totals
- [x] Section/module/content reorder endpoints
- [x] CSV export (`export.py`)
- [x] CSV import (`import_csv.py`, `syllabus_csv_parser.py`)
- [x] Content body migration + legacy title backfill
- [x] Health check `GET /health`
- [x] Pytest suite (syllabuses, modules, tree, export, import, content_display, models)
- [x] Docker backend image
- [x] CLI import script (`backend/scripts/import_syllabus.py`)

### Frontend

- [x] Next.js App Router scaffold with shadcn/ui
- [x] SyllabusPlanner main view
- [x] SyllabusTree with drag-and-drop (sections, modules)
- [x] ModuleEditor (contents, metadata, skills)
- [x] API client (`src/lib/api.ts`)
- [x] TypeScript types mirroring backend
- [x] Content type icons
- [x] CSV export button
- [x] Docker frontend image

### DevOps / Agent tooling

- [x] docker-compose.yml (db + backend + frontend)
- [x] `.env.example`
- [x] Cursor rules (stack, backend, frontend, CI)
- [x] Agent skills (API, CSV reader, CI)
- [x] Memory bank (this folder)

## In progress / unknown

- [ ] Git history / remote repo setup
- [ ] GitHub Actions CI workflow
- [ ] CSV import from frontend UI
- [ ] Production deployment config

## Known issues

- None documented yet — run CI to establish baseline

## Test coverage areas

| Area            | Test file                 |
| --------------- | ------------------------- |
| Syllabus CRUD   | `test_syllabuses.py`      |
| Module ops      | `test_modules.py`         |
| Tree building   | `test_tree.py`            |
| CSV export      | `test_export.py`          |
| CSV import      | `test_import.py`          |
| Content display | `test_content_display.py` |
| Models          | `test_models.py`          |

## Verification command

```bash
.cursor/skills/syllabus-planner-ci/scripts/run-ci.sh
```
