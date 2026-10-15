#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_PATH:-$(pwd)}"

echo "[dz-monorepo-architect] Verifying workspace configuration in: ${WORKSPACE_ROOT}"

for required_file in "package.json" "pnpm-workspace.yaml" "turbo.json" "tsconfig.base.json"; do
  if [[ ! -f "${WORKSPACE_ROOT}/${required_file}" ]]; then
    echo "ERROR: Missing required root file: ${required_file}" >&2
    exit 1
  fi
done

if [[ -d "${WORKSPACE_ROOT}/packages/adapter-contract" ]]; then
  echo "[dz-monorepo-architect] Typechecking @akadli/adapter-contract..."
  pnpm --dir "${WORKSPACE_ROOT}" --filter "@akadli/adapter-contract" typecheck
fi

if [[ -d "${WORKSPACE_ROOT}/packages/dz-geo" ]]; then
  echo "[dz-monorepo-architect] Typechecking @akadli/dz-geo..."
  pnpm --dir "${WORKSPACE_ROOT}" --filter "@akadli/dz-geo" typecheck
fi

if [[ -d "${WORKSPACE_ROOT}/packages/core" ]]; then
  echo "[dz-monorepo-architect] Typechecking @akadli/core..."
  pnpm --dir "${WORKSPACE_ROOT}" --filter "@akadli/core" typecheck
fi

echo "[dz-monorepo-architect] Workspace verification passed."
