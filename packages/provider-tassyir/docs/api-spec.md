# Tassyir Admin API (`2026-10`) & Standard Webhooks Specification (`@akadli/provider-tassyir`)

This document defines the technical specification, authentication, Standard Webhook Ed25519 verification, Algerian COD data extraction, and order decision mutation flow for Tassyir (`api.tassyir.io`) integrating natively with the **Akadli-AI** voice confirmation engine.

---

## 1. Tassyir Developer CLI & Store Setup

Developers can rapidly configure and test store integrations using the official Tassyir Developer CLI:

```bash
# 1. Authenticate with Tassyir Developer platform
npx tassyir@latest login

# 2. Create a development store sandbox
npx tassyir@latest store create --name "Akadli Dev Store"

# 3. Simulate and trigger inbound order webhooks to your local Akadli playground
npx tassyir@latest webhook trigger orders/created
```

### Required OAuth / App Scopes
When generating an app token in Tassyir App Console, you must request:
- `read_orders`: Allows reading incoming order details, items, and shipping destinations.
- `write_orders`: Allows patching order notes, confirming orders (`/confirm`), and cancelling refused orders (`/cancel`).
- `read_customer_contact`: **Mandatory for voice confirmation.** Without this scope (or if past merchant plan quota), `buyer.phone` is masked as `"**********"` and `waiting: true` is flagged. The adapter enforces this guard immediately.

---

## 2. Base URL & Authentication

- **Base URL:** `https://api.tassyir.io/apps/2026-10`
- **Authentication Header:**
  ```http
  Authorization: Bearer {accessToken}
  ```
  *(For backwards compatibility, `apiKey` is also accepted and maps to Bearer token authentication).*

### Idempotency Keys on Write Routes
Every `POST` write operation (`/confirm`, `/cancel`) sends an `Idempotency-Key` header:
- `CONFIRMED`: `Idempotency-Key: akadli-confirm-{orderId}`
- `MODIFIED`: `Idempotency-Key: akadli-confirm-mod-{orderId}`
- `REFUSED`: `Idempotency-Key: akadli-cancel-{orderId}`

This ensures safe automatic retries without duplicating actions in Tassyir's fulfillment pipeline.

---

## 3. Webhook Signature Verification (`verifyWebhook`)

Tassyir supports the modern **Standard Webhooks (`v1a` Ed25519)** specification as well as HMAC-SHA256 signatures for testing environments.

### Standard Webhooks (`v1a` Ed25519)
- **Headers:**
  - `webhook-id`: Unique message ID (e.g. `msg_741000000000000001`).
  - `webhook-timestamp`: Unix timestamp in seconds or milliseconds.
  - `webhook-signature`: Format `v1a,<base64_ed25519_signature>`.
- **Signed Message:**
  ```text
  ${webhookId}.${webhookTimestamp}.${rawBody}
  ```
- **Replay Protection:** Webhook timestamp must be within 5 minutes (`300` seconds) of the current system time.
- **Verification:** Computed using Node.js `node:crypto.verify(null, messageBuffer, publicKey, sigBuffer)`. The `secret` parameter can be an Ed25519 raw base64 public key (32 bytes), SPKI DER (44 bytes), or PEM string.

### HMAC-SHA256 Fallback
- **Headers:** `x-tassyir-signature`, `x-akadli-signature`, or `webhook-signature`.
- **Verification:** Computed with `crypto.createHmac("sha256", secret)` over `rawBody` (or standard webhook message) and compared via `crypto.timingSafeEqual`.

---

## 4. Inbound Order Normalization (`parseWebhookOrder`)

Tassyir emits `orders/created` events with a nested envelope (`data.order`) or flat order objects.

### Envelope Structure (`2026-10`)
```json
{
  "id": "evt_order_created_741000000000000001",
  "type": "orders/created",
  "apiVersion": "2026-10",
  "data": {
    "order": {
      "id": "741000000000000001",
      "store_name": "Dz Mode Constantine",
      "total": "8500.00",
      "buyer": {
        "name": "Khadija Benali",
        "phone": "0550123456",
        "provinceCode": 25,
        "townOns": "El Khroub",
        "address": "Cité 1600 Logements, Bâtiment B3"
      },
      "delivery": {
        "method": "home"
      },
      "items": [
        {
          "id": "item_90421",
          "title": "Robe Traditionnelle Constantinoise",
          "variantTitle": "L",
          "quantity": 1,
          "price": "8500.00"
        }
      ],
      "status": "pending",
      "created_at": "2026-10-19T14:30:00Z"
    }
  }
}
```

