---
name: syllabus-planner-api
description: Operate the Syllabus Planner FastAPI backend. Use when creating syllabuses, sections, modules, metadata, skills, reordering, or exporting CSV.
---

# Syllabus Planner API

Base URL: `http://localhost:8000`

## Hierarchy

- **Syllabus (program)**: root container
- **Section / microsyllabus**: child syllabus linked to parent
- **Module**: belongs to a section; has `title` and `duration_days` (default `1`, half-days ok)
- **Content**: theory, exercise, project, or quiz inside a module

Section/program totals: `days` = sum of module `duration_days`; `hours` = `days × (hours_per_module + extra_hours_per_module)`.

## Content types

`theory`, `exercise`, `project`, `quiz`

Content text convention: single text blob, first line = title, rest = body. Backend auto-splits via `split_content_text()`.

## Endpoints

### Syllabuses

- `POST /syllabuses/` — create program
- `GET /syllabuses/` — list programs
- `GET /syllabuses/{id}` — nested tree with sections, modules (including `content_types`, `contents`), totals
- `PATCH /syllabuses/{id}` — update title/description
- `GET /syllabuses/search?q=...` — search syllabuses by title (for section import)
- `POST /syllabuses/{parent_id}/sections` — create section and attach
- `POST /syllabuses/{parent_id}/children/` — reuse existing syllabus as section
- `PATCH /syllabuses/{id}/sections/reorder` — body: `{ "ordered_ids": [2,1,3] }`
- `POST /syllabuses/{section_id}/modules` — body: `{ "title": "...", "duration_days": 0.5 }` or `{ "module_id": 1 }` (`duration_days` optional, default `1`, must be `> 0`; half-days allowed)
- `PATCH /syllabuses/{section_id}/modules/reorder` — body: `{ "ordered_ids": [3,1,2] }`
- `GET /syllabuses/{id}/export` — CSV download

### Modules

- `POST /modules/` — create module (`title`, optional `duration_days`)
- `GET /modules/{id}` — module with contents, metadata, skills, `duration_days`
- `PATCH /modules/{id}` — update title / duration_days
- `POST /modules/{id}/contents/` — add content (body auto-split from title if multiline)
- `PUT /modules/{id}/contents/{content_id}` — update content text (body: `{ "text": "..." }`)
- `PATCH /modules/{id}/contents/reorder` — reorder contents
- `PUT /modules/{id}/metadata/` — update reflective metadata
- `PUT /modules/{id}/skills` — body: `{ "skill_ids": [1,2] }`

### Skills

- `GET /skills?search=python` — autocomplete
- `POST /skills/` — create skill if missing

## Agent workflow

1. Create or fetch syllabus tree with `GET /syllabuses/{id}`
2. Add sections before modules
3. Attach modules to section IDs (not root syllabus ID)
4. Fill module metadata and skills before CSV export
5. Export with `GET /syllabuses/{id}/export`
