---
name: syllabus-planner-api
description: Operate the Syllabus Planner FastAPI backend. Use when creating syllabuses, sections, modules, metadata, skills, reordering, or exporting CSV.
---

# Syllabus Planner API

Base URL: `http://localhost:8000`

## Hierarchy

- **Syllabus (program)**: root container
- **Section / microsyllabus**: child syllabus linked to parent
- **Module**: belongs to a section
- **Content**: theory, exercise, or project inside a module

## Endpoints

### Syllabuses

- `POST /syllabuses/` — create program
- `GET /syllabuses/` — list programs
- `GET /syllabuses/{id}` — nested tree with sections, modules (including `content_types`, `contents`), totals
- `POST /syllabuses/{parent_id}/sections` — create section and attach
- `POST /syllabuses/{parent_id}/children/` — reuse existing syllabus as section
- `PATCH /syllabuses/{id}/sections/reorder` — body: `{ "ordered_ids": [2,1,3] }`
- `POST /syllabuses/{section_id}/modules` — body: `{ "title": "..." }` or `{ "module_id": 1 }`
- `PATCH /syllabuses/{section_id}/modules/reorder` — body: `{ "ordered_ids": [3,1,2] }`
- `GET /syllabuses/{id}/export` — CSV download

### Modules

- `GET /modules/{id}` — module with contents, metadata, skills
- `PATCH /modules/{id}` — update title
- `POST /modules/{id}/contents/` — add content
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
