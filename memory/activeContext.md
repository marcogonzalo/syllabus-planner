# Active Context

> Last updated: 2026-06-24

## Current state

Initial scaffold complete. Monorepo has working backend API, frontend planner UI, Docker Compose, agent skills, and test suite. Repo not yet committed to git (all files untracked at memory bank creation).

## Recent focus

- Memory bank created for persistent agent context
- Core features implemented: CRUD syllabuses/sections/modules/contents, metadata, skills, reorder, CSV export/import
- Drag-and-drop UI with SyllabusTree + ModuleEditor

## Active decisions

- **Agents-first:** API skill documents all endpoints; frontend follows
- **Postgres in Docker, SQLite fallback** for simple local/test runs
- **Section = child Syllabus** via `syllabus_hierarchy` (not separate table)
- **Content body split** from legacy combined titles via `content_display.py`

## Next likely work

- Git init / first commit
- GitHub CI workflow (`.github/workflows/ci.yml` referenced but may not exist yet)
- CSV import UI (backend import exists; frontend may be partial)
- Auth if multi-user needed later

## Watchouts

- `.env` must not be committed
- Run CI skill before any PR claim
- CSV format changes must stay synced with `course-outline-generator` canonical file
- Frontend README still has generic create-next-app text (not project-specific)

## Session handoff

When resuming: read `progress.md`, run `docker compose up` or local dev servers, verify with CI script.
