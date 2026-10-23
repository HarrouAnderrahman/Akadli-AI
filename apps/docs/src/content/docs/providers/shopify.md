---
title: Shopify
description: Production Shopify Cash-on-Delivery adapter with Dev Dashboard setup, protected customer data access, and missing-province resolution.
---

`@akadli/provider-shopify` implements `IEcommerceProvider` for Shopify stores operating in Algeria. It handles webhook cryptographic verification (HMAC-SHA256 Base64), extracts Algerian addresses from checkout apps or standard forms, and performs REST order updates.

---

## Installation

```bash
pnpm add @akadli/provider-shopify
```

---

## Shopify Dev Dashboard Setup Guide (2026)

Follow these steps to connect your custom or headless Shopify app:

### 1. Create App in Shopify Partners / Dev Dashboard
1. Go to [dev.shopify.com](https://dev.shopify.com) (or your Shopify Partner Dashboard) -> **Apps** -> **Create an App**.
2. Select **Create app manually**.
3. Set App Name to `Akadli-AI Voice Confirmation`.
4. App URL: Enter your backend endpoint (e.g., `https://api.yourdomain.com`).
5. **CRITICAL:** Leave **Embed app in Shopify admin** **UNCHECKED** for headless webhook processing.

### 2. Configure Scopes & Access Tokens
1. In your App settings -> **Configuration** -> **Admin API integration**, click **Configure**.
2. Grant the following scopes:
   - `read_orders`
   - `write_orders`
   - `read_products` (recommended to resolve alternative sizes)

### 3. Enable Protected Customer Data Access (MANDATORY)
1. In **API access** -> **Protected customer data access**, request:
   - **Name**
   - **Address**
   - **Phone**
2. *Important:* If this is not granted, Shopify masks customer phone numbers in webhooks and blocks shipping address updates!

### 4. Create Webhook
1. In your Shopify Store Admin -> **Settings** -> **Notifications** -> **Webhooks** (or via Admin API):
2. Click **Create Webhook**:
   - **Event:** `Order creation`
   - **Format:** `JSON`
   - **URL:** `https://your-domain.com/api/webhooks/shopify`
   - **Webhook API Version:** `2025-01` or latest
3. Copy the **Webhook Secret** key at the bottom of the page.

---

## Algeria Address Fallback (`province: null`)

Standard Shopify checkout forms hide the province/state dropdown when `country_code: "DZ"` is selected. Customers typically input their Wilaya into:
- The `city` field
- The `address1` field
- A 5-digit postal code (`13000` -> Wilaya `13`)
- Custom `note_attributes` added by 1-page checkout apps (EasySell, Releasit, CodForm).

`@akadli/provider-shopify` inspects all of these fields and runs them through `@akadli/dz-geo`'s 4-stage resolver, correctly extracting Wilayas `01` through `69`.

---

## Credentials Schema

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `shopDomain` | `string` | Yes | — | Store myshopify domain (e.g. `dz-store.myshopify.com`) |
| `accessToken` | `string` | Optional* | — | Permanent Admin API access token (`shpat_...`) |
| `clientId` | `string` | Optional* | — | App Client ID (for OAuth `client_credentials` flow) |
| `clientSecret` | `string` | Optional* | — | App Client Secret |
| `apiVersion` | `string` | No | `"2025-01"` | Shopify Admin REST API version |
| `cancelOnRefused` | `string` | No | `"true"` | Cancels order on `REFUSED` decision |

*\*Provide either `accessToken` OR both `clientId` and `clientSecret`.*

---

## Code Example

```typescript
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

// 1. Verify Webhook HMAC signature (Base64)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.SHOPIFY_WEBHOOK_SECRET!
);

// 2. Parse standardized Algerian COD order
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Apply post-call decision
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "MODIFIED",
    finalVariant: "42",
    finalCommune: "Barika",
    reasonOrNotes: "Customer updated size to 42"
  },
  {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
  }
);
```
