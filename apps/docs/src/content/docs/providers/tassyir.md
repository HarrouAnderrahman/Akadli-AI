---
title: Tassyir ERP Adapter (@akadli/provider-tassyir)
description: Official Tassyir Admin API (2026-10), Standard Webhooks (v1a Ed25519 zero-secret), OAuth install code flow, and courier dispatch.
---

`@akadli/provider-tassyir` connects **Tassyir** (`api.tassyir.io`), the leading Cash-on-Delivery (COD) and courier management ERP in Algeria, with the Akadli-AI voice confirmation engine.

It implements the official **Tassyir Admin API (`2026-10`)** specification, zero-secret **Standard Webhooks (`v1a` Ed25519)** verification, install-code OAuth flows with HTTP Basic Auth, and idempotent order confirmations.

---

## Installation

```bash
pnpm add @akadli/provider-tassyir
```

---

## Tassyir App Setup (`tassyir.app.toml`)

When creating an external headless application on the Tassyir Developer platform ([developers.tassyir.io](https://developers.tassyir.io)), define your `tassyir.app.toml`:

```toml
[app]
name = "Akadli-AI Voice Confirmation"
handle = "akadli-ai"
client_id = "app_..."

[auth]
callback_url = "https://your-domain.com/api/webhooks/tassyir/callback"
scopes = [
  "read_orders",
  "write_orders",
  "read_customer_contact",
  "read_products"
]

[webhooks]
url = "https://your-domain.com/api/webhooks/tassyir"
events = [
  "orders/created"
]
```

### Required OAuth Scopes
- `read_orders`: Ingest incoming orders, total prices, and line items.
- `write_orders`: Update order notes, confirm (`/confirm`), and cancel (`/cancel`).
- `read_customer_contact`: **Mandatory for voice confirmation.** Without this scope (or if past merchant plan quota), Tassyir masks phone numbers as `"**********"` and flags `waiting: true`. The adapter guards against masked contacts and throws an actionable error.
- `read_products`: Recommended. Allows the adapter to fetch alternative sizes/variants from `GET /products/{productId}` so voice callers can switch sizes.

---

## Standard Webhooks (v1a Ed25519 Zero-Secret Verification)

Tassyir signs inbound webhooks using the **Standard Webhooks (`v1a` Ed25519)** specification. Tassyir does **not** issue a per-store shared webhook secret.

1. Inbound headers:
   - `webhook-id`: Unique message ID (e.g. `msg_741...`).
   - `webhook-timestamp`: Unix timestamp in seconds. Replay tolerance is 5 minutes (`300` seconds).
   - `webhook-signature`: Format `v1a,<base64_ed25519_signature>`.
2. Public keys (`whpk_<base64_raw_32_byte_ed25519_key>`) are fetched dynamically from `GET https://api.tassyir.io/apps/webhook-keys` (cached for 1 hour).
3. The adapter natively decodes raw 32-byte Ed25519 keys using the 12-byte ASN.1 SPKI DER prefix (`302a300506032b6570032100` in hex) via Node's `node:crypto`.
4. Embedded fallback key `whpk_1BaNZhSk1qxT/1RugRT9eucQWvfo1ufg0o1u5qZejAA=` ensures zero-downtime resilience.

---

## OAuth Installation Code Flow (`tsy_ic_...`)

Tassyir apps authenticate using OAuth 2.0:
1. When a merchant installs your app, Tassyir redirects their browser to your `callback_url` with an install code:
   ```text
   GET /api/webhooks/tassyir/callback?code=tsy_ic_...
   ```
2. Your backend redeems `tsy_ic_...` via `POST https://api.tassyir.io/apps/oauth/token`:
   - **Header:** `Authorization: Basic base64(client_id:client_secret)`
   - **Header:** `Content-Type: application/x-www-form-urlencoded`
   - **Body:** `grant_type=authorization_code&code=tsy_ic_...`
   - *(Note: `client_secret` must NOT be in the body).*
   - **Response:**
     ```json
     {
       "access_token": "tsy_at_...",
       "refresh_token": "tsy_rt_...",
       "expires_in": 3600,
       "token_type": "Bearer"
     }
     ```

---

## CLI & Dev Tools

Tassyir provides an official CLI for scaffolding and testing webhooks:

```bash
# Verify app configuration or test webhooks locally
npx tassyir@latest app dev
```

---

## Credentials Schema

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | Optional* | — | Direct Bearer token (`tsy_at_...`) |
| `clientId` | `string` | Optional* | — | App Client ID (`app_...`) |
| `clientSecret` | `string` | Optional* | — | App Client Secret (`tsy_cs_...`) |
| `refreshToken` | `string` | Optional | — | Refresh token (`tsy_rt_...`) for automatic renewal |
| `baseUrl` | `string` | No | `"https://api.tassyir.io/apps/2026-10"` | Admin API base endpoint |
| `confirmOnModified` | `string` | No | `"true"` | Calls `/confirm` when size/address is updated |
| `cancelOnRefused` | `string` | No | `"true"` | Calls `/cancel` when order is refused |

---

## Code Example

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. Zero-secret Ed25519 signature verification against published whpk_ keys
const isValid = await provider.verifyWebhook(headers, rawBody);

if (!isValid) {
  throw new Error("Invalid Tassyir Ed25519 signature");
}

// 2. Parse 2026-10 order envelope and resolve 69-Wilaya division
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Mutate Tassyir order with idempotent confirmation
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "Confirmed in Darja via voice call"
  },
  {
    clientId: process.env.TASSYIR_CLIENT_ID!,
    clientSecret: process.env.TASSYIR_CLIENT_SECRET!,
    refreshToken: process.env.TASSYIR_REFRESH_TOKEN!
  }
);
```
