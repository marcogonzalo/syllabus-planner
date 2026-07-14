---
name: add-module-to-section
description: >-
  Adds a module to a Syllabus Planner section with a title and duration in days
  (half-days allowed). Use when the user asks to add a module, attach a module to
  a section, or set module duration_days.
---

# Add Module to Section

A module can be added to a section giving its title and the numeric duration in days (half day is possible).

Base URL: `http://localhost:8000`

## Endpoint

```
POST /syllabuses/{section_id}/modules
Content-Type: application/json

{
  "title": "<title>",
  "duration_days": <number>,
  "order_index": <int>
}
```

Or reuse existing module:

```
{ "module_id": <int>, "duration_days": <number>, "order_index": <int> }
```

| Field           | Required | Type        | Notes                               |
| --------------- | -------- | ----------- | ----------------------------------- |
| `title`         | yes\*    | string      | required unless `module_id`         |
| `module_id`     | yes\*    | int         | required unless `title`             |
| `duration_days` | no       | float `> 0` | default `1`; use `0.5` for half day |
| `order_index`   | no       | int         | default `0`                         |

Need `section_id` (section / child syllabus id — not root program id unless modules hang there). Ask if missing.

## Steps

1. Get `section_id` (ask if missing).
2. Get `title` (or `module_id` to reuse).
3. Get `duration_days` (default `1` if omitted; allow `0.5`).
4. `POST /syllabuses/{section_id}/modules`.
5. Return module `id`, `title`, `duration_days`.

## Example

```bash
curl -s -X POST http://localhost:8000/syllabuses/2/modules \
  -H "Content-Type: application/json" \
  -d '{"title": "Warmup", "duration_days": 0.5}'
```

## Totals

Section/program `totals.days` = sum of module `duration_days`.  
`totals.hours` = `days × (hours_per_module + extra_hours_per_module)`.

## Notes

- Create module alone: `POST /modules/` with same `title` / `duration_days`.
- Full API: see [syllabus-planner-api.skill.md](../syllabus-planner-api.skill.md).
