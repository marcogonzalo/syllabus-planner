# Tech Context

## Stack

| Layer    | Tech                                                    | Package manager |
| -------- | ------------------------------------------------------- | --------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui | **pnpm**        |
| Backend  | FastAPI, SQLModel, Pydantic v2, uvicorn                 | **uv**          |
| Database | Postgres 16 (Docker) / SQLite (local fallback)          | —               |
| DnD      | @dnd-kit/core, @dnd-kit/sortable                        | —               |

**Never use:** npm, yarn, bun (frontend) | pip, poetry, pipenv (backend)

## Docker Compose

```bash
docker compose up --build
```

| Service  | Port | Notes                        |
| -------- | ---- | ---------------------------- |
| db       | 5432 | Postgres, profile `local-db` |
| backend  | 8000 | FastAPI                      |
| frontend | 3000 | Next.js                      |

Env from `.env` (see `.env.example`). Key vars:

- `DATABASE_URL` — Postgres connection string
- `CORS_ORIGINS` — default `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` — default `http://localhost:8000`

## Local commands

### Backend

```bash
cd backend
uv sync --extra dev
uv run pytest
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev          # :3000
pnpm lint
pnpm build
```

### CI (full)

```bash
.cursor/skills/syllabus-planner-ci/scripts/run-ci.sh
```

## Backend config

`backend/app/database.py`:

- `DATABASE_URL` env → defaults to `sqlite:///./syllabus_planner.db`
- Auto-normalizes `postgresql://` → `postgresql+psycopg://`
- `init_db()` on startup: create tables, migrate `content.body`, backfill legacy titles

## Frontend config

- API base: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`
- Dark mode default (see `globals.css`, layout)
- Path alias: `@/` → `src/`

## Python version

`>=3.11` per `backend/pyproject.toml`

## Debug setup (user preference)

- Docker-based environments for dev, test, production-like runs
- debugpy for Python editor debugging in Docker
- `print('var_name', var_name)` for console debugging

## Cursor agent infrastructure

| Resource           | Path                                           |
| ------------------ | ---------------------------------------------- |
| Project stack rule | `.cursor/rules/project-stack.mdc`              |
| Backend rule       | `.cursor/rules/backend-fastapi.mdc`            |
| Frontend rule      | `.cursor/rules/frontend-nextjs.mdc`            |
| CI/PR rule         | `.cursor/rules/ci-pr-workflow.mdc`             |
| API skill          | `.cursor/skills/syllabus-planner-api.skill.md` |
| CSV reader skill   | `.cursor/skills/syllabus-csv-reader/SKILL.md`  |
| CI skill           | `.cursor/skills/syllabus-planner-ci/SKILL.md`  |
