# Akadli-AI Agent Guidelines & Architectural Invariants

Canonical architectural reference for stateless AI coding sessions across the Akadli-AI monorepo.

## 1. Project Identity & Namespace
- **Project:** Akadli-AI (Open-source Algerian COD Voice Confirmation Engine & Store Adapters).
- **Scope & Namespaces:** Strictly `@akadli/*` (`@akadli/adapter-contract`, `@akadli/dz-geo`, `@akadli/core`, `@akadli/provider-<name>`, `@akadli/playground`). Never use legacy `@dz-voice/*` or `dz-*` tag prefixes.

## 2. Monorepo Architecture & Package Boundaries
- `packages/adapter-contract`: Pure Zod schemas & TypeScript interfaces (`StandardizedDzOrder`, `FinalizedOrderDecision`, `IEcommerceProvider`). Zero runtime logic.
- `packages/dz-geo`: Official 2026 Algerian administrative divisions (**69 Wilayas, 1,708 Communes**) + `+213` phone normalization.
- `packages/core`: Stateless voice orchestration (`createStandardizedDzOrder`, `buildElevenAgentsDynamicVariables`, `handleFinalizeOrderToolCall`). Note: ElevenLabs system prompts and tool definitions live in the ElevenLabs dashboard, NOT in local code.
- `packages/provider-<name>`: Stateless e-commerce adapters implementing `IEcommerceProvider`. Each provider MUST have:
  - `docs/api-spec.md` & `fixtures/*.json`
  - `src/schemas.ts`, `src/<name>-client.ts`, `src/<name>-provider.ts`, `src/index.ts`
  - `test/<name>-provider.test.ts` (Vitest + MSW `msw/node` covering all 5 mutation/verification scenarios)
- `apps/akadli-playground`: Local HTTPS WebRTC phone & webhook testing sandbox (`/admin` and `/phone`). All store/ERP providers register via `providerRegistry` in `server/src/index.ts`.

## 3. Strict Coding Invariants (Anti-Drift Rules)
- **Zero Bloat Dependencies:** Use Node 20+ native `fetch` and `node:crypto` (`crypto.timingSafeEqual`). Never install `axios`, `node-fetch`, or `moment`.
- **Canonical Order Tags & Notes:**
  - Tags: Always use `akadli-confirmed`, `akadli-modified`, `akadli-refused`, `akadli-variant-{variant}`, and `akadli-qty-{qty}`.
  - Notes: Always prefix automated notes with `[Akadli-AI]`. Zero leftover `dz-confirmed` strings anywhere in `packages/` or `apps/`.
- **No Over-Engineering & Preserve Live Flows:** Keep adapters stateless. Do not break live-verified flows (such as `PhonePage.ts` `onModeChange` goodbye handling or Shopify Algeria `province: null` fallback).

## 4. Mandatory Skills & Verification Gate
- **Skills Reference:** Consult specialized skills in `.agents/skills/`:
  - `dz-monorepo-architect`: Monorepo structure, core voice engine, and contract interfaces.
  - `dz-ecommerce-provider-builder`: Scaffolding and implementing store/ERP providers.
  - `dz-geo-address-normalizer`: Algerian Wilayas/Communes resolution and phone validation.
  - `git-tdd-atomic-workflow`: Pre-commit verification and atomic Conventional Commits.
- **Pre-Commit Verification Gate:** Every task must pass:
  ```bash
  pnpm turbo run build typecheck lint test
  ```
- **Commit Style:** Atomic Conventional Commits (`feat(...)`, `fix(...)`, `docs(...)`, `test(...)`, `chore(...)`).
