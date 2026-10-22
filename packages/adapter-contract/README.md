**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/adapter-contract

> Zero-dependency canonical Zod schemas and TypeScript interfaces for Algerian COD e-commerce and voice confirmation workflows.

`@akadli/adapter-contract` defines the shared contracts implemented by all store adapters (`@akadli/provider-*`) and consumed by the voice engine (`@akadli/core`).

---

## Exported Schemas & Contracts

| Schema / Interface | Type | Description |
| :--- | :--- | :--- |
| `StandardizedDzOrderSchema` | `StandardizedDzOrder` | Universal order payload normalized across all store providers |
| `FinalizedOrderDecisionSchema` | `FinalizedOrderDecision` | ElevenAgents `finalize_order_decision` payload (`CONFIRMED`, `REFUSED`, `MODIFIED`) |
| `OrderConstraintsSchema` | `OrderConstraints` | Anti-hallucination guardrails (`allowedVariants`, `allowedWilayas`, `allowedCommunes`) |
| `OrderDecisionStatusSchema` | `OrderDecisionStatus` | Enum: `"CONFIRMED" \| "REFUSED" \| "MODIFIED"` |
| `WilayaCodeSchema` | `WilayaCode` | Official zero-padded 2-digit codes (`"01"` to `"69"`) |
| `DzPhoneSchema` | `string` | Regex: `05/06/07XXXXXXXX` (local 10-digit) or `+213[567]XXXXXXXX` (E.164) |
| `IEcommerceProvider` | `interface` | Contract for webhook verification, parsing, and order mutation |
| `ApplyOrderDecisionResult` | `interface` | Standardized result `{ success, externalStatus, rawResponse }` |

---

## Custom Provider Implementation Example

```typescript
import {
  IEcommerceProvider,
  StandardizedDzOrder,
  FinalizedOrderDecision,
  ApplyOrderDecisionResult
} from "@akadli/adapter-contract";

export class CustomStoreProvider implements IEcommerceProvider {
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    // Constant-time HMAC or token comparison
    return headers["x-webhook-token"] === secret;
  }

  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    // Normalize into canonical StandardizedDzOrder using @akadli/dz-geo
    return payload as StandardizedDzOrder;
  }

  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    // Mutate store state based on decision.status (CONFIRMED / MODIFIED / REFUSED)
    return { success: true, externalStatus: decision.status };
  }
}
```

---

## Installation

```bash
pnpm add @akadli/adapter-contract
```
