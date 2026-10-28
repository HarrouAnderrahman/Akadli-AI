**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/core

> Stateless orchestration engine connecting ElevenLabs Conversational AI (ElevenAgents) with Algerian COD store providers.

`@akadli/core` bridges incoming e-commerce orders, voice prompt variable injection, and post-call order finalization decisions without maintaining persistent server-side call state.

---

## Core Functions & Exports

| Function | Signature | Description |
| :--- | :--- | :--- |
| `createStandardizedDzOrder(params)` | `StandardizedDzOrder` | Normalizes phone, Wilaya, commune, `quantity` (default `1`), `shippingFeeDa` (default `0`), and validation constraints |
| `buildElevenAgentsDynamicVariables(order)` | `ElevenAgentsDynamicVariables` | Generates prompt variables (`customer_phone_e164`, `quantity`, `price_da`, `shipping_fee_da`, `subtotal_da`, `allowed_variants`, `allowed_wilayas`, `allowed_communes`) |
| `handleFinalizeOrderToolCall(payload, provider, creds, constraints?, order?)` | `Promise<FinalizeOrderToolResult>` | Validates `finalize_order_decision` tool calls (including `finalQuantity` / `final_quantity` fallback), checks constraints, and calls `provider.applyOrderDecision` |
| `fetchElevenLabsConversationTranscript(conversationId, apiKey, baseUrl?)` | `Promise<ElevenLabsConversationTranscript>` | Zero-dependency helper to retrieve full post-call STT conversation transcript and metadata from ElevenLabs |
| `fetchElevenLabsConversationAudio(conversationId, apiKey, baseUrl?)` | `Promise<Uint8Array>` | Zero-dependency helper to download raw MP3 audio recording bytes for a completed ElevenLabs call |

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
  handleFinalizeOrderToolCall,
  fetchElevenLabsConversationTranscript,
  fetchElevenLabsConversationAudio
} from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

// 1. Create a standardized Algerian COD order
const order = createStandardizedDzOrder({
  orderId: "1001",
  storeName: "Algeria Store",
  customerName: "Karim Ziani",
  rawCustomerPhone: "0550123456",
  itemName: "Sneakers Air Max",
  quantity: 2,
  priceDa: 4500,
  shippingFeeDa: 600,
  currentVariant: "42",
  rawWilaya: "Barika",
  rawCommune: "Barika",
  allowedVariants: ["41", "42", "43"]
});

// 2. Build dynamic variables for ElevenAgents prompt
// Includes quantity ("2"), price_da ("4500"), shipping_fee_da ("600"), subtotal_da ("3900")
const promptVariables = buildElevenAgentsDynamicVariables(order);

// 3. Handle finalize_order_decision tool call from the agent
const provider = new ShopifyProvider();
const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "MODIFIED",
    finalVariant: "43",
    finalQuantity: 2,
    reasonOrNotes: "Confirmed by Karim over phone, switched size to 43"
  },
  provider,
  {
    shopDomain: "store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints,
  order
);

// 4. Optional: Retrieve post-call STT transcript & MP3 recording from ElevenLabs
const transcript = await fetchElevenLabsConversationTranscript(conversationId, process.env.ELEVENLABS_API_KEY!);
const mp3Bytes = await fetchElevenLabsConversationAudio(conversationId, process.env.ELEVENLABS_API_KEY!);

console.log(result.success, result.externalStatus, transcript.transcript.length, mp3Bytes.byteLength);
```

---

## Installation

```bash
pnpm add @akadli/core
```
