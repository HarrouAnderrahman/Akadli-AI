# WooCommerce COD Order Confirmation Adapter Specification (`@akadli/provider-woocommerce`)

This document defines the technical specification, webhook signature verification, Algerian COD data extraction, and outbound mutation endpoints for WooCommerce stores integrating with the **Akadli-AI** voice confirmation engine.

---

## 1. Webhook Signature Verification (`verifyWebhook`)

WooCommerce signs webhook payloads using HMAC-SHA256 computed over the untouched raw request body with the merchant's configured webhook secret key.

### Specifications
- **Header:** `x-wc-webhook-signature` (case-insensitive extraction via case-insensitive header lookup).
- **Algorithm:** `sha256` HMAC encoded as a **Base64** string.
- **Timing Attack Prevention:** Comparison must be performed using `crypto.timingSafeEqual` between buffers of equal byte length.
- **Fail Safe:** If the header is missing, lengths mismatch, or signature is invalid, return `false` without throwing unhandled exceptions.

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWooCommerceWebhook(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): boolean {
  const headerKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === "x-wc-webhook-signature"
  );
  const signature = headerKey ? headers[headerKey] : undefined;
  if (!signature || !secret) return false;

  const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const hmacBase64 = createHmac("sha256", secret).update(bodyBuffer).digest("base64");

  const sigBuffer = Buffer.from(signature, "utf8");
  const hmacBuffer = Buffer.from(hmacBase64, "utf8");

  if (sigBuffer.length !== hmacBuffer.length) return false;
  return timingSafeEqual(sigBuffer, hmacBuffer);
}
```

### Initial Unsigned Handshake Ping (`isWooCommerceWebhookPing`)
When creating or activating a webhook in WordPress Admin, WooCommerce core invokes `WC_Webhook::deliver_ping()` via `wp_safe_remote_post()`.
- **Payload:** `webhook_id=<id>` (sent with `Content-Type: application/x-www-form-urlencoded`).
- **Signature:** WooCommerce **does not calculate or send** an `x-wc-webhook-signature` header on test pings.
- **Handling:** Webhook receivers must recognize this handshake via `isWooCommerceWebhookPing(headers, body, rawBody)` and acknowledge immediately with HTTP 200 without attempting HMAC verification or order parsing.

---

## 2. Inbound COD Order Extraction (`parseWebhookOrder`)

WooCommerce `order.created` or `order.updated` payloads for Algerian COD merchants typically arrive in one of two modes:
1. **Standard WooCommerce Checkout:** Customer address and phone are located in `billing` and `shipping` objects (`state` formatted as `"DZ-13"`, `"13"`, or `"Tlemcen"`, `city` for Commune, `address_1`/`address_2` for street notes, `phone`, and `postcode`).
2. **Algerian COD Checkout Plugins (WooCommerce Dz, Yalidine WooCommerce, EasyCOD, etc.):** Because merchants in Algeria frequently replace the standard multi-step checkout with a simplified single-form COD plugin, customer phone, Wilaya, and Commune are frequently stored in top-level `meta_data` (e.g. `_billing_wilaya`, `wilaya`, `commune`, `baladiya`, `_billing_phone`).

### Extraction Pipeline

1. **Order Basics:**
   - `orderId`: `String(payload.id)`
   - `storeName`: `payload.store_name || "WooCommerce Store"`
   - `itemName`: First line item title (`payload.line_items?.[0]?.name || "Article"`)
   - `currentSize`: Extracted by scanning `line_items[0]?.meta_data` for keys matching `/(?:pa_size|size|taille|pointure)/i` or variant name/title, defaulting to `"Standard"`.
   - `priceDa`: `Math.round(Number(payload.total || 0))`

2. **Multi-Source Address & Phone Extraction (Standard + COD Plugin Meta):**
   - **Primary Source (Billing & Shipping objects):**
     - Customer Name: `${payload.billing?.first_name || payload.shipping?.first_name || ""} ${payload.billing?.last_name || payload.shipping?.last_name || ""}`.trim() || "Client"
     - Phone: `payload.billing?.phone || payload.shipping?.phone`
     - Wilaya: `payload.shipping?.state || payload.billing?.state` (stripping leading `"DZ-"` or `"dz_"` prefix)
     - City/Commune: `payload.shipping?.city || payload.billing?.city`
     - Address Note: `[payload.shipping?.address_1, payload.shipping?.address_2].filter(Boolean).join(", ")` or billing address
     - Postcode: `payload.shipping?.postcode || payload.billing?.postcode` (if 5-digit Algerian postal code like `"13000"`, extracts first 2 digits `"13"`)
   - **Fallback Source (`meta_data` array):**
     When primary fields are missing, empty, or generic, inspect the top-level `meta_data` array:
     - Phone: keys matching `/(?:phone|téléphone|telephone|tel|هاتف|تلفون)/i` (e.g., `_billing_phone`)
     - Wilaya: keys matching `/(?:wilaya|province|state|ولاية)/i` (e.g., `_billing_wilaya`, `wilaya`)
     - Commune: keys matching `/(?:commune|city|بلدية|baladiya)/i` (e.g., `commune`, `baladiya`)
     - Address: keys matching `/(?:address|adresse|عنوان)/i` (e.g., `_billing_address_1`, `adresse`)
     - Name: keys matching `/(?:^nom$|^name$|^full[_\s]?name$|اسم)/i`

3. **Normalization via `@akadli/dz-geo` & `@akadli/core`:**
   - Phone is normalized to 10-digit local format (`05/06/07XXXXXXXX`) or E.164 (`+213...`).
   - Wilaya is resolved across all 69 Algerian Wilayas (2026 administrative division) via `normalizeWilaya(...)`.
   - Commune is resolved against valid communes for the resolved Wilaya via `normalizeCommune(..., wilayaCode)`.
   - Populates constraints (`allowedWilayas`, `allowedCommunes`, `allowedSizes`) and builds a canonical `StandardizedDzOrder`.

---

## 3. Order Decision Mutation (`applyOrderDecision`)

Once the customer concludes the voice confirmation call, the order decision is pushed to the WooCommerce REST API (v3).

### Required Credentials
```typescript
export interface WooCommerceCredentials {
  siteUrl: string;          // WordPress/WooCommerce site URL (e.g. "https://dz-store.com")
  consumerKey: string;      // WooCommerce REST API Consumer Key (ck_...)
  consumerSecret: string;   // WooCommerce REST API Consumer Secret (cs_...)
  cancelOnRefused?: string; // Default: "true" ("false" to skip status: "cancelled")
}
```

### Outbound REST Endpoints

All requests use HTTP Basic Authentication:
- `Authorization: Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
- `Content-Type: application/json`

