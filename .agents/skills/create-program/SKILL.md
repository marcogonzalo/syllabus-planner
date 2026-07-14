---
name: create-program
description: >-
  Creates a Syllabus Planner program (root syllabus) by calling the API with a
  title and optional description, hours_per_module, extra_hours_per_module. Use
  when the user asks to create a program, new program, new syllabus, or start a
  course/program structure.
---

# Create Program

To create a program call the API service passing a title.

## Endpoint

```
POST http://localhost:8000/syllabuses/
Content-Type: application/json

{
  "title": "<title>",
  "description": "<description>",
  "hours_per_module": <int>,
  "extra_hours_per_module": <int>
}
```

| Field                    | Required | Type   |
| ------------------------ | -------- | ------ |
| `title`                  | yes      | string |
| `description`            | no       | string |
| `hours_per_module`       | no       | int    |
| `extra_hours_per_module` | no       | int    |

Omit optional fields when unused. Do not send `null` unless intentional.

## Steps

1. Get program `title` from user (ask if missing).
2. Ask for optional `description`, `hours_per_module`, `extra_hours_per_module` only if useful — skip if user gave none.
3. `POST /syllabuses/` with body containing `title` plus any optionals provided.
4. Return created program (`id`, `title`, and any set optionals).

## Example

Minimal:

```bash
curl -s -X POST http://localhost:8000/syllabuses/ \
  -H "Content-Type: application/json" \
  -d '{"title": "AI Engineering"}'
```

With optionals:

```bash
curl -s -X POST http://localhost:8000/syllabuses/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Engineering",
    "description": "Full AI engineering track",
    "hours_per_module": 4,
    "extra_hours_per_module": 2
  }'
```

## Notes

- Program = root syllabus (not a section). Sections use `POST /syllabuses/{parent_id}/sections`.
- Full API surface: see [syllabus-planner-api.skill.md](../syllabus-planner-api.skill.md).
