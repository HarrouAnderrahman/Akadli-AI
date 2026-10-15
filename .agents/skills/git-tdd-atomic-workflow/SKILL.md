---
name: git-tdd-atomic-workflow
description: Manage Git branches, run pre-commit verification gates (typecheck, lint, Vitest unit tests with MSW), and create atomic Conventional Commits. Trigger before committing code, starting a new provider task, or finalizing a feature branch (e.g., "verify and commit provider-youcan", "create feature branch for Shopify adapter", "run TDD pre-commit gate").
---

# git-tdd-atomic-workflow

Enforce branch isolation, Test-Driven Development (Vitest + Mock Service Worker), deterministic pre-commit verification gates (`typecheck`, `lint`, `test`), and atomic Conventional Commits across the `dz-voice-confirm` monorepo.

## When to Use

- Starting work on a new provider package, core feature, or bugfix branch
- Writing or auditing the 5 mandatory Vitest + MSW unit/integration tests for an e-commerce provider
- Running pre-commit verification gates before staging or committing changes
- Creating atomic, well-scoped Conventional Commits without polluting Git history

## Decision Tree: Git & TDD Lifecycle

1. **Checking Current Git Branch Before Writing Code:**
   - Run `git branch --show-current`.
   - **Is the current branch `main` or `master`?** -> STOP. Never commit directly to `main`. Create and switch to an isolated branch (`git checkout -b feat/provider-<name>`, `fix/<scope>`, or `chore/<scope>`).
   - **Is the current branch already an isolated feature/fix branch matching the task?** -> Proceed to **Step 2**.
2. **Writing or Auditing Provider Tests:**
   - Does `packages/provider-<name>/test/provider.test.ts` cover all 5 mandatory scenarios using `vitest` and `msw`?
   - **NO** -> Load `{{SKILL_PATH}}/references/msw-vitest-templates.md` and implement all 5 test cases before running the verification gate.
   - **YES** -> Proceed to **Step 3**.
3. **Running the Pre-Commit Verification Gate:**
   - Execute `{{SKILL_PATH}}/scripts/verify-package.sh <package-name>` (e.g., `@dz-voice/provider-youcan`).
   - **Exit code != 0?** -> **DO NOT COMMIT.** Inspect the failing `typecheck`, `lint`, or `vitest` output, fix the root cause in source or test files, and re-run `{{SKILL_PATH}}/scripts/verify-package.sh <package-name>` until it exits `0`.
   - **Exit code == 0?** -> Proceed to **Step 4** to stage specific files and commit.

## Step-by-Step Instructions

### Step 1: Branch Isolation

Before modifying any package, ensure you are on a dedicated branch:

```bash
CURRENT_BRANCH="$(git branch --show-current)"
if [[ "${CURRENT_BRANCH}" == "main" || "${CURRENT_BRANCH}" == "master" ]]; then
  git checkout -b feat/provider-<name>
fi
```

Allowed branch prefixes:
- `feat/provider-<name>` (new store or COD ERP integration)
- `feat/<scope>` (core voice engine, geo normalizer, or gateway features)
- `fix/<scope>` (bugfixes in parsers, normalizers, or webhook handlers)
- `chore/<scope>` (workspace config, tooling, or documentation updates)

### Step 2: Mandatory Test-First Suite (Vitest + MSW)

Every provider package (`@dz-voice/provider-<name>`) must include a `vitest` + `msw/node` test suite (`test/provider.test.ts`) using the blueprint in `{{SKILL_PATH}}/references/msw-vitest-templates.md` that verifies all 5 scenarios without making real network calls:

1. **Webhook Signature Verification (`verifyWebhook`)**:
   - Returns `true` for a valid cryptographic HMAC/token signature over the raw fixture buffer.
   - Returns `false` for a tampered payload, wrong secret, or missing signature header.
2. **Order Normalization (`parseWebhookOrder`)**:
   - Loads `fixtures/webhook-order-created.json` and asserts that `customerPhone` is normalized (`05/06/07XXXXXXXX` or `+213...`), `currentWilaya` is a 2-digit code (`"01"`-`"69"`), and `constraints` (`allowedSizes`, `allowedWilayas`, `allowedCommunes`) are populated.
3. **`CONFIRMED` Decision API Call (`applyOrderDecision`)**:
   - Intercepts the outbound HTTP call via MSW and verifies the confirmation status/tag payload returns `{ success: true, externalStatus: "CONFIRMED" }`.
4. **`MODIFIED` Decision API Call (`applyOrderDecision`)**:
   - Passes a modified `finalSize` and `finalCommune` (plus optional `finalWilaya` and `finalAddressNote`), intercepts the outbound request via MSW, and asserts the request body updates both the variant/size and shipping commune/Wilaya.
5. **`REFUSED` Decision API Call (`applyOrderDecision`)**:
   - Passes `status: "REFUSED"` with `reasonOrNotes`, intercepts the cancellation/refusal endpoint via MSW, and asserts clean cancellation handling.

### Step 3: Run the Deterministic Verification Gate

Always run the bundled verification script for the target package:

```bash
{{SKILL_PATH}}/scripts/verify-package.sh @dz-voice/provider-<name>
```

What `verify-package.sh` executes in strict sequence (`set -euo pipefail`):
1. `pnpm --filter "$1" typecheck`
2. `pnpm --filter "$1" lint`
3. `pnpm --filter "$1" test --run`

If any command returns a non-zero exit code, the script halts immediately. Fix all errors and re-run until exit code `0` is achieved.

### Step 4: Stage Explicitly and Create Atomic Conventional Commits

1. Inspect working tree status (`git status --short`).
2. Stage only the files belonging to the current logical change (never run blind `git add .` or `git add -A` if untracked scratch files exist):

```bash
git add packages/provider-<name>/docs/api-spec.md packages/provider-<name>/fixtures/webhook-order-created.json
git commit -m "docs(provider-<name>): add API specification and order webhook fixture"

git add packages/provider-<name>/src/ packages/provider-<name>/package.json packages/provider-<name>/tsconfig.json
git commit -m "feat(provider-<name>): implement order webhook parser and decision mutations"

git add packages/provider-<name>/test/
git commit -m "test(provider-<name>): add msw tests for order mutations"
```

## Gotchas

- **Never Use `--no-verify`**: Bypassing verification gates or committing failing tests breaks downstream sub-agents.
- **Unhandled MSW Requests**: Always configure `server.listen({ onUnhandledRequest: "error" })` in Vitest setup so any unexpected or misspelled endpoint URL immediately fails the test.
