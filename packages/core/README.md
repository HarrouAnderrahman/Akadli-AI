**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/core

> Stateless orchestration engine connecting ElevenLabs Conversational AI (ElevenAgents) with Algerian COD store providers.

`@akadli/core` bridges incoming e-commerce orders, voice prompt variable injection, and post-call order finalization decisions without maintaining persistent server-side call state.

---

## Core Functions & Exports

| Function | Signature | Description |
| :--- | :--- | :--- |
| `createStandardizedDzOrder(params)` | `StandardizedDzOrder` | Normalizes phone, Wilaya, and commune via `@akadli/dz-geo` and sets validation constraints |
| `buildElevenAgentsDynamicVariables(order)` | `ElevenAgentsDynamicVariables` | Generates prompt variables (`customer_phone_e164`, `price_da`, `allowed_sizes`, `allowed_wilayas`, `allowed_communes`) |
| `handleFinalizeOrderToolCall(payload, provider, creds, constraints)` | `Promise<FinalizeOrderToolResult>` | Validates `finalize_order_decision` tool calls, checks constraints, and calls `provider.applyOrderDecision` |

---

## ElevenAgents Integration Flow

```text
StandardizedDzOrder -> buildElevenAgentsDynamicVariables() -> ElevenLabs WebRTC Call -> finalize_order_decision Tool -> handleFinalizeOrderToolCall() -> Provider Mutation
```

---

## Usage Example

```typescript
import {
  createStandardizedDzOrder,
  buildElevenAgentsDynamicVariables,
  handleFinalizeOrderToolCall
} from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

// 1. Create a standardized Algerian COD order
const order = createStandardizedDzOrder({
  orderId: "1001",
  storeName: "Algeria Store",
  customerName: "Karim Ziani",
  rawCustomerPhone: "0550123456",
  itemName: "Sneakers Air Max",
  priceDa: 4500,
  currentSize: "42",
  rawWilaya: "Barika",
  rawCommune: "Barika",
  allowedSizes: ["41", "42", "43"]
});

// 2. Build dynamic variables for ElevenAgents prompt
const promptVariables = buildElevenAgentsDynamicVariables(order);

// 3. Handle finalize_order_decision tool call from the agent
const provider = new ShopifyProvider();
const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "CONFIRMED",
    reasonOrNotes: "Confirmed by Karim over phone"
  },
  provider,
  {
    shopDomain: "store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints
);

console.log(result.success, result.externalStatus);
```

---

## Installation

```bash
pnpm add @akadli/core
```
