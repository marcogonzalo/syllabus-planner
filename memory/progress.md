# Progress

> Last updated: 2026-07-02

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
- [x] `quiz` content type (schemas, export, import)
- [x] Content update endpoint: `PUT /modules/{id}/contents/{content_id}` with text auto-split
- [x] Syllabus update endpoint: `PATCH /syllabuses/{id}`
- [x] Syllabus search endpoint: `GET /syllabuses/search?q=...`
- [x] `split_content_text()` utility for first-line=title, rest=body

### Frontend

- [x] Next.js App Router scaffold with shadcn/ui
- [x] SyllabusPlanner main view
- [x] SyllabusTree with drag-and-drop (sections, modules)
- [x] ModuleEditor (contents, metadata, skills)
- [x] API client (`src/lib/api.ts`)
- [x] TypeScript types mirroring backend
- [x] Content type icons (including quiz)
- [x] CSV export button
- [x] Docker frontend image
- [x] InlineEditor component (click-to-edit for titles and content)
- [x] Quick-add content buttons (lesson, exercise, project, quiz)
- [x] Section creation: "New section" vs "Import existing syllabus" with search
- [x] Content editing: single textarea, first line = title, rest = body
- [x] Vitest + React Testing Library setup
- [x] 15 frontend tests (InlineEditor, ContentTypeIcon, content utils)

### DevOps / Agent tooling

- [x] docker-compose.yml (dev stack with live reload)
- [x] docker-compose.prod.yml (production stack)
- [x] `.env.example`
- [x] Cursor rules (stack, backend, frontend, CI)
- [x] Agent skills (API, CSV reader, CI)
- [x] Memory bank (this folder)
- [x] CI workflow: backend pytest + frontend test + lint + build

## In progress / unknown

- [ ] Visual polish: better drag handles, drop indicators, animations
- [ ] Keyboard shortcuts for content creation
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
| InlineEditor    | `InlineEditor.test.tsx`   |
| ContentTypeIcon | `ContentTypeIcon.test.tsx`|
| Content utils   | `content.test.ts`         |

## Verification command

```bash
.cursor/skills/syllabus-planner-ci/scripts/run-ci.sh
```