### Field Mapping & Guards
1. **Order ID:** `String(order.id)` (e.g. `"741000000000000001"`).
2. **Total Price:** Parsed from decimal string `order.total` (`"8500.00"` -> `8500` DA).
3. **Buyer Contact Guard:**
   - If `order.waiting === true` or `buyer.phone` is masked (`"**********"`), the adapter throws:
     `"Tassyir order buyer contact is masked or missing: ensure your Tassyir app has the 'read_customer_contact' scope and the order is not in WAITING state."`
4. **Wilaya & Commune Normalization:**
   - `provinceCode` (number `1..69`, e.g. `25` -> Constantine, `59` -> Aflou) maps to official 2026 Algerian divisions via `@akadli/dz-geo`.
   - `townOns` maps to canonical Algerian commune names.
5. **Item Details:**
   - Name: `items[0].title` or `items[0].name`.
   - Size: `items[0].variantTitle`, `items[0].variant`, or `items[0].options`.

---

## 5. Post-Call Order Decision Mutations (`applyOrderDecision`)

Post-call decisions from Akadli-AI voice calls are dispatched back to Tassyir Admin API (`2026-10`).

### Credentials Configuration
```typescript
interface TassyirCredentials {
  accessToken: string; // or apiKey
  baseUrl?: string; // Default: https://api.tassyir.io/apps/2026-10
  confirmOnModified?: string; // "true" | "false", default: "true"
  cancelOnRefused?: string; // "true" | "false", default: "true"
}
```

### Outbound Actions

#### 1. `CONFIRMED`
1. `PATCH https://api.tassyir.io/apps/2026-10/orders/{orderId}`
   ```json
   {
     "note": "[Akadli-AI] Order CONFIRMED by customer (akadli-confirmed)."
   }
   ```
2. `POST https://api.tassyir.io/apps/2026-10/orders/{orderId}/confirm`
   - Header: `Idempotency-Key: akadli-confirm-{orderId}`
   - Body: `{}`

Returns `externalStatus: "CONFIRMED"`.

#### 2. `MODIFIED`
1. Resolve numeric Wilaya code `provinceCode` (`1..69`) from `decision.finalWilaya`.
2. `PATCH https://api.tassyir.io/apps/2026-10/orders/{orderId}`
   ```json
   {
     "buyer": {
       "provinceCode": 13,
       "address": "Maghnia - Cite Imama"
     },
     "note": "[Akadli-AI] Order MODIFIED (akadli-modified, akadli-size-L) — Commune: Maghnia | Size: L | Address: Cite Imama | Notes: Customer changed size"
   }
   ```
3. If `credentials.confirmOnModified !== "false"`:
   `POST https://api.tassyir.io/apps/2026-10/orders/{orderId}/confirm`
   - Header: `Idempotency-Key: akadli-confirm-mod-{orderId}`
   - Body: `{}`

Returns `externalStatus: "MODIFIED"`.

#### 3. `REFUSED`
1. If `credentials.cancelOnRefused !== "false"`:
   `POST https://api.tassyir.io/apps/2026-10/orders/{orderId}/cancel`
   - Header: `Idempotency-Key: akadli-cancel-{orderId}`
   - Body:
     ```json
     {
       "note": "[Akadli-AI] Order REFUSED by customer (akadli-refused): Customer refused during voice call"
     }
     ```
2. Otherwise, `PATCH https://api.tassyir.io/apps/2026-10/orders/{orderId}` updating `note`.

Returns `externalStatus: "REFUSED"`.

---

## 6. Rate Limit & Busy Handling
- **429 Rate Limits:**
  - Standard rate limit: Returns `externalStatus: "RATE_LIMITED"`.
  - Quota exhaustion (`code: "BUSINESS_RATE_LIMITED"`): Returns `externalStatus: "BUSINESS_RATE_LIMITED"`.
- **503 Server Busy (`API_BUSY`):**
  - Respects `Retry-After` header with bounded exponential backoff up to 3 retry attempts.
