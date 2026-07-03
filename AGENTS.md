# Syllabus Planner — Agent Guide

Compact reference for AI agents working in this repo. See `memory/` for full context, `.cursor/rules/` for per-area conventions, `.cursor/skills/` for runnable workflows.

## Stack

| Layer    | Tech                                                      | Package manager |
| -------- | --------------------------------------------------------- | --------------- |
| Frontend | Next.js 16, React 19, TS, Tailwind 4, shadcn/ui, @dnd-kit | **pnpm**        |
| Backend  | FastAPI, SQLModel, Pydantic v2, uvicorn                   | **uv**          |
| Database | Postgres 16 (Docker) / SQLite (local fallback)            | —               |

**Never:** npm/yarn/bun (frontend) · pip/poetry/pipenv (backend)

## Commands

```bash
# Full CI (must pass before any PR claim)
.cursor/skills/syllabus-planner-ci/scripts/run-ci.sh

# Backend (from backend/)
uv sync --extra dev         # install deps
uv run python -m pytest     # tests
uv run uvicorn app.main:app --reload --port 8000   # dev server

# Frontend (from frontend/)
pnpm install --frozen-lockfile
pnpm dev          # dev server :3000
pnpm test         # vitest
pnpm lint
pnpm build
```

## Docker Compose (preferred dev workflow)

```bash
# Dev with live reload + local Postgres:
docker compose --profile local-db up --build

# Attach Python debugger (port 5678):
DEBUGPY_ENABLE=1 docker compose --profile local-db up --build
```

Env from `.env` (see `.env.example`). Key vars: `DATABASE_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`.

## Architecture

- **Section = child Syllabus** (same `syllabus` table; hierarchy via `syllabus_hierarchy` join table)
- Root programs are syllabuses that never appear as `child_id` in hierarchy
- Content types: `theory`, `exercise`, `project`, `quiz`
- Content model: first line = title, rest = body (single textarea, split on save)
- Reorder pattern: `PATCH .../reorder` with `{ "ordered_ids": [...] }`
- Inline editing: click text to edit in place (no modals)

## Agents-first rule

Every user-facing action must exist as a FastAPI endpoint before being wired in the frontend. When adding endpoints, update `.cursor/skills/syllabus-planner-api.skill.md` first.

## CSV round-trip

Export (GET `/syllabuses/{id}/export`) and import (`backend/scripts/import_syllabus.py`) must match the canonical format in `course-outline-generator/ai-engineering/`. Parsing conventions are in `.cursor/skills/syllabus-csv-reader/SKILL.md`.

## Key files

| What               | Path                                           |
| ------------------ | ---------------------------------------------- |
| API skill          | `.cursor/skills/syllabus-planner-api.skill.md` |
| CI skill           | `.cursor/skills/syllabus-planner-ci/SKILL.md`  |
| Backend entry      | `backend/app/main.py`                          |
| DB schema + models | `backend/app/models.py`                        |
| Pydantic schemas   | `backend/app/schemas.py`                       |
| API client         | `frontend/src/lib/api.ts`                      |
| Frontend app       | `frontend/src/app/`                            |
| CLI import script  | `backend/scripts/import_syllabus.py`           |

## Do not do / Restrictions

- Never install dependencies without notifying.
- Don't modify files directly if are not related to the requested feature or task.
- Avoid using `any` in TypeScript; use it only when absolutely necessary and justified.
- Never publish or deploy `.env` files or any other secrets to the repository.

## Reading order (memory bank)

1. `memory/projectbrief.md` — scope + requirements
2. `memory/systemPatterns.md` — architecture + data model
3. `memory/techContext.md` — setup + commands
4. `memory/activeContext.md` — current focus
5. `memory/progress.md` — status + known issues

Update `activeContext.md` and `progress.md` after each work session.
