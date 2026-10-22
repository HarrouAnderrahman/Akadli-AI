---
title: WooCommerce Adapter (@akadli/provider-woocommerce)
description: WooCommerce REST v3 Cash-on-Delivery adapter with DZ-XX state codes, COD plugin meta_data parser, and HMAC verification.
---

`@akadli/provider-woocommerce` connects WordPress WooCommerce stores with Akadli-AI. It maps standard WooCommerce `DZ-XX` state codes, parses custom Algerian COD checkout plugins (`meta_data`), handles webhook handshakes, and mutates orders via REST API v3.

---

## Installation

```bash
pnpm add @akadli/provider-woocommerce
```

---

## WooCommerce & WordPress Setup Guide

### 1. Generate REST API Keys
1. In your WordPress Admin, go to **WooCommerce** -> **Settings** -> **Advanced** -> **REST API**.
2. Click **Add key**:
   - **Description:** `Akadli-AI Integration`
   - **User:** Select an administrator or shop manager
   - **Permissions:** **Read/Write**
3. Copy the generated **Consumer Key** (`ck_...`) and **Consumer Secret** (`cs_...`).

### 2. Configure the Order Webhook
1. Go to **WooCommerce** -> **Settings** -> **Advanced** -> **Webhooks**.
2. Click **Add Webhook**:
   - **Name:** `Akadli-AI Order Created`
   - **Status:** **Active**
   - **Topic:** `Order created`
   - **Delivery URL:** `https://your-domain.com/api/webhooks/woocommerce`
   - **Secret:** Enter a strong secret string (used for Base64 `x-wc-webhook-signature` verification)
   - **API Version:** **WP REST API Integration v3**
3. Save the webhook.

### 3. Algerian `DZ-XX` States & COD Plugins
Standard WooCommerce represents Algerian Wilayas as `DZ-XX` state codes (e.g., `DZ-16` for Alger, `DZ-60` for Barika, `DZ-68` for Bou Saada).
Stores using Algerian COD checkout plugins (such as COD Form Algeria or Easy COD) typically write customer Wilayas and communes to order `meta_data` (e.g., `_billing_wilaya`, `_shipping_commune`).

`@akadli/provider-woocommerce` inspects both the standard `shipping.state` property and all custom `meta_data` keys, automatically mapping them into canonical `@akadli/dz-geo` Wilayas (`01`–`69`).

---

## Credentials Schema

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `siteUrl` | `string` | Yes | — | WordPress site URL (e.g. `https://my-dz-store.com`) |
| `consumerKey` | `string` | Yes | — | WooCommerce REST API Consumer Key (`ck_...`) |
| `consumerSecret` | `string` | Yes | — | WooCommerce REST API Consumer Secret (`cs_...`) |
| `cancelOnRefused` | `string` | No | `"true"` | Cancels order on `REFUSED` decision |

---

## Code Example

```typescript
import { WooCommerceProvider, isWooCommerceWebhookPing } from "@akadli/provider-woocommerce";

const provider = new WooCommerceProvider();

// 1. Acknowledge WooCommerce initial unsigned handshake ping (WC_Webhook::deliver_ping)
if (isWooCommerceWebhookPing(headers, req.body, rawBody)) {
  return res.status(200).json({ success: true, message: "Webhook ping acknowledged" });
}

// 2. Verify Webhook HMAC signature (Base64 from x-wc-webhook-signature)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.WOOCOMMERCE_WEBHOOK_SECRET!
);

if (!isValid) {
  return res.status(401).json({ error: "Invalid HMAC signature" });
}

// 3. Parse standardized Algerian COD order (supports DZ-XX states and meta_data)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 4. Mutate WooCommerce order after confirmation call
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "Customer confirmed order via phone"
  },
  {
    siteUrl: process.env.WOOCOMMERCE_SITE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!
  }
);
```
