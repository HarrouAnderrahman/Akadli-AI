---
name: dz-ecommerce-provider-builder
description: Build, scaffold, or update an e-commerce provider integration package (Shopify, YouCan, Tassyir, WooCommerce, Ayor, SetShop, JustSell, Google Sheets) inside packages/provider-<name>. Trigger when creating or updating a store connector or webhook adapter (e.g., "build the YouCan provider", "scaffold packages/provider-tassyir", "implement SetShop webhook adapter").
---

# dz-ecommerce-provider-builder

Scaffold, implement, and maintain e-commerce store and COD ERP provider adapters (`packages/provider-<name>`, named `@akadli/provider-<name>`) implementing `IEcommerceProvider` from `@akadli/adapter-contract`. New provider packages must import from `@akadli/adapter-contract`, `@akadli/dz-geo`, and `@akadli/core`.

## When to Use

- Scaffolding a new store integration inside `{{WORKSPACE_PATH}}/packages/provider-<name>` (named `@akadli/provider-<name>`)
- Implementing webhook signature verification (`verifyWebhook`), order normalization (`parseWebhookOrder`), or post-call mutations (`applyOrderDecision`)
- Integrating Shopify, YouCan, WooCommerce, Tassyir, Ayor, SetShop, JustSell, or Google Sheets with the `Akadli-AI` ecosystem

## Anti-Hallucination Protocol: Spec-First Gate (CRITICAL)

Autonomous sub-agents (especially Flash models) must **never** guess or fabricate REST endpoints, webhook headers, or JSON field paths. Before writing a single line of code in `packages/provider-<name>/src/`:

1. **Run the Spec-First Gate check:**

```bash
{{SKILL_PATH}}/scripts/check-spec-gate.sh <provider-name>
```

2. **Verify Required Artifacts Exist:**
   - `{{WORKSPACE_PATH}}/packages/provider-<name>/docs/api-spec.md` (documented authentication scheme, webhook signature header, inbound JSON fields, and outbound mutation endpoints)
   - `{{WORKSPACE_PATH}}/packages/provider-<name>/fixtures/webhook-order-created.json` (real or canonical sample inbound payload)

3. **Create Missing Spec/Fixture First:**
   - If `docs/api-spec.md` or `fixtures/webhook-order-created.json` does not exist yet, author them first using verified documentation and the architectural patterns in `{{SKILL_PATH}}/references/provider-patterns.md` before writing `src/index.ts`.

## Decision Tree: Selecting the Provider Integration Pattern

Inspect `packages/provider-<name>/docs/api-spec.md` and classify the platform into one of three patterns detailed in `{{SKILL_PATH}}/references/provider-patterns.md`:

- **Does the platform expose a documented two-way REST/GraphQL API for order status, tags, shipping address, and line item mutations?**
  - **YES (Shopify, YouCan, WooCommerce)** -> Use **Pattern A (Full Two-Way REST API)**.
- **Is the platform an Algerian COD ERP or order management system integrated with local couriers?**
  - **YES (Tassyir, Ayor)** -> Use **Pattern B (Algerian COD ERP / Two-Phase Courier Dispatch)**.
- **Does the platform lack a public two-way REST mutation endpoint (or only support outbound Order Created webhooks / Google Sheets sync)?**
  - **YES (SetShop, JustSell, DZBuild, Foorweb, Google Sheets)** -> Use **Pattern C (Universal Sheet / Outbound Webhook / Courier Draft Bridge)**.
  - **CRITICAL RULE**: Never invent fake `PUT /api/v1/orders/:id` endpoints for Pattern C platforms. Route `applyOrderDecision` to the configured Outbound Webhook Bridge, Google Sheets row updater, or Courier Draft API (Yalidine / Ecotrack).

## Standard Package Structure

Every provider package must follow this exact directory layout:

