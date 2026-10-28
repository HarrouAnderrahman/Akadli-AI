# Tassyir Admin API (`2026-10`) & Standard Webhooks Specification (`@akadli/provider-tassyir`)

This document defines the technical specification, authentication, Standard Webhook Ed25519 verification, Algerian COD data extraction, and order decision mutation flow for Tassyir (`api.tassyir.io`) integrating natively with the **Akadli-AI** voice confirmation engine.

---

## 1. Tassyir App Setup (`tassyir.app.toml`) & Scopes

External headless apps on the Tassyir Developer platform (`developers.tassyir.io`) are configured via `tassyir.app.toml`:

```toml
name        = "Akadli"
handle      = "akadli"
api_version = "2026-10"

[access]
scopes = ["read_orders", "write_orders", "read_customer_contact", "read_products"]

[access.scope_reasons]
read_orders = "Read incoming COD orders for voice confirmation"
write_orders = "Confirm, modify, or cancel COD orders after voice call"
read_customer_contact = "Read buyer phone and address for confirmation call"
read_products = "Allows the adapter to fetch alternative sizes/variants"

[auth]
callback_url = "https://your-domain.com/api/webhooks/tassyir/callback"

[[webhooks]]
topics = ["orders/created"]
uri    = "/api/webhooks/tassyir"

[hosting]
mode = "external"
url  = "https://your-domain.com"
```

### Required OAuth / App Scopes
- `read_orders`: Allows reading incoming order details, items, and shipping destinations.
- `write_orders`: Allows patching order notes, confirming orders (`/confirm`), and cancelling refused orders (`/cancel`).
- `read_customer_contact`: **Mandatory for voice confirmation.** Without this scope (or if past merchant plan quota), `buyer.phone` is masked as `"**********"` and `waiting: true` is flagged. The adapter enforces this guard immediately.
- `read_products`: Recommended for multi-variant products. Allows the adapter to fetch full size/variant choices from `GET /products/{productId}` so voice agents can let callers choose alternative sizes.

---

## 2. Base URL & Authentication Flow

- **Admin API Base URL:** `https://api.tassyir.io/apps/2026-10`
- **OAuth Token Endpoint:** `POST https://api.tassyir.io/apps/oauth/token`
- **Webhook Public Keys:** `GET https://api.tassyir.io/apps/webhook-keys`

### External App OAuth Installation Flow
1. Merchant installs app; browser redirects to `callback_url?code=tsy_ic_...`.
2. Backend redeems code via `POST /apps/oauth/token`:
   - Header: `Authorization: Basic base64(client_id:client_secret)`
   - Header: `Content-Type: application/x-www-form-urlencoded`
   - Body: `grant_type=authorization_code&code=tsy_ic_...`
   - (Note: `client_secret` must NOT be in the body).
   - Response: `{ access_token: "tsy_at_...", refresh_token: "tsy_rt_...", expires_in: 3600 }`.
3. To refresh: `grant_type=refresh_token&refresh_token=tsy_rt_...` with Basic Auth.

### Idempotency Keys on Write Routes
Every `POST` write operation (`/confirm`, `/cancel`) sends an `Idempotency-Key` header:
- `CONFIRMED`: `Idempotency-Key: akadli-confirm-{orderId}`
- `MODIFIED`: `Idempotency-Key: akadli-confirm-mod-{orderId}`
- `REFUSED`: `Idempotency-Key: akadli-cancel-{orderId}`

---

## 3. Webhook Signature Verification (`verifyWebhook`)

Tassyir signs all inbound webhooks using the **Standard Webhooks (`v1a` Ed25519)** specification. Tassyir has **no** shared webhook secret.

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
- **Verification:** Public keys (`whpk_<base64_raw_32_byte_ed25519_key>`) are fetched from `GET https://api.tassyir.io/apps/webhook-keys` (cached for 1 hour).
  The adapter decodes raw 32-byte Ed25519 public keys using the standard 12-byte ASN.1 SPKI DER prefix (`302a300506032b6570032100` in hex) via Node's native `crypto.createPublicKey`.
  Fallback key `whpk_1BaNZhSk1qxT/1RugRT9eucQWvfo1ufg0o1u5qZejAA=` is embedded for resilience.

### HMAC-SHA256 Fallback
- Used strictly when a custom non-`whpk_` secret is passed in local tests and sandbox simulation.

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
2. **Quantity & Prices:**
   - `quantity`: Sum of `order.items[].quantity` (default `1`).
   - `shippingFeeDa`: Parsed from decimal string `order.shippingPrice` (e.g. `"500.00"` -> `500` DA, default `0`).
   - `priceDa`: Parsed from decimal string `order.total` (`"8500.00"` -> `8500` DA, total COD amount).
3. **Buyer Contact Guard:**
   - If `order.waiting === true` or `buyer.phone` is masked (`"**********"`), the adapter throws:
     `"Tassyir order buyer contact is masked or missing: ensure your Tassyir app has the 'read_customer_contact' scope and the order is not in WAITING state."`
4. **Wilaya & Commune Normalization:**
   - `provinceCode` (number `1..69`, e.g. `25` -> Constantine, `59` -> Aflou) maps to official 2026 Algerian divisions via `@akadli/dz-geo`.
   - `townOns` maps to canonical Algerian commune names.
5. **Item & Variant Extraction:**
   - Name: `items[0].title` or `items[0].name`.
   - Size / Variant: Cleaned from `items[0].variantName` (e.g. `"nike ensemble - M"` -> `"M"`), `variantTitle`, `variant`, or `options`.
   - Constraints (`allowedVariants`):
     - If credentials or client are provided to `parseWebhookOrder` and `items[0].productId` is present, the adapter queries `GET /products/{productId}` to populate all available variants (`product.options` / `product.variants`).
     - Defaults gracefully to the ordered variant(s) across line items if offline or without `read_products` scope.

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
     "note": "[Akadli-AI] Order MODIFIED (akadli-modified, akadli-variant-L, akadli-qty-2) — Commune: Maghnia | Variant: L | Qty: 2 | Address: Cite Imama | Notes: Customer changed size"
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
