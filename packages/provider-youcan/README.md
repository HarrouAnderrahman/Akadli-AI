**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/provider-youcan

> YouCan (.shop) Cash-On-Delivery (COD) adapter with Algerian 1-page checkout parsing, HMAC-SHA256 signature verification, and REST order mutations.

Implements `IEcommerceProvider` from `@akadli/adapter-contract` for YouCan stores operating in Algeria.

---

## YouCan Seller Area Setup Guide

1. **Generate API Token:** In [seller-area.youcan.shop](https://seller-area.youcan.shop), go to **Settings** -> **API & Integrations** and generate an API Access Token.
2. **Configure Webhook:**
   - In **Settings** -> **Webhooks**, create a new webhook for the event `order.created`.
   - Set the URL to your endpoint (e.g. `https://your-domain.com/api/webhooks/youcan`).
   - Copy the generated Webhook Secret (`x-youcan-signature` hex digest verification).
3. **Algerian 1-Page COD Parsing:**
   - In Algeria, YouCan merchants often use single-page checkout forms where customer inputs are stored inside `extra_fields` or `custom_fields`.
   - `@akadli/provider-youcan` automatically extracts address information from both standard `shipping.address` and `extra_fields` / `custom_fields`, normalizing the Wilaya (`01`-`69`) and commune via `@akadli/dz-geo`.

---

## Credentials Schema (`YouCanCredentialsSchema`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | Yes | — | YouCan API Access Token |
| `baseUrl` | `string` | No | `"https://api.youcan.shop"` | YouCan REST API base URL |
| `closeOnRefused` | `string` | No | `"true"` | Closes/cancels the order if customer refuses call |

---

## Usage Example

```typescript
import { YouCanProvider } from "@akadli/provider-youcan";

const provider = new YouCanProvider();

// 1. Verify Webhook HMAC signature (hex digest from x-youcan-signature)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.YOUCAN_WEBHOOK_SECRET!);

// 2. Parse standardized Algerian COD order (supports shipping.address & extra_fields)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Mutate YouCan order after confirmation call (tags: akadli-confirmed / akadli-modified / akadli-refused)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "Confirmed via voice call"
}, {
  accessToken: process.env.YOUCAN_ACCESS_TOKEN!
});
```
