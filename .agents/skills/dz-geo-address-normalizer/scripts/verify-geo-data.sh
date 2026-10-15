#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_PATH:-$(pwd)}"
GEO_PKG_DIR="${WORKSPACE_ROOT}/packages/dz-geo"

echo "[dz-geo-address-normalizer] Verifying @dz-voice/dz-geo package (69 Wilayas & 1,708 Communes)..."

if [[ ! -d "${GEO_PKG_DIR}" ]]; then
  echo "ERROR: ${GEO_PKG_DIR} does not exist yet." >&2
  exit 1
fi

pnpm --dir "${WORKSPACE_ROOT}" --filter "@dz-voice/dz-geo" typecheck
pnpm --dir "${WORKSPACE_ROOT}" --filter "@dz-voice/dz-geo" test -- --run

echo "[dz-geo-address-normalizer] Geo normalizer verification passed."
