---
title: AI Agent Portal & llms.txt Integration
description: Instructions, agent prompt templates, and architectural invariants for Cursor, Antigravity, Claude Code, and Codex.
---

Akadli-AI is designed from the ground up for agentic AI pair programming and zero-friction machine discovery.

Any AI coding agent (such as Cursor, Google Antigravity, Claude Code, GitHub Copilot, or OpenAI Codex) can ingest the ecosystem and start building integrations immediately.

---

## Machine Discovery Endpoints

Every Akadli-AI build automatically generates two plain-text machine endpoints in accordance with the `llms.txt` specification:

| File | URL | Purpose |
| :--- | :--- | :--- |
| **`llms.txt`** | [`https://akadli.me/llms.txt`](/llms.txt) | Concise architecture summary, package matrix, and canonical URL mapping. |
| **`llms-full.txt`** | [`https://akadli.me/llms-full.txt`](/llms-full.txt) | Complete concatenated repository context (all READMEs, API specifications, and agent invariants) in one HTTP request. |

---

## Agent Prompt Template

Copy and paste this instruction block into Cursor (`.cursorrules`), Antigravity instructions, or prompt composer:

```markdown
You are building on the Akadli-AI ecosystem (https://akadli.me).
Before modifying or creating code, ingest context from https://akadli.me/llms-full.txt and adhere strictly to these invariants:

1. NAMESPACES: All packages are strictly scoped under `@akadli/*` (@akadli/adapter-contract, @akadli/dz-geo, @akadli/core, @akadli/provider-<name>). Never use legacy `@dz-voice/*`.
2. ZERO BLOAT: Rely exclusively on Node 20+ native `fetch` and `node:crypto`. Never install or import `axios`, `node-fetch`, or `moment`.
3. 2026 GEOGRAPHY: Validate addresses against the official 2026 Algerian 69 Wilayas ("01"-"69") and 1,708 Communes using `@akadli/dz-geo`.
4. CANONICAL TAGS: Use strictly `akadli-confirmed`, `akadli-modified`, `akadli-refused`, and `akadli-variant-{variant}`.
5. ORDER NOTES: Always prefix automated store notes with `[Akadli-AI]`.
6. VERIFICATION GATE: Always verify changes before committing with:
   pnpm turbo run build typecheck lint test
```

---

## Monorepo Architectural Reference (`AGENTS.md`)

Below is the authoritative architectural specification enforced across the codebase:

### 1. Package Boundaries
- `packages/adapter-contract`: Pure Zod schemas & TypeScript interfaces (`StandardizedDzOrder`, `FinalizedOrderDecision`, `IEcommerceProvider`). Zero runtime logic.
- `packages/dz-geo`: Official 2026 Algerian administrative divisions (**69 Wilayas, 1,708 Communes**) + `+213` phone normalization.
- `packages/core`: Stateless voice orchestration (`createStandardizedDzOrder`, `buildElevenAgentsDynamicVariables`, `handleFinalizeOrderToolCall`). Note: ElevenLabs system prompts and tool definitions live in the ElevenLabs dashboard, NOT in local code.
- `packages/provider-<name>`: Stateless e-commerce adapters implementing `IEcommerceProvider`. Each provider MUST have:
  - `docs/api-spec.md` & `fixtures/*.json`
  - `src/schemas.ts`, `src/<name>-client.ts`, `src/<name>-provider.ts`, `src/index.ts`
  - `test/<name>-provider.test.ts` (Vitest + MSW `msw/node` covering all 5 mutation/verification scenarios)
- `apps/akadli-playground`: Local HTTPS WebRTC phone & webhook testing sandbox (`/admin` and `/phone`). All store/ERP providers register via `providerRegistry` in `server/src/index.ts`.

### 2. Specialized Skills (`.agents/skills/`)
- `dz-monorepo-architect`: Monorepo structure, core voice engine, and contract interfaces.
- `dz-ecommerce-provider-builder`: Scaffolding and implementing store/ERP providers.
- `dz-geo-address-normalizer`: Algerian Wilayas/Communes resolution and phone validation.
- `git-tdd-atomic-workflow`: Pre-commit verification and atomic Conventional Commits.
