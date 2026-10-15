#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <provider-name> (e.g., youcan, shopify, tassyir, setshop)" >&2
  exit 1
fi

PROVIDER_NAME="${1#provider-}"
WORKSPACE_ROOT="${WORKSPACE_PATH:-$(pwd)}"
PROVIDER_DIR="${WORKSPACE_ROOT}/packages/provider-${PROVIDER_NAME}"
SPEC_FILE="${PROVIDER_DIR}/docs/api-spec.md"
FIXTURE_FILE="${PROVIDER_DIR}/fixtures/webhook-order-created.json"

echo "[dz-ecommerce-provider-builder] Checking Spec-First Gate for provider-${PROVIDER_NAME}..."

if [[ ! -s "${SPEC_FILE}" ]]; then
  echo "ERROR: Spec-First Gate failed! Missing or empty API spec: ${SPEC_FILE}" >&2
  echo "Create docs/api-spec.md before writing implementation code in src/." >&2
  exit 1
fi

if [[ ! -s "${FIXTURE_FILE}" ]]; then
  echo "ERROR: Spec-First Gate failed! Missing or empty webhook fixture: ${FIXTURE_FILE}" >&2
  echo "Create fixtures/webhook-order-created.json before writing implementation code in src/." >&2
  exit 1
fi

echo "[dz-ecommerce-provider-builder] Spec-First Gate PASSED for provider-${PROVIDER_NAME}."