```text
{{WORKSPACE_PATH}}/packages/provider-<name>/
├── package.json
├── tsconfig.json
├── docs/
│   └── api-spec.md                        # Mandatory Spec-First documentation
├── fixtures/
│   └── webhook-order-created.json         # Mandatory inbound webhook fixture
├── src/
│   ├── index.ts                           # Exports Provider class implementing IEcommerceProvider
│   ├── schemas.ts                         # Zod schemas for inbound webhook & outbound responses
│   └── client.ts                          # Typed HTTP client with retries, rate-limit & 401 handling
└── test/
    └── provider.test.ts                   # Vitest + MSW test suite (5 required scenarios)
```

## Step-by-Step Implementation Workflow

### Step 1: Pass the Spec-First Gate

1. Read `{{SKILL_PATH}}/references/provider-patterns.md`.
2. Ensure `docs/api-spec.md` and `fixtures/webhook-order-created.json` exist in `packages/provider-<name>/`.
3. Execute `{{SKILL_PATH}}/scripts/check-spec-gate.sh <name>` and confirm exit code `0`.

### Step 2: Implement `verifyWebhook`

1. Extract the signature header in a case-insensitive manner (`headers[headerName.toLowerCase()]`).
2. Compute the expected HMAC digest (e.g., `sha256` base64 for Shopify, `sha256` hex for YouCan/Tassyir) over `rawBody` using Node's `node:crypto` module.
3. Compare digests using `crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))` after verifying byte lengths match.
4. Return `false` on missing headers, length mismatches, or invalid signatures without throwing unhandled exceptions.

### Step 3: Implement `parseWebhookOrder`

1. Validate the raw `payload` using a strict Zod schema defined in `src/schemas.ts` that matches `fixtures/webhook-order-created.json`.
2. Normalize the customer's phone number and Wilaya/Commune using `@akadli/dz-geo` (see `dz-geo-address-normalizer` skill):
   - Normalize `customerPhone` to `05/06/07XXXXXXXX` or `+213[567]XXXXXXXX`.
   - Normalize messy Wilaya input (`"Alger"`, `"16"`, `"تلمسان"`, `"بوسعادة"`) to its 2-digit code (`"01"`-`"69"`).
   - Populate `constraints.allowedWilayas` (`"01"`-`"69"`), `constraints.allowedCommunes` (valid communes for `currentWilaya`), and `constraints.allowedSizes` (available product variants or `[currentSize]`).
3. Validate the final object with `StandardizedDzOrderSchema.parse(...)` from `@akadli/adapter-contract`.

### Step 4: Implement `applyOrderDecision`

1. Validate `decision` with `FinalizedOrderDecisionSchema.parse(decision)`.
2. Execute the mutation according to the platform's pattern (`Pattern A`, `Pattern B`, or `Pattern C` in `{{SKILL_PATH}}/references/provider-patterns.md`):
   - `CONFIRMED`: Mark order confirmed / append `"akadli-confirmed"` tag / trigger courier parcel creation or sheet status update.
   - `MODIFIED`: Update shipping province/Wilaya (`finalWilaya`), city/commune (`finalCommune`), address note (`finalAddressNote`), and variant/size (`finalSize`), then mark confirmed.
   - `REFUSED`: Cancel/refuse order and record `decision.reasonOrNotes`.
3. Implement resilient HTTP error handling in `src/client.ts`:
   - **401 / 403 Unauthorized**: Fail fast without retrying and return a descriptive error in `rawResponse`.
   - **429 Too Many Requests / 503 Unavailable**: Respect `Retry-After` header with bounded exponential backoff (max 3 attempts).

### Step 5: Test and Verify

Delegate to `git-tdd-atomic-workflow` to write the 5 mandatory Vitest + MSW tests and run `verify-package.sh @akadli/provider-<name>`.

## Gotchas

- **Raw Body Preservation**: HMAC verification requires the exact unparsed `rawBody` (`string | Buffer`). Never pass `JSON.stringify(parsedBody)` to `verifyWebhook` because whitespace differences invalidate the HMAC signature.
- **Line Item Variant Mutation**: In Shopify and WooCommerce, changing a customer's clothing/shoe size (`finalSize`) requires mapping `finalSize` to the store's `variant_id` or updating custom order attributes/notes when `variant_id` mapping is not provided in credentials. Always document the exact fallback behavior in `docs/api-spec.md`.
