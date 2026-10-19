# Shopify COD Order Confirmation Adapter Specification (`@akadli/provider-shopify`)

This document defines the technical specification, webhook signature verification, Algerian COD data extraction, and outbound mutation endpoints for Shopify stores integrating with the **Akadli-AI** voice confirmation engine.

---

## Live Shopify Store Setup Guide (2026 Dev Dashboard)

This section covers the verified live setup steps for integrating Shopify stores with Akadli-AI:

### 1. Create App in `dev.shopify.com`
- Navigate to [dev.shopify.com](https://dev.shopify.com) and create or open your app.
- Set **App URL** to `https://example.com` (leave **Embed app in Shopify admin** **UNCHECKED**).
- Under **API access** -> **Scopes**, select `read_orders,write_orders`.

### 2. Enable Protected Customer Data Access (CRITICAL)
- In `dev.shopify.com` -> **API access** -> **Protected customer data access**, enable **Protected customer data**.
- Check **Name**, **Address**, and **Phone**.
- *Rationale*: Shopify redacts customer details from webhooks and blocks `shipping_address` mutations if these fields are not explicitly approved.

### 3. Authentication (`clientId` + `clientSecret` or `accessToken`)
- **OAuth Exchange**: Provide `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. `@akadli/provider-shopify` automatically requests an access token from `POST /admin/oauth/access_token` with `grant_type: client_credentials` and caches it in memory until expiry.
- **Direct Access Token**: Alternatively, configure `SHOPIFY_ACCESS_TOKEN` (`shpat_...`) directly.

### 4. Algerian Address Mapping (Missing `Province` Field)
- Shopify checkout hides the `Province` field when Country is set to `Algeria`.
- Customers typically provide their Wilaya in `city`, `address1`, or enter a 5-digit Algerian ONP postal code in `zip` (`13000` -> Wilaya `13`).
- Many Algerian merchants use COD form apps (EasySell, Releasit) which store address fields in `note_attributes`.
- `@akadli/provider-shopify` dynamically resolves Wilaya and Commune using multi-candidate resolution across `note_attributes`, `province`/`province_code`, `city`, `zip`, and `address1`/`address2` via `@akadli/dz-geo`.

---

## 1. Webhook Signature Verification (`verifyWebhook`)

Shopify signs every webhook request using HMAC-SHA256 calculated over the unparsed raw request body with the merchant's webhook shared secret.

### Specifications
- **Header:** `X-Shopify-Hmac-Sha256` (case-insensitive extraction via `headers["x-shopify-hmac-sha256"]`).
- **Algorithm:** `sha256` HMAC encoded as **Base64**.
- **Timing Attack Prevention:** Comparison must be performed using `crypto.timingSafeEqual` over buffers of equal byte length.
- **Fail Safe:** If the header is missing, lengths mismatch, or the digest does not match, return `false` without throwing uncaught exceptions.

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyShopifyWebhook(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): boolean {
  const headerKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === "x-shopify-hmac-sha256"
  );
  const signature = headerKey ? headers[headerKey] : undefined;
  if (!signature || !secret) return false;

  const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const hmac = createHmac("sha256", secret).update(bodyBuffer).digest("base64");

  const sigBuffer = Buffer.from(signature, "utf8");
  const hmacBuffer = Buffer.from(hmac, "utf8");

  if (sigBuffer.length !== hmacBuffer.length) return false;
  return timingSafeEqual(sigBuffer, hmacBuffer);
}
```

---

## 2. Inbound COD Order Extraction (`parseWebhookOrder`)

Shopify `orders/create` payloads for Algerian cash-on-delivery merchants arrive in two primary forms:
1. **Standard Shopify Checkout:** Customer address and phone are located in `shipping_address` or `billing_address`.
2. **Algerian COD Form Apps (EasySell, Releasit, CodForm, FastForm):** Because checkout is bypassed, `shipping_address` is frequently blank, partial, or generic. The true customer phone, Wilaya, and Commune are stored in `note_attributes` key-value pairs.

### Extraction Pipeline
1. **Order ID & Basics:**
   - `orderId`: `String(payload.id)`
   - `storeName`: `payload.shop_name || payload.store_name || "Shopify Store"`
   - `itemName`: First line item title (`payload.line_items?.[0]?.title || "Article"`)
   - `currentSize`: First line item variant title (`payload.line_items?.[0]?.variant_title || "Standard"`)
   - `priceDa`: `Math.round(Number(payload.total_price || 0))`

2. **Dual-Source Address & Phone Fallback:**
   Scan `shipping_address`, `billing_address`, and `note_attributes` (case-insensitive substring match):
   - **Phone:** `shipping_address.phone` $\rightarrow$ `billing_address.phone` $\rightarrow$ `customer.phone` $\rightarrow$ `note_attributes` matching `phone`, `téléphone`, `telephone`, `tel`, or `هاتف`.
   - **Wilaya:** `shipping_address.province` $\rightarrow$ `shipping_address.province_code` $\rightarrow$ `note_attributes` matching `wilaya`, `province`, or `ولاية`.
   - **Commune:** `shipping_address.city` $\rightarrow$ `note_attributes` matching `commune`, `city`, or `بلدية`.
   - **Customer Name:** `shipping_address.name` $\rightarrow$ `${customer.first_name} ${customer.last_name}` $\rightarrow$ `note_attributes` matching `nom`, `name`, or `اسم` $\rightarrow$ `"Client"`.
   - **Address Note:** `shipping_address.address1` $\rightarrow$ `note_attributes` matching `adresse`, `address`, or `عنوان`.

3. **Normalization via `@akadli/dz-geo` & `@akadli/core`:**
   - Phone is normalized to 10-digit local format (`05/06/07XXXXXXXX`) via `normalizeDzPhone(..., "local")`.
   - Wilaya is matched against all 69 official 2026 Wilayas via `normalizeWilaya(...)`.
   - Commune is resolved and verified for that Wilaya via `normalizeCommune(..., wilayaCode)`.
   - Constraints (`allowedWilayas`, `allowedCommunes`, `allowedSizes`) are populated and validated using `createStandardizedDzOrder(...)`.

---

## 3. Order Decision Mutation (`applyOrderDecision`)

Once the customer completes the ElevenAgents voice confirmation call, the decision is mutated in Shopify Admin API.

### Required Credentials
```typescript
export interface ShopifyProviderCredentials {
  shopDomain: string;       // e.g. "store.myshopify.com"
  accessToken: string;      // Shopify Admin Access Token ("shpat_...")
  apiVersion?: string;      // defaults to "2024-04"
  cancelOnRefused?: string; // "true" (default) or "false"
}
```

### Mutation Endpoints

#### 1. `CONFIRMED`
- **Method:** `PUT https://{shopDomain}/admin/api/{apiVersion}/orders/{orderId}.json`
- **Headers:** `X-Shopify-Access-Token: {accessToken}`, `Content-Type: application/json`
- **Payload:**
```json
{
  "order": {
    "id": 1029384756,
    "tags": "akadli-confirmed",
    "note": "[Akadli-AI] Order CONFIRMED by customer."
  }
}
```

#### 2. `MODIFIED`
- **Method:** `PUT https://{shopDomain}/admin/api/{apiVersion}/orders/{orderId}.json`
- **Headers:** `X-Shopify-Access-Token: {accessToken}`, `Content-Type: application/json`
- **Payload:**
```json
{
  "order": {
    "id": 1029384756,
    "tags": "akadli-modified, akadli-size-43",
    "note": "[Akadli-AI] Order MODIFIED: Size -> 43; Commune -> Maghnia; Note -> Près de la mosquée.",
    "shipping_address": {
      "province": "13",
      "city": "Maghnia",
      "address1": "Près de la mosquée"
    }
  }
}
```

#### 3. `REFUSED`
- **Step A:** `PUT https://{shopDomain}/admin/api/{apiVersion}/orders/{orderId}.json` with tag `"akadli-refused"` and refusal note.
- **Step B (if `cancelOnRefused !== "false"`):** `POST https://{shopDomain}/admin/api/{apiVersion}/orders/{orderId}/cancel.json`
- **Headers:** `X-Shopify-Access-Token: {accessToken}`, `Content-Type: application/json`
- **Cancel Payload:**
```json
{
  "reason": "customer",
  "email": false,
  "restock": true
}
```

---

## 4. Error Handling & Resilience
- **401 Unauthorized:** Return `{ success: false, externalStatus: "UNAUTHORIZED", rawResponse: ... }`.
- **404 Not Found:** Return `{ success: false, externalStatus: "NOT_FOUND", rawResponse: ... }`.
- **429 Too Many Requests:** Check `Retry-After` header and handle rate limiting gracefully.
- **5xx Server Errors:** Return descriptive error message with HTTP status code.
