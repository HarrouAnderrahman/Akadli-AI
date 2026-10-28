---
title: YouCan
description: YouCan (.shop) Cash-on-Delivery adapter with 1-page checkout extra_fields extraction and HMAC signature verification.
---

`@akadli/provider-youcan` provides seamless integration with the **YouCan (.shop)** e-commerce platform for Algerian merchants. It parses single-page COD checkout forms where custom Wilaya and commune dropdowns are stored in `extra_fields` or `custom_fields`.

---

## Installation

```bash
pnpm add @akadli/provider-youcan
```

---

## YouCan Seller Area Setup Guide

### 1. Generate an API Access Token
1. Log into your [seller-area.youcan.shop](https://seller-area.youcan.shop) dashboard.
2. Navigate to **Settings** -> **API & Integrations**.
3. Generate a new API Access Token and grant full permissions for **Orders**.
4. Store this token securely as `YOUCAN_ACCESS_TOKEN`.

### 2. Configure the Order Webhook
1. In **Settings** -> **Webhooks**, click **Add Webhook**.
2. **Event:** Select `order.created`.
3. **Target URL:** Enter your backend URL (e.g., `https://your-domain.com/api/webhooks/youcan`).
4. Copy the generated **Webhook Secret** (used to verify the `x-youcan-signature` header).

### 3. Algerian 1-Page COD Checkout Support
Algerian YouCan store owners commonly use single-page checkout templates with custom dropdowns for Wilayas and Communes. YouCan passes these values inside:
- `extra_fields`
- `custom_fields`
- Standard `shipping_address`

`@akadli/provider-youcan` inspects all three data sources, normalizes the Wilaya to official 2026 codes (`01`–`69`), and resolves the delivery commune via `@akadli/dz-geo`. It also extracts `quantity` (sum of `variants[].quantity` / `items[].quantity` / `line_items[].quantity` or `extra_fields` `quantity`/`qty`, default `1`) and `shippingFeeDa` (`shipping.price` / `shipping_cost` / `shipping_total` or `extra_fields` `shipping`/`livraison`, default `0`), and appends `akadli-qty-{finalQuantity}` on `MODIFIED`.

---

## Credentials Schema

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | Yes | — | YouCan API Access Token |
| `baseUrl` | `string` | No | `"https://api.youcan.shop"` | YouCan REST API base URL |
| `closeOnRefused` | `string` | No | `"true"` | Cancels/closes the order when status is `REFUSED` |

---

## Code Example

```typescript
import { YouCanProvider } from "@akadli/provider-youcan";

const provider = new YouCanProvider();

// 1. Verify Webhook HMAC hex signature (x-youcan-signature)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.YOUCAN_WEBHOOK_SECRET!
);

// 2. Parse standardized Algerian COD order
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Mutate YouCan order after confirmation call
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "Confirmed in Darja via voice call"
  },
  {
    accessToken: process.env.YOUCAN_ACCESS_TOKEN!
  }
);
```
