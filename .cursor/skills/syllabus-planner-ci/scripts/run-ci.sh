#!/usr/bin/env bash
# syllabus-planner local CI — backend tests + frontend lint + build
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

echo "==> syllabus-planner CI (root: $ROOT)"
echo ""

echo "==> [1/3] Backend: uv sync + pytest"
cd "$ROOT/backend"
uv sync --extra dev
uv run python -m pytest
echo ""

echo "==> [2/3] Frontend: pnpm install"
cd "$ROOT/frontend"
pnpm install --frozen-lockfile
echo ""

echo "==> [3/3] Frontend: lint + build"
pnpm lint
pnpm build
echo ""

echo "==> All CI checks passed."
