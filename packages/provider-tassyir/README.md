**[English](./README.md) | [العربية](./README.ar.md)**

# @akadli/provider-tassyir

> Official Tassyir Admin API (2026-10) adapter with Standard Webhooks (v1a Ed25519 zero-secret public key verification & HMAC fallback), install-code OAuth (tsy_ic_...) with HTTP Basic Auth, idempotent order confirmations (Idempotency-Key), and Algerian COD address normalization.

Implements `IEcommerceProvider` from `@akadli/adapter-contract` for Algerian merchants and fulfillment hubs managing Cash on Delivery (COD) orders via **Tassyir** (`api.tassyir.io`).

---

## Tassyir App Configuration (tassyir.app.toml)

When developing a headless external application on the Tassyir Developer platform (`developers.tassyir.io`), configure your `tassyir.app.toml` file as follows:

```toml
[app]
name = "Akadli-AI Voice Confirmation"
handle = "akadli-ai"
client_id = "app_..."

[auth]
callback_url = "https://<tunnel>/api/webhooks/tassyir/callback"
scopes = [
  "read_orders",
  "write_orders",
  "read_customer_contact",
  "read_products"
]

[webhooks]
url = "https://<tunnel>/api/webhooks/tassyir"
events = [
  "orders/created"
]
```

### Required App Scopes
- `read_orders`: Read incoming orders, line items, and customer delivery destinations.
- `write_orders`: Update order notes, confirm (`/confirm`), and cancel (`/cancel`) orders.
- `read_customer_contact`: **Mandatory for voice confirmation.** Without this scope (or if past merchant plan quota), phone numbers are masked as `"**********"` and the order enters `waiting: true`. The adapter detects this and throws an actionable error.
- `read_products`: Recommended for multi-variant products. Allows the adapter to fetch full size/variant choices from `GET /products/{productId}` so voice callers can switch sizes.

---

## Authentication & OAuth Flow

Tassyir external apps do not use static merchant API keys. Authentication uses OAuth 2.0 with install authorization codes:

1. **App Installation:** When a merchant installs the external app on their store, Tassyir redirects their browser to your configured `[auth] callback_url` with an install code:
   ```text
   GET https://<tunnel>/api/webhooks/tassyir/callback?code=tsy_ic_...
   ```
2. **Redeeming Install Code:** The backend redeems `tsy_ic_...` via `POST https://api.tassyir.io/apps/oauth/token`:
   - **Authentication:** HTTP Basic Auth header `Authorization: Basic base64(client_id:client_secret)`
   - **Content-Type:** `application/x-www-form-urlencoded`
   - **Body:** `grant_type=authorization_code&code=tsy_ic_...`
   - Note: Never pass `client_secret` in the request body; Tassyir rejects that with `invalid_client`.
   - **Response:**
     ```json
     {
       "access_token": "tsy_at_...",
       "refresh_token": "tsy_rt_...",
       "expires_in": 3600,
       "token_type": "Bearer",
       "installation_id": "inst_..."
     }
     ```
3. **Refreshing Tokens:** When the access token expires, refresh it using `grant_type=refresh_token&refresh_token=tsy_rt_...` with HTTP Basic Auth. The `TassyirClient` automatically handles this refresh.

---

## Standard Webhooks & Public Keys (Zero-Secret Verification)

Tassyir signs all inbound webhooks using the **Standard Webhooks (`v1a` Ed25519)** specification. Tassyir does **not** provide a per-store "webhook secret". Instead:

- Signatures are signed using an Ed25519 private key by Tassyir.
- Corresponding public keys (`whpk_<base64_raw_32_byte_ed25519_key>`) are published at:
  ```text
  GET https://api.tassyir.io/apps/webhook-keys
  ```
- The adapter decodes the 32-byte raw Ed25519 public key natively using standard 12-byte ASN.1 SPKI DER prefix (`302a300506032b6570032100` in hex) with Node's native `crypto.createPublicKey`:
  ```typescript
  const spkiDerPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const der = Buffer.concat([spkiDerPrefix, raw32ByteKeyBuffer]);
  const keyObject = crypto.createPublicKey({ key: der, format: "der", type: "spki" });
  ```
- Public keys fetched from `https://api.tassyir.io/apps/webhook-keys` are cached in memory for 1 hour.
- An embedded fallback key (`whpk_1BaNZhSk1qxT/1RugRT9eucQWvfo1ufg0o1u5qZejAA=`) ensures offline and test resilience.
- For local unit testing and simulators, HMAC-SHA256 verification is supported when a non-`whpk_` secret is passed explicitly.

---

## Credentials Configuration (TassyirCredentialsSchema)

The adapter accepts either direct access tokens or OAuth application credentials:

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | Optional* | — | Direct Tassyir Bearer access token (`tsy_at_...` or `apiKey` for backwards compatibility) |
| `clientId` | `string` | Optional* | — | Tassyir App Client ID (`app_...`) from Developer Console |
| `clientSecret` | `string` | Optional* | — | Tassyir App Client Secret (`tsy_cs_...`) from Developer Console |
| `refreshToken` | `string` | Optional | — | Tassyir OAuth Refresh Token (`tsy_rt_...`) for auto-refresh |
| `baseUrl` | `string` | No | `"https://api.tassyir.io/apps/2026-10"` | Tassyir Admin API base endpoint |
| `confirmOnModified` | `string` | No | `"true"` | Calls `/confirm` when an order is updated with new size/address |
| `cancelOnRefused` | `string` | No | `"true"` | Calls `/cancel` when an order is refused during a voice call |

\* Either `accessToken` or (`clientId` and `clientSecret`) must be provided.

---

## Usage Example

```typescript
import { TassyirProvider, TassyirClient } from "@akadli/provider-tassyir";

// 1. Initialize provider
const provider = new TassyirProvider();

// 2. Verify inbound webhook (zero-secret Ed25519 verification against published whpk_ keys)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody
);

if (!isValid) {
  throw new Error("Invalid Tassyir Ed25519 signature");
}

// 3. Parse standardized Algerian COD order (supports 2026-10 envelope)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 4. Apply post-call decision to Tassyir Admin API
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "Customer confirmed via ElevenAgents voice call",
  },
  {
    clientId: process.env.TASSYIR_CLIENT_ID!,
    clientSecret: process.env.TASSYIR_CLIENT_SECRET!,
    refreshToken: process.env.TASSYIR_REFRESH_TOKEN!,
  }
);

console.log("Mutation result:", result.externalStatus); // "CONFIRMED"
```

---

## OAuth Helper Methods on TassyirClient

```typescript
const client = new TassyirClient({
  clientId: process.env.TASSYIR_CLIENT_ID!,
  clientSecret: process.env.TASSYIR_CLIENT_SECRET!,
});

// Redeem merchant install code on callback redirect
const tokens = await client.redeemInstallCode(
  process.env.TASSYIR_CLIENT_ID!,
  process.env.TASSYIR_CLIENT_SECRET!,
  installCode
);
console.log("Access Token:", tokens.access_token);
console.log("Refresh Token:", tokens.refresh_token);

// Refresh expired token
const refreshed = await client.refreshAccessToken(
  process.env.TASSYIR_CLIENT_ID!,
  process.env.TASSYIR_CLIENT_SECRET!,
  tokens.refresh_token!
);
```
