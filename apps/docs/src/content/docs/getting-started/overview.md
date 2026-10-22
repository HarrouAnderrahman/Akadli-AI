---
title: Architecture & COD Confirmation Lifecycle
description: High-level architectural overview and end-to-end confirmation lifecycle of Akadli-AI.
---

Akadli-AI is an open-source, stateless Cash-on-Delivery (COD) confirmation engine designed specifically for the Algerian e-commerce market and the official **2026 69-Wilaya administrative division**.

## The Problem with Algerian COD

In Algeria, over 95% of e-commerce transactions rely on Cash-on-Delivery. Store owners routinely face return rates exceeding 30-40% due to:
- Fake orders, typos in phone numbers, or casual impulse clicks.
- Inaccurate delivery addresses (Algeria's recent expansion from 58 to 69 Wilayas is rarely supported out of the box by global platforms).
- Customer hesitation or requests to switch sizes/variants before dispatch.
- Manual call centers are expensive, slow, and hard to scale during flash sales.

Akadli-AI solves this by pairing automated, human-like voice calls in **Algerian Darja** via ElevenLabs Conversational AI with zero-dependency adapters that validate addresses and write decisions straight back to stores.

---

## End-to-End Confirmation Lifecycle

```text
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│ Store / Platform│       │   @akadli/provider-* │       │  @akadli/dz-geo │
│  Order Placed   │ ────> │  verifyWebhook()     │ ────> │ 69 Wilayas &    │
│  (Shopify, etc.)│       │  parseWebhookOrder() │       │ 1,708 Communes  │
└─────────────────┘       └──────────────────────┘       └────────┬────────┘
                                                                  │ StandardizedDzOrder
                                                                  ▼
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│ Store / ERP     │ <──── │ @akadli/core         │ <──── │ ElevenAgents    │
│ Order Mutated   │       │ handleFinalizeOrder  │       │ Voice Call      │
│ (Tags & Note)   │       │ ToolCall()           │       │ (Algerian Darja)│
└─────────────────┘       └──────────────────────┘       └─────────────────┘
```

### Step 1: Webhook Ingress & Cryptographic Verification
When a customer completes checkout, the store sends an HTTP webhook (`POST /api/webhooks/<provider>`). The corresponding `@akadli/provider-*` validates the payload signature using constant-time cryptographic comparisons (`crypto.timingSafeEqual`) to prevent spoofing:
- **Shopify:** HMAC-SHA256 Base64 header `x-shopify-hmac-sha256`.
- **YouCan:** HMAC-SHA256 Hex digest `x-youcan-signature`.
- **WooCommerce:** HMAC-SHA256 Base64 header `x-wc-webhook-signature`.
- **Google Sheets:** Shared secret token or HMAC header.
- **Tassyir:** Standard Webhooks (`v1a` Ed25519) zero-secret public key verification.

### Step 2: Address & Phone Normalization
Inbound payloads are converted into a canonical `StandardizedDzOrder`. During this step, `@akadli/dz-geo`:
- Normalizes phone numbers to local (`05/06/07XXXXXXXX`) or E.164 (`+213...`).
- Resolves the Wilaya across Arabic, French, Arabizi, or 5-digit postal code (`13000` -> Wilaya `13`).
- Resolves the delivery commune against official commune lists of that Wilaya.
- Sets dynamic validation constraints (`allowedVariants`, `allowedWilayas`, `allowedCommunes`).

### Step 3: ElevenAgents Dynamic Prompt Variables
`@akadli/core` generates dynamic prompt variables injected into the ElevenLabs Conversational AI session:
- `customer_name`: Personalized greeting.
- `item_name`: The product ordered.
- `current_variant`: Chosen size, color, or option.
- `price_da`: Price in Algerian Dinars formatted for voice pronunciation.
- `current_wilaya_name` and `current_commune`: Current shipping destination.
- Guardrail lists (`allowed_variants`, `allowed_communes`) to prevent hallucinated changes.

### Step 4: Live Darja Voice Call
The customer receives a call via WebRTC, SIP trunk, or phone bridge. The agent greets the customer in friendly Algerian Darja, confirms their intent, and offers to modify the variant or delivery address if needed.

### Step 5: Decision Finalization & Store Mutation
At the conclusion of the conversation, the ElevenAgents server triggers the `finalize_order_decision` tool call. `@akadli/core` validates the payload against constraints and calls `provider.applyOrderDecision()`:
- **CONFIRMED:** Order is tagged `akadli-confirmed`, and a confirmation note is appended.
- **MODIFIED:** Order is tagged `akadli-modified` and `akadli-variant-{variant}`, shipping address/variant is updated, and a detailed audit note is recorded.
- **REFUSED:** Order is tagged `akadli-refused` and automatically cancelled/closed (if enabled).
