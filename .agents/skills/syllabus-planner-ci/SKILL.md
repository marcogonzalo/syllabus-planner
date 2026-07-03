---
name: syllabus-planner-ci
description: >-
  Runs syllabus-planner CI locally (backend pytest, frontend lint + build) before
  PRs and after code changes. Use when creating or updating a pull request,
  before claiming work is complete, when the user asks to run CI, or after pushing
  new commits to an open PR.
---

# Syllabus Planner CI

Local CI mirror. Agent must **run** checks and show evidence — no claims without output.

## When to use

| Trigger                       | Action                                            |
| ----------------------------- | ------------------------------------------------- |
| User asks to create a PR      | Run **Pre-PR workflow**                           |
| User asks to run CI / verify  | Run script, report results                        |
| Work marked complete          | Run script before saying done                     |
| New commits pushed to open PR | Run script, then **ask user** to re-run GitHub CI |

## Pre-PR workflow

```text
1. Run scripts/run-ci.sh from repo root (see below)
2. If any step fails → fix → re-run from step 1
3. Only when exit 0 → create PR (include test plan in body)
4. Never commit .env or credentials
```

## Run CI

From `syllabus-planner/`:

```bash
.cursor/skills/syllabus-planner-ci/scripts/run-ci.sh
```

Or step by step:

```bash
# Backend (uv)
cd backend && uv sync --extra dev && uv run python -m pytest

# Frontend (pnpm)
cd frontend && pnpm install --frozen-lockfile && pnpm lint && pnpm build
```

## Report format

After running, report with evidence:

```markdown
## CI results

| Check          | Status    | Evidence                    |
| -------------- | --------- | --------------------------- |
| Backend tests  | pass/fail | `N passed` or error excerpt |
| Frontend lint  | pass/fail | exit code / error count     |
| Frontend build | pass/fail | exit code                   |

**Verdict:** ready for PR / blocked — [reason]
```

Do not use "should pass", "looks good", or prior run results.

## After PR gets new commits

1. Re-run `run-ci.sh` on latest branch.
2. Ask user verbatim:

> New commits pushed. Please re-run the CI workflow on this PR and confirm all checks pass.

Do not treat the PR as merge-ready until user confirms GitHub CI on the latest commit.

## Tooling rules

- Backend: **uv** only (`uv sync`, `uv run pytest`)
- Frontend: **pnpm** only (`pnpm lint`, `pnpm build`)
- If `.github/workflows/ci.yml` exists, align `run-ci.sh` with it

## Failure handling

- **pytest fail** → fix backend code/tests, re-run backend only first, then full script
- **lint fail** → fix ESLint issues in `frontend/`, re-run `pnpm lint`
- **build fail** → fix TypeScript/Next errors, re-run `pnpm build`
- **missing uv/pnpm** → install or use Docker (see `docker-compose.yml`)
