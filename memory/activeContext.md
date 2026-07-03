# Active Context

> Last updated: 2026-07-02

## Current state

UI/UX polish phase complete. Inline editing, quick-add content buttons, section import UX, and quiz content type all implemented. Frontend tests added and CI updated.

## Recent focus

- Added `quiz` as 4th content type (backend + frontend)
- Content model: single textarea, first line = title, rest = body (`split_content_text`)
- Inline click-to-edit for section titles, module titles, and content text
- Quick-add buttons per content type (lesson, exercise, project, quiz)
- Section creation: "New section" vs "Import existing syllabus" with search
- Frontend tests: Vitest + RTL with 15 tests (InlineEditor, ContentTypeIcon, content utils)
- CI updated to include `pnpm test` step
- Backend tests: 30 passing (added quiz, content update, syllabus update, search tests)

## Active decisions

- **Agents-first:** API skill documents all endpoints; frontend follows
- **Postgres in Docker, SQLite fallback** for simple local/test runs
- **Section = child Syllabus** via `syllabus_hierarchy` (not separate table)
- **Content body split** from legacy combined titles via `content_display.py`
- **Inline editing** preferred over modals for all text fields
- **Cross-section content drag** deferred (not yet implemented)

## Next likely work

- Visual polish: better drag handles, drop indicators, animations
- Keyboard shortcuts for content creation
- CSV import from frontend UI
- Production deployment decision

## Watchouts

- `.env` must not be committed
- Run CI skill before any PR claim
- CSV format changes must stay synced with `course-outline-generator` canonical file
- Content type validation in `schemas.py` — add new types to `CONTENT_TYPES` tuple

## Session handoff

When resuming: read `progress.md`, run `docker compose up` or local dev servers, verify with CI script.
