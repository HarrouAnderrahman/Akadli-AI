---
title: End-to-End TypeScript Quickstart
description: Step-by-step guide to integrating Akadli-AI voice confirmation into your backend.
---

This guide demonstrates how to set up an end-to-end Algerian COD voice confirmation pipeline in TypeScript using Node 20+, `@akadli/core`, `@akadli/dz-geo`, and a store adapter (such as `@akadli/provider-shopify`).

## Prerequisites

- Node.js `20.0.0` or higher (uses native `fetch` and `node:crypto`).
- pnpm (recommended) or npm.
- An ElevenLabs account with an agent created in the ElevenLabs dashboard.
- API credentials for your e-commerce store (e.g. Shopify, YouCan, WooCommerce, or Tassyir).

---

## 1. Install Dependencies

Install the core engine, the Algerian geo normalizer, and your platform's adapter:

```bash
pnpm add @akadli/core @akadli/dz-geo @akadli/provider-shopify
```

---

## 2. Environment Variables

Create a `.env` file with your credentials:

```bash
# ElevenLabs Conversational AI
ELEVENLABS_API_KEY=xi_...
ELEVENLABS_AGENT_ID=agent_...

# Shopify Store Credentials
SHOPIFY_SHOP_DOMAIN=my-dz-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...
SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret
```

---

## 3. Webhook Ingress & Order Ingestion

Create an Express, Fastify, or Next.js route handler to receive the store's `orders/create` webhook.

```typescript
import express from "express";
import { ShopifyProvider } from "@akadli/provider-shopify";
import { buildElevenAgentsDynamicVariables } from "@akadli/core";

const app = express();
const shopify = new ShopifyProvider();

// Store raw body for HMAC verification
app.post(
  "/api/webhooks/shopify",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const rawBody = req.body.toString("utf-8");
      const headers = req.headers as Record<string, string>;

      // 1. Verify HMAC cryptographic signature
      const isValid = await shopify.verifyWebhook(
        headers,
        rawBody,
        process.env.SHOPIFY_WEBHOOK_SECRET!
      );

      if (!isValid) {
        return res.status(401).send("Invalid HMAC signature");
      }

      // 2. Parse payload into standardized 2026 Algerian format
      const order = await shopify.parseWebhookOrder(JSON.parse(rawBody));
      console.log(`Parsed Order #${order.orderId} for ${order.customerName} (${order.currentWilaya})`);

      // 3. Build dynamic variables for the ElevenAgents voice call
      const dynamicVariables = buildElevenAgentsDynamicVariables(order);

      // Respond immediately to Shopify (must return 200 within 5 seconds)
      res.status(200).send("Webhook received");

      // 4. Trigger voice call asynchronously
      await startConfirmationCall(order, dynamicVariables);
    } catch (err) {
      console.error("Webhook processing failed:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);
```

---

## 4. Handling the ElevenLabs Finalize Tool Call

In your ElevenLabs dashboard, register a client/server tool named `finalize_order_decision` with parameters:
- `orderId` (string)
- `status` ("CONFIRMED" | "REFUSED" | "MODIFIED")
- `finalVariant` (string, optional)
- `finalWilaya` (string, optional)
- `finalCommune` (string, optional)
- `finalAddressNote` (string, optional)
- `reasonOrNotes` (string, optional)

When the call concludes, your webhook/tool endpoint executes `handleFinalizeOrderToolCall`:

```typescript
import { handleFinalizeOrderToolCall } from "@akadli/core";

// Handler for the ElevenLabs webhook tool execution
app.post("/api/elevenlabs/finalize", express.json(), async (req, res) => {
  const toolPayload = req.body; // e.g. { orderId: "1001", status: "CONFIRMED", ... }
  const orderConstraints = await lookupOrderConstraints(toolPayload.orderId);

  const result = await handleFinalizeOrderToolCall(
    toolPayload,
    shopify,
    {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
    },
    orderConstraints
  );

  res.json({
    success: result.success,
    externalStatus: result.externalStatus
  });
});
```

---

## 5. Result Verification

After execution, inspect your Shopify Admin:
- **Tags:** `akadli-confirmed` (or `akadli-modified`, `akadli-variant-42`, `akadli-refused`).
- **Notes:** Order note prefixed with `[Akadli-AI]` with timestamp and caller feedback.
- **Address & Item:** Updated to reflect customer choices if status was `MODIFIED`.
