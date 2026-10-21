**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/provider-woocommerce

> WooCommerce Cash-On-Delivery (COD) adapter with DZ-XX state code mapping, COD plugin meta_data extraction, HMAC-SHA256 verification, and REST v3 order mutations.

Implements `IEcommerceProvider` from `@akadli/adapter-contract` for WordPress WooCommerce stores operating in Algeria.

---

## WooCommerce & WordPress Setup Guide

1. **Generate REST API Keys:**
   - In WP Admin, navigate to **WooCommerce** -> **Settings** -> **Advanced** -> **REST API**.
   - Click **Add Key**: Set description to `Akadli-AI`, select user, and set Permissions to **Read/Write**.
   - Copy the generated `Consumer key` (`ck_...`) and `Consumer secret` (`cs_...`).
2. **Configure Webhook:**
   - In WP Admin -> **WooCommerce** -> **Settings** -> **Advanced** -> **Webhooks**, click **Add Webhook**.
   - Status: **Active** • Topic: **Order created** • Delivery URL: `https://your-domain.com/api/webhooks/woocommerce`.
   - Secret: Enter your signing secret (used for Base64 `x-wc-webhook-signature` verification).
   - API Version: **WP REST API Integration v3**.
3. **Algerian `DZ-XX` States & COD Plugins:**
   - Standard WooCommerce represents Algerian Wilayas as `DZ-XX` state codes (e.g. `DZ-16` for Alger, `DZ-68` for Bou Saada).
   - Stores using Algerian COD checkout plugins store custom entries in order `meta_data` (e.g., `_billing_wilaya`, `_shipping_commune`).
   - `@akadli/provider-woocommerce` parses both standard address objects and plugin `meta_data` into canonical `@akadli/dz-geo` Wilayas (`01`-`69`).

---

## Credentials Schema (`WooCommerceCredentialsSchema`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `siteUrl` | `string` | Yes | — | WordPress site URL (e.g., `https://dz-store.com`) |
| `consumerKey` | `string` | Yes | — | WooCommerce REST API Consumer Key (`ck_...`) |
| `consumerSecret` | `string` | Yes | — | WooCommerce REST API Consumer Secret (`cs_...`) |
| `cancelOnRefused` | `string` | No | `"true"` | Sets order status to `cancelled` upon `REFUSED` decision |

---

## Usage Example

```typescript
import { WooCommerceProvider, isWooCommerceWebhookPing } from "@akadli/provider-woocommerce";

const provider = new WooCommerceProvider();

// 1. Acknowledge WooCommerce initial unsigned handshake ping (WC_Webhook::deliver_ping)
if (isWooCommerceWebhookPing(headers, req.body, rawBody)) {
  return res.status(200).json({ success: true, message: "Webhook ping acknowledged" });
}

// 2. Verify Webhook HMAC signature (Base64 from x-wc-webhook-signature)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.WOOCOMMERCE_WEBHOOK_SECRET!);
if (!isValid) {
  return res.status(401).json({ error: "Invalid HMAC signature" });
}

// 3. Parse standardized Algerian COD order (supports DZ-XX states and meta_data)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 4. Mutate WooCommerce order (updates meta_data, adds order note, updates status)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "Customer confirmed via phone"
}, {
  siteUrl: process.env.WOOCOMMERCE_SITE_URL!,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!
});
```
