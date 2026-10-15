#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo "Usage: $0 <package-filter> (e.g., @akadli/provider-youcan)" >&2
  exit 1
fi

PACKAGE_FILTER="$1"

echo "[git-tdd-atomic-workflow] 1/3 Running typecheck for ${PACKAGE_FILTER}..."
pnpm --filter "$1" typecheck

echo "[git-tdd-atomic-workflow] 2/3 Running lint for ${PACKAGE_FILTER}..."
pnpm --filter "$1" lint

echo "[git-tdd-atomic-workflow] 3/3 Running unit tests for ${PACKAGE_FILTER}..."
pnpm --filter "$1" test -- --run

echo "[git-tdd-atomic-workflow] All verification gates PASSED for ${PACKAGE_FILTER}."