Base endpoint: `{siteUrl}/wp-json/wc/v3`

#### 1. `CONFIRMED`
- `PUT /wp-json/wc/v3/orders/{orderId}`:
  ```json
  {
    "meta_data": [
      { "key": "_akadli_status", "value": "akadli-confirmed" }
    ]
  }
  ```
- `POST /wp-json/wc/v3/orders/{orderId}/notes`:
  ```json
  {
    "note": "[Akadli-AI] Order CONFIRMED by customer (akadli-confirmed).",
    "customer_note": false
  }
  ```

#### 2. `MODIFIED`
- `PUT /wp-json/wc/v3/orders/{orderId}`:
  ```json
  {
    "shipping": {
      "state": "13",
      "city": "Maghnia",
      "address_1": "Nouvelle adresse près du stade"
    },
    "billing": {
      "state": "13",
      "city": "Maghnia",
      "address_1": "Nouvelle adresse près du stade"
    },
    "meta_data": [
      { "key": "_akadli_status", "value": "akadli-modified" },
      { "key": "_akadli_size", "value": "XL" }
    ]
  }
  ```
- `POST /wp-json/wc/v3/orders/{orderId}/notes`:
  ```json
  {
    "note": "[Akadli-AI] Order MODIFIED: Size -> XL; Wilaya -> 13; Commune -> Maghnia",
    "customer_note": false
  }
  ```

#### 3. `REFUSED`
- `PUT /wp-json/wc/v3/orders/{orderId}`:
  ```json
  {
    "status": "cancelled",
    "meta_data": [
      { "key": "_akadli_status", "value": "akadli-refused" }
    ]
  }
  ```
- `POST /wp-json/wc/v3/orders/{orderId}/notes`:
  ```json
  {
    "note": "[Akadli-AI] Order REFUSED: Customer ordered by mistake and asked to cancel.",
    "customer_note": false
  }
  ```
