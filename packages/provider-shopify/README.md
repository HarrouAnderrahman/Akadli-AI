**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/provider-shopify

> Shopify Cash-On-Delivery (COD) adapter with 2026 Algerian address resolution, HMAC-SHA256 verification, and REST order mutations.

Implements `IEcommerceProvider` from `@akadli/adapter-contract` for Shopify stores using standard checkout or Algerian 1-page checkout apps (EasySell, Releasit, CodForm).

---

## 2026 Shopify Dev Dashboard Setup Guide

1. **Create App:** Navigate to [dev.shopify.com](https://dev.shopify.com) -> **Apps** -> **Create an App**.
   - App URL: `https://example.com` (leave **Embed app in Shopify admin** **UNCHECKED**).
   - Scopes: In **API access**, grant `read_orders` and `write_orders`.
2. **Enable Protected Customer Data Access (CRITICAL):**
   - In **API access** -> **Protected customer data access**, enable **Name**, **Address**, and **Phone**.
   - *Without this, Shopify redacts customer details from webhooks and blocks shipping address updates.*
3. **Configure Webhook:**
   - In Shopify Admin -> **Settings** -> **Notifications** -> **Webhooks**, create an `Order creation` JSON webhook pointing to `/api/webhooks/shopify`.
4. **Algerian Address Fallback (`province: null`):**
   - Standard Shopify checkout hides the state/province dropdown for Algeria. Customers input Wilayas in `city`, `address1`, or 5-digit `zip` (`13000` -> Wilaya `13`). COD apps store details in `note_attributes`. `@akadli/provider-shopify` extracts and normalizes all candidates via `@akadli/dz-geo`.

---

## Credentials Schema (`ShopifyCredentialsSchema`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `shopDomain` | `string` | Yes | — | Shopify domain (e.g., `store.myshopify.com`) |
| `accessToken` | `string` | Optional* | — | Permanent Admin API token (`shpat_...`) |
| `clientId` | `string` | Optional* | — | OAuth Client ID (auto-exchanged for token) |
| `clientSecret` | `string` | Optional* | — | OAuth Client Secret |
| `apiVersion` | `string` | No | `"2024-04"` | Shopify Admin REST API version |
| `cancelOnRefused` | `string` | No | `"true"` | Cancels order on `REFUSED` decision |

*\*Must provide either `accessToken` OR both `clientId` and `clientSecret`.*

---

## Usage Example

```typescript
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

// 1. Verify Webhook HMAC signature (Base64)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.SHOPIFY_WEBHOOK_SECRET!);

// 2. Parse standardized Algerian COD order
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Apply post-call decision to Shopify (tags: akadli-confirmed / akadli-modified / akadli-refused)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "Confirmed via voice agent"
}, {
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
});
```
