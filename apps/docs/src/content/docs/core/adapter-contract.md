---
title: Adapter Contract
description: Pure Zod schemas and TypeScript interfaces establishing contract boundaries across Akadli-AI.
---

`@akadli/adapter-contract` defines the canonical domain models, validation schemas, and adapter contracts for the entire Akadli-AI ecosystem.

It has **zero runtime dependencies** beyond Zod and TypeScript, ensuring that both client and server packages share immutable boundaries without bloating bundles.

---

## Installation

```bash
pnpm add @akadli/adapter-contract
```

---

## 1. `StandardizedDzOrder`

The universal inbound order model parsed from any e-commerce webhook, database record, or spreadsheet row:

```typescript
import { z } from "zod";
import { WilayaCodeSchema, DzPhoneSchema, OrderConstraintsSchema } from "@akadli/adapter-contract";

export const StandardizedDzOrderSchema = z.object({
  orderId: z.string().min(1),
  storeName: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: DzPhoneSchema, // 05/06/07XXXXXXXX or +213...
  itemName: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  shippingFeeDa: z.number().int().nonnegative().default(0),
  priceDa: z.number().int().nonnegative(),
  currentVariant: z.string().min(1), // e.g. "42", "XL", "Noir"
  currentWilaya: WilayaCodeSchema, // Zero-padded "01" to "69"
  currentCommune: z.string().min(1),
  currentAddressNote: z.string().default(""),
  constraints: OrderConstraintsSchema
});

export type StandardizedDzOrder = z.infer<typeof StandardizedDzOrderSchema>;
```

### Key Fields & Invariants
- `currentVariant`: Replaces legacy `currentSize`. Captures product attributes such as clothing size, shoe number, color, or bundle variant.
- `currentWilaya`: Zero-padded two-digit string (`"01"` through `"69"`) representing official 2026 Algerian divisions.
- `constraints`: Defines `allowedVariants`, `allowedWilayas`, and `allowedCommunes` passed to the voice AI as strict guardrails to prevent hallucinated changes.

---

## 2. `FinalizedOrderDecision`

The canonical outbound payload emitted at the conclusion of an ElevenLabs voice confirmation session:

```typescript
export const OrderDecisionStatusSchema = z.enum([
  "CONFIRMED",
  "REFUSED",
  "MODIFIED"
]);

export const FinalizedOrderDecisionSchema = z
  .object({
    orderId: z.string().min(1),
    status: OrderDecisionStatusSchema,
    finalQuantity: z.number().int().min(1).default(1),
    finalVariant: z.string().min(1).optional(),
    finalWilaya: WilayaCodeSchema.optional(),
    finalCommune: z.string().min(1).optional(),
    finalAddressNote: z.string().optional(),
    reasonOrNotes: z.string().default("")
  })
  .superRefine((decision, ctx) => {
    if (decision.status === "MODIFIED") {
      const hasModification =
        decision.finalVariant !== undefined ||
        decision.finalWilaya !== undefined ||
        decision.finalCommune !== undefined ||
        decision.finalAddressNote !== undefined;
      if (!hasModification) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'When status is "MODIFIED", at least one of finalVariant, finalWilaya, finalCommune, or finalAddressNote must be provided.'
        });
      }
    }
  });

export type FinalizedOrderDecision = z.infer<typeof FinalizedOrderDecisionSchema>;
```

---

## 3. `IEcommerceProvider` Interface

Every store and ERP provider in `packages/provider-*` implements this interface:

```typescript
export interface IEcommerceProvider {
  /**
   * Cryptographically verifies an inbound webhook request using constant-time comparison.
   * Never throws on invalid signatures; returns boolean false instead.
   */
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean>;

  /**
   * Parses and validates an inbound webhook payload into a canonical StandardizedDzOrder.
   */
  parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder>;

  /**
   * Applies the finalized order decision back to the store, ERP, or sheet.
   */
  applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult>;
}
```
