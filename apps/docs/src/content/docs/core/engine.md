---
title: Voice Engine
description: Stateless orchestration engine connecting ElevenLabs Conversational AI with store adapters.
---

`@akadli/core` is the stateless orchestration layer bridging e-commerce store orders, ElevenLabs conversational AI prompt construction, and post-call decision execution.

It never keeps long-lived database connections or in-memory session state, allowing your serverless or containerized backends to scale horizontally during traffic spikes.

---

## Installation

```bash
pnpm add @akadli/core
```

---

## Key Functions

### 1. `createStandardizedDzOrder(params)`

Constructs a validated `StandardizedDzOrder` object. It normalizes phone numbers, Wilayas (`01`–`69`), and communes via `@akadli/dz-geo`, while assembling validation constraints:

```typescript
import { createStandardizedDzOrder } from "@akadli/core";

const order = createStandardizedDzOrder({
  orderId: "1001",
  storeName: "Algeria Sneaker House",
  customerName: "Amine Belkacem",
  rawCustomerPhone: "0550123456",
  itemName: "Air Jordan 1 High",
  priceDa: 12500,
  currentVariant: "43",
  rawWilaya: "Barika",
  rawCommune: "Barika",
  currentAddressNote: "Near the central mosque",
  allowedVariants: ["42", "43", "44"] // Strict size guardrails
});
```

### 2. `buildElevenAgentsDynamicVariables(order)`

Builds the prompt injection object sent when starting an ElevenLabs conversation session. It formats prices and geographic details to ensure natural pronunciation in Algerian Darja:

```typescript
import { buildElevenAgentsDynamicVariables } from "@akadli/core";

const dynamicVariables = buildElevenAgentsDynamicVariables(order);
/*
Output:
{
  customer_name: "Amine Belkacem",
  customer_phone_e164: "+213550123456",
  customer_phone_local: "0550123456",
  store_name: "Algeria Sneaker House",
  item_name: "Air Jordan 1 High",
  price_da: "12500",
  current_variant: "43",
  current_wilaya_code: "60",
  current_wilaya_name_fr: "Barika",
  current_wilaya_name_ar: "بريكة",
  current_commune: "Barika",
  current_address_note: "Near the central mosque",
  allowed_variants: "42, 43, 44",
  allowed_wilayas: "01, 02, ..., 69",
  allowed_communes: "Barika, M'doukal, Bitam"
}
*/
```

### 3. `handleFinalizeOrderToolCall(payload, provider, creds, constraints)`

Validates the tool call emitted by ElevenAgents (`finalize_order_decision`) against the order constraints, rejects invalid variants or non-existent communes, and dispatches the mutation to the target store adapter:

```typescript
import { handleFinalizeOrderToolCall } from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "MODIFIED",
    finalVariant: "44", // Customer requested a larger shoe size
    finalCommune: "Barika",
    reasonOrNotes: "Customer requested size 44 instead of 43"
  },
  provider,
  {
    shopDomain: "dz-store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints // Validates that "44" is in allowedVariants
);

console.log(result.success); // true
console.log(result.externalStatus); // "MODIFIED"
```

---

## Tool Definition for ElevenLabs Dashboard

In the ElevenLabs Conversational AI Dashboard under **Tools** -> **Add Server Tool**:

- **Name:** `finalize_order_decision`
- **Description:** `Records the customer's post-call COD order confirmation decision and any address or variant modifications.`
- **Parameters Schema:**
  ```json
  {
    "type": "object",
    "properties": {
      "orderId": { "type": "string" },
      "status": { "type": "string", "enum": ["CONFIRMED", "REFUSED", "MODIFIED"] },
      "finalVariant": { "type": "string" },
      "finalWilaya": { "type": "string" },
      "finalCommune": { "type": "string" },
      "finalAddressNote": { "type": "string" },
      "reasonOrNotes": { "type": "string" }
    },
    "required": ["orderId", "status"]
  }
  ```
