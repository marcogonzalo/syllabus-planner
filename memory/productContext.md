# Product Context

## Problem

4Geeks curriculum teams plan bootcamp programs in large CSV spreadsheets. Editing structure (sections, modules, content blocks, teaching metadata) is error-prone and hard to reuse across programs.

## Solution

A structured planner with:

- Visual hierarchy (sections → modules → contents)
- Drag-and-drop reordering
- Module metadata for pedagogical intent (skills, thinking frameworks, patterns)
- Section reuse as microsyllabuses
- One-click CSV export matching existing planning format

## Users

- **Curriculum designers** — build and reorganize program structure
- **AI agents** — operate via REST API to create/edit/export syllabuses programmatically

## UX principles

- Sections, modules, and contents must be visually distinct
- Dark mode default; light mode supported
- Module editor panel for contents, metadata, and skills
- Syllabus tree on left; detail/editor on right

## Success criteria

- Create a full program with sections, modules, contents, metadata, skills
- Reorder any level via drag-and-drop
- Export CSV that re-imports or matches `course-outline-generator` format
- Agents can complete full workflow without UI

## Reference data

Canonical CSV: `../course-outline-generator/ai-engineering/New Syllabus AI Engineer - Planificación del programa.csv`

Test fixture: `backend/tests/fixtures/sample_syllabus.csv`
