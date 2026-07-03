#!/usr/bin/env bash
# syllabus-planner local CI — backend tests + frontend tests + lint + build
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

echo "==> syllabus-planner CI (root: $ROOT)"
echo ""

echo "==> [1/4] Backend: uv sync + pytest"
cd "$ROOT/backend"
uv sync --extra dev
uv run python -m pytest
echo ""

echo "==> [2/4] Frontend: pnpm install"
cd "$ROOT/frontend"
pnpm install --frozen-lockfile
echo ""

echo "==> [3/4] Frontend: test"
pnpm test
echo ""

echo "==> [4/4] Frontend: lint + build"
pnpm lint
pnpm build
echo ""

echo "==> All CI checks passed."
