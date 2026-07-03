# Syllabus CSV Reference

For full Excel rules see `course-outline-generator/ai-engineering/syllabus-md-converter/CONVERSION-RULES.md`.

## Columns (0-indexed)

| Col | Field                            |
| --- | -------------------------------- |
| 0   | Week or `HITO XX`                |
| 1   | Day or status (`En Syllabus`, …) |
| 2   | Skill / content body             |
| 3   | how_to_think                     |
| 4   | best_practices                   |
| 5   | patterns                         |
| 6   | anti_patterns                    |
| 7   | limitations                      |

Cols 8+ ignored (rubric, Learnpack URLs).

## Structure markers

```
--- PHASE ---            → phase divider
### SECTION ###          → section (maps to syllabus-planner section)
1,1,Skill: …             → module
,En Syllabus,"> Teoría:  → content block on module
HITO 01,En Syllabus,…    → milestone module
```

## Content hierarchy

```
> Teoría:
  + Topic
    - element
      -- sub-element

> Proyecto: Title
  1. step
  2. step
  + Extra activity
    - item
```

## syllabus-planner mapping

| CSV                      | DB model                                     |
| ------------------------ | -------------------------------------------- |
| `### SECTION ###`        | `Syllabus` (child of root)                   |
| Module row + blocks      | `Module` + `SyllabusModule`                  |
| `contents[]` from parser | `Content` (type, title, order_index)         |
| Cols 3–7 merged          | `ModuleMetadata`                             |
| `Skill:` lines           | `Skill` + `ModuleSkill`                      |
| `HITO XX` row            | `Module` with `is_milestone` semantics in UI |

## prior_skills modes

| Mode       | Use                                             |
| ---------- | ----------------------------------------------- |
| smart      | Default — prior hitos + last 15 regular modules |
| full       | Entire course history                           |
| milestones | Prior hitos only                                |
