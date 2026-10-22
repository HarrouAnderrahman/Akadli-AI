**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/provider-tassyir

> Official Tassyir Admin API (`2026-10`) adapter with Standard Webhooks (`v1a` Ed25519 & HMAC verification), idempotent order confirmations (`Idempotency-Key`), and Algerian COD address normalization.

Implements `IEcommerceProvider` from `@akadli/adapter-contract` for Algerian merchants and fulfillment hubs managing Cash on Delivery (COD) orders via **Tassyir** (`api.tassyir.io`).

---

## 🚀 Tassyir Developer CLI & Dev Store Setup

You can configure and test your store connection directly using Tassyir's official Developer CLI:

```bash
# 1. Log in to your Tassyir developer account
npx tassyir@latest login

# 2. Create a local development store sandbox
npx tassyir@latest store create --name "Akadli Dev Store"

# 3. Trigger simulated orders/created webhooks to your local Akadli playground
npx tassyir@latest webhook trigger orders/created
```

### Required App Scopes
When creating an API access token in Tassyir, configure the following scopes:
- `read_orders`: Read incoming orders and customer delivery destinations.
- `write_orders`: Update order notes, confirm (`/confirm`), and cancel (`/cancel`) orders.
- `read_customer_contact`: **Mandatory for voice confirmation.** Without this scope (or if past merchant plan quota), phone numbers are masked as `"**********"` and the order enters `waiting: true`.

---

## ⚙️ Features & Architecture

- **Official 2026-10 Admin API:** Connects directly to `https://api.tassyir.io/apps/2026-10`.
- **Standard Webhook Verification (`v1a` Ed25519):** Validates `webhook-id`, `webhook-timestamp` (with 5-minute replay window), and `webhook-signature` using Node 20+ `node:crypto`. Also supports HMAC-SHA256 for local playground simulations.
- **2026 Administrative Divisions:** Automatically normalizes Algerian Wilayas (1 to 69) and communes via `@akadli/dz-geo`.
- **Idempotent Mutations:** Outbound `POST /confirm` and `POST /cancel` operations send `Idempotency-Key: akadli-{action}-{orderId}` so network retries never duplicate mutations.
- **Resilient Rate Limiting:** Handles `429 RATE_LIMITED` / `BUSINESS_RATE_LIMITED` and `503 API_BUSY` with `Retry-After` backoff.

---

## 🔑 Credentials Configuration (`TassyirCredentialsSchema`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | Yes* | — | Tassyir Admin API Bearer token (`apiKey` accepted for backwards compatibility) |
| `baseUrl` | `string` | No | `"https://api.tassyir.io/apps/2026-10"` | Tassyir Admin API base endpoint |
| `confirmOnModified` | `string` | No | `"true"` | Calls `/confirm` when an order is updated with new size/address |
| `cancelOnRefused` | `string` | No | `"true"` | Calls `/cancel` when an order is refused during a voice call |

---

## 💻 Usage Example

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. Verify Standard Webhooks (v1a Ed25519 or HMAC)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.TASSYIR_WEBHOOK_PUBLIC_KEY!
);

// 2. Parse standardized Algerian COD order (supports 2026-10 envelope & flat payload)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Apply post-call decision to Tassyir Admin API
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "Customer confirmed via ElevenAgents voice call"
  },
  {
    accessToken: process.env.TASSYIR_ACCESS_TOKEN!,
    confirmOnModified: "true",
    cancelOnRefused: "true"
  }
);

console.log("Mutation result:", result.externalStatus); // "CONFIRMED"
```
