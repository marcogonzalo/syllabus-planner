---
name: add-section-to-syllabus
description: >-
  Adds a section to a Syllabus Planner syllabus — either create a new section or
  link an existing syllabus as a section. Use when the user asks to add a
  section, attach a microsyllabus, import a section, or link an existing
  syllabus under a program.
---

# Add Section

Add section to syllabus. It can be a new one or an existing one.

Base URL: `http://localhost:8000`

## Choose path

| Intent                           | Endpoint                                 |
| -------------------------------- | ---------------------------------------- |
| **New** section                  | `POST /syllabuses/{parent_id}/sections`  |
| **Existing** syllabus as section | `POST /syllabuses/{parent_id}/children/` |

Need `parent_id` (program/syllabus id). Ask if missing.

---

## New section

```
POST /syllabuses/{parent_id}/sections
Content-Type: application/json

{
  "title": "<title>",
  "description": "<description>",
  "hours_per_module": <int>,
  "extra_hours_per_module": <int>,
  "order_index": <int>
}
```

| Field                    | Required | Type   | Default |
| ------------------------ | -------- | ------ | ------- |
| `title`                  | yes      | string | —       |
| `description`            | no       | string | —       |
| `hours_per_module`       | no       | int    | —       |
| `extra_hours_per_module` | no       | int    | —       |
| `order_index`            | no       | int    | `0`     |

Omit unused optionals. Response = full parent syllabus detail (includes new section).

```bash
curl -s -X POST http://localhost:8000/syllabuses/1/sections \
  -H "Content-Type: application/json" \
  -d '{"title": "Foundations", "order_index": 0}'
```

---

## Existing section

Find candidate first (optional):

```
GET /syllabuses/search?q=<query>
```

Then link:

```
POST /syllabuses/{parent_id}/children/
Content-Type: application/json

{ "child_id": <int>, "order_index": <int> }
```

| Field         | Required | Type | Default |
| ------------- | -------- | ---- | ------- |
| `child_id`    | yes      | int  | —       |
| `order_index` | no       | int  | `0`     |

`409` if already linked.

```bash
curl -s -X POST http://localhost:8000/syllabuses/1/children/ \
  -H "Content-Type: application/json" \
  -d '{"child_id": 5, "order_index": 0}'
```

---

## Steps

1. Get `parent_id` (ask if missing).
2. Ask: **new** section or **existing** syllabus?
3. **New** → collect `title` (+ optionals) → `POST .../sections`.
4. **Existing** → get `child_id` (search if needed) → `POST .../children/`.
5. Report linked section id / updated parent tree.

## Notes

- Section = child syllabus in hierarchy (same `syllabus` table).
- Modules attach to section ids, not root program id.
- Full API: see [syllabus-planner-api.skill.md](../syllabus-planner-api.skill.md).
