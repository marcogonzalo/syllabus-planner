# Memory Bank — Syllabus Planner

Persistent project context for AI agents and developers. Read these files at the start of every session.

## File map

| File                                     | Purpose                               | Update when                      |
| ---------------------------------------- | ------------------------------------- | -------------------------------- |
| [projectbrief.md](./projectbrief.md)     | Scope, requirements, constraints      | Goals or scope change            |
| [productContext.md](./productContext.md) | Why it exists, user problems          | Product direction shifts         |
| [systemPatterns.md](./systemPatterns.md) | Architecture, conventions, data model | Structural or pattern changes    |
| [techContext.md](./techContext.md)       | Stack, tooling, env, commands         | Dependencies or infra change     |
| [activeContext.md](./activeContext.md)   | Current focus, recent decisions       | Each work session                |
| [progress.md](./progress.md)             | Done vs pending, known issues         | Features land or blockers appear |

## Reading order

1. `projectbrief.md` — what we're building
2. `systemPatterns.md` + `techContext.md` — how we build it
3. `activeContext.md` + `progress.md` — where we are now

## Related agent resources

- API operations: `.cursor/skills/syllabus-planner-api.skill.md`
- CSV format: `.cursor/skills/syllabus-csv-reader/SKILL.md`
- CI before PR: `.cursor/skills/syllabus-planner-ci/SKILL.md`
- Cursor rules: `.cursor/rules/`

## Maintenance rule

After meaningful work, update `activeContext.md` and `progress.md`. Update other files only when their domain changes.
