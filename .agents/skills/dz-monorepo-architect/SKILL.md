---
name: dz-monorepo-architect
description: Initialize, scaffold, or update the Turborepo + pnpm workspace monorepo, shared @dz-voice/core ElevenAgents engine, or @dz-voice/adapter-contract interfaces. Trigger when setting up the workspace, modifying voice contracts, or adding shared packages (e.g., "scaffold the dz-voice monorepo", "update StandardizedDzOrder contract", "add a shared workspace package").
---

# dz-monorepo-architect

Initialize, scaffold, and maintain the `akadli-ai` Turborepo + pnpm monorepo, including root configuration files, the `@dz-voice/adapter-contract` package, the `@dz-voice/dz-geo` normalizer package (69 Wilayas & 1,708 Communes), and the `@dz-voice/core` ElevenAgents orchestration engine.

## When to Use

- Initializing or auditing the root monorepo configuration (`pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `package.json`)
- Creating or updating shared TypeScript interfaces and Zod schemas in `@dz-voice/adapter-contract`
- Building or updating the ElevenAgents voice session orchestrator and dynamic variable builder in `@dz-voice/core`
- Adding a new shared library or provider workspace under `packages/` or `apps/`

## Target Monorepo Layout

```text
{{WORKSPACE_PATH}}/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── apps/
│   └── akadli-playground/           # WebRTC sandbox (/admin and /phone UI)
└── packages/
    ├── adapter-contract/             # @dz-voice/adapter-contract (Zero-dependency Zod + TS contracts)
    ├── dz-geo/                       # @dz-voice/dz-geo (69 Wilayas, 1708 Communes, +213 phone normalizer, WILAYAS_58 compat)
    ├── core/                         # @dz-voice/core (ElevenAgents outbound call + tool call handler)
    └── provider-<name>/              # @dz-voice/provider-<name> (Shopify, YouCan, WooCommerce, Tassyir, etc.)
```

## Decision Tree: Workspace Operations

1. **Is the root monorepo missing or incomplete?**
   - Follow **Step 1** to create `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, and root `package.json`.
2. **Are you defining or modifying order schemas, decision payloads, or provider interfaces?**
   - Load `{{SKILL_PATH}}/references/adapter-contract.md` and follow **Step 2** to update `packages/adapter-contract/`.
   - Never add platform-specific SDKs to `@dz-voice/adapter-contract`; keep `zod` as its sole runtime dependency.
3. **Are you modifying ElevenAgents outbound call triggers or the `finalize_order_decision` webhook tool?**
   - Follow **Step 3** to update `packages/core/` while preserving strict dynamic variable injection (`allowed_sizes_enum`, `allowed_wilayas_enum`, `allowed_communes_enum`).
4. **Are you adding a new e-commerce provider package?**
   - Ensure `@dz-voice/adapter-contract` and `@dz-voice/dz-geo` exist first, then hand off implementation details to `dz-ecommerce-provider-builder`.

## Step-by-Step Instructions

### Step 1: Scaffold Root Monorepo Configuration

1. Create `{{WORKSPACE_PATH}}/pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

2. Create `{{WORKSPACE_PATH}}/tsconfig.base.json` with strict TypeScript settings (`strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: "Bundler"`, `target: "ES2022"`).
3. Create `{{WORKSPACE_PATH}}/turbo.json` with deterministic pipeline tasks (`build`, `typecheck`, `lint`, `test`):

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

4. Ensure root `{{WORKSPACE_PATH}}/package.json` sets `"name": "akadli-ai"`, `"packageManager": "pnpm@9.15.0"` (or active pnpm version), `"private": true`, and exposes root scripts:
   - `"build": "turbo run build"`
   - `"typecheck": "turbo run typecheck"`
   - `"lint": "turbo run lint"`
   - `"test": "turbo run test"`

### Step 2: Implement `@dz-voice/adapter-contract`

1. Read the complete schemas and TypeScript contracts in `{{SKILL_PATH}}/references/adapter-contract.md`.
2. Scaffold `{{WORKSPACE_PATH}}/packages/adapter-contract/package.json` with name `"@dz-voice/adapter-contract"`, exporting `./src/index.ts` (or compiled `./dist/index.js` + `./dist/index.d.ts`).
3. Implement `src/index.ts` using the exact schemas from `{{SKILL_PATH}}/references/adapter-contract.md`:
   - `WilayaCodeSchema`: Literal union or regex enforcing Algerian Wilaya codes `"01"` through `"69"`.
   - `DzPhoneSchema`: Validates Algerian mobile (`05/06/07XXXXXXXX`) or E.164 (`+213[567]XXXXXXXX`).
   - `StandardizedDzOrderSchema` and `StandardizedDzOrder`: Canonical inbound order structure (`orderId`, `storeName`, `customerName`, `customerPhone`, `itemName`, `priceDa`, `currentSize`, `currentWilaya`, `currentCommune`, `currentAddressNote`, `constraints`).
   - `FinalizedOrderDecisionSchema` and `FinalizedOrderDecision`: Canonical voice agent output (`orderId`, `status` as `"CONFIRMED" | "REFUSED" | "MODIFIED"`, `finalSize`, `finalWilaya`, `finalCommune`, `finalAddressNote`, `reasonOrNotes`).
   - `IEcommerceProvider`: Standard interface with `verifyWebhook`, `parseWebhookOrder`, and `applyOrderDecision`.

### Step 3: Implement `@dz-voice/core` (ElevenAgents Engine)

1. Configure `{{WORKSPACE_PATH}}/packages/core/package.json` with dependencies on `"@dz-voice/adapter-contract": "workspace:*"` and `"@dz-voice/dz-geo": "workspace:*"`.
2. Implement `buildElevenAgentsDynamicVariables(order: StandardizedDzOrder)` in `packages/core/src/dynamic-variables.ts`:
   - Convert `order.customerPhone` to E.164 (`+213...`) for outbound SIP/Twilio dialing.
   - Format `price_da` as an integer string in Algerian Dinars (DZD).
   - Serialize `order.constraints.allowedSizes`, `order.constraints.allowedWilayas`, and `order.constraints.allowedCommunes` into deterministic JSON/CSV strings for the ElevenAgents system prompt and `finalize_order_decision` tool constraints.
3. Implement `handleFinalizeOrderToolCall(rawToolPayload: unknown, provider: IEcommerceProvider, credentials: Record<string, string>)` in `packages/core/src/tool-handler.ts`:
   - Validate `rawToolPayload` against `FinalizedOrderDecisionSchema`.
   - If `status === "MODIFIED"`, verify that `finalWilaya` (`"01"`-`"69"`) and `finalCommune` belong to the allowed constraints before invoking `provider.applyOrderDecision(...)`.
   - Return a structured tool result to ElevenAgents so the voice agent can confirm completion politely in Darja/French/Arabic before hanging up.

### Step 4: Verify Monorepo Integrity

Run the bundled verification script before finishing any architectural change:

```bash
{{SKILL_PATH}}/scripts/verify-workspace.sh
```

## Gotchas

- **Circular Dependencies**: `@dz-voice/adapter-contract` must never import from `@dz-voice/core`, `@dz-voice/dz-geo`, or any `@dz-voice/provider-*` package. Dependency flow is strictly `provider-* -> (adapter-contract + dz-geo) <- core`.
- **Wilaya Code Zero-Padding**: Always store `currentWilaya` and `finalWilaya` as 2-character zero-padded strings (`"01"` for Adrar, `"09"` for Blida, `"16"` for Alger, `"58"` for In Guezzam, `"68"` for Bou Saada, `"69"` for El Abiodh Sidi Cheikh), never raw integers (`1`, `9`), because integers strip leading zeros in JSON and break courier APIs (Yalidine, Ecotrack, ZR Express).
- **Phone Formatting Split**: E-commerce stores and Algerian couriers typically require local 10-digit numbers (`0550123456`), while ElevenAgents telephony requires E.164 (`+213550123456`). Store normalized phones consistently and use `@dz-voice/dz-geo` helpers when crossing boundary APIs.
