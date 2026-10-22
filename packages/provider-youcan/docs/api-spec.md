# YouCan COD Order Confirmation Adapter Specification (`@akadli/provider-youcan`)

This document defines the technical specification, webhook signature verification, Algerian COD data extraction, and outbound mutation endpoints for YouCan (`.shop`) stores integrating with the **Akadli-AI** voice confirmation engine.

---

## 1. Webhook Signature Verification (`verifyWebhook`)

YouCan signs webhook payloads using HMAC-SHA256 computed over the untouched raw request body with the merchant's webhook secret key.

### Specifications
- **Header:** `x-youcan-signature` (case-insensitive extraction via case-insensitive header lookup).
- **Algorithm:** `sha256` HMAC encoded as a lowercase **hex** string.
- **Timing Attack Prevention:** Comparison must be performed using `crypto.timingSafeEqual` between buffers of equal byte length.
- **Fail Safe:** If the header is missing, lengths mismatch, or signature is invalid, return `false` without throwing unhandled exceptions.

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyYouCanWebhook(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): boolean {
  const headerKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === "x-youcan-signature"
  );
  const signature = headerKey ? headers[headerKey] : undefined;
  if (!signature || !secret) return false;

  const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const hmacHex = createHmac("sha256", secret).update(bodyBuffer).digest("hex");

  const sigBuffer = Buffer.from(signature, "utf8");
  const hmacBuffer = Buffer.from(hmacHex, "utf8");

  if (sigBuffer.length !== hmacBuffer.length) return false;
  return timingSafeEqual(sigBuffer, hmacBuffer);
}
```

---

## 2. Inbound COD Order Extraction (`parseWebhookOrder`)

YouCan webhook deliveries can arrive in several envelope formats:

1. **Official YouCan Resthook Standard Payload Format:**
   ```json
   {
     "event_name": "order.created",
     "event_happened_at": "2026-10-16T14:20:00.000000Z",
     "data": {
       "id": "ord_yc_882910",
       "total": 6400,
       ...
     }
   }
   ```
2. **App Webhook / Resthook Delivery Envelope:**
   ```json
   {
     "id": "8e6b019b-06de-496d-a96d-c9ee69c0ccf0",
     "event": "order.created",
     "store_id": "store_yc_111",
     "payload": {
       "id": "ord_yc_882910",
       ...
     }
   }
   ```
3. **Nested Resource Envelope:** `{ data: { order: { ... } } }`, `{ payload: { order: { ... } } }`, or `{ order: { ... } }`.
4. **Direct Order Object:** `{ id: "ord_yc_882910", total: ..., customer: { ... }, shipping: { ... } }`.

### Extraction Pipeline

1. **Envelope Unwrapping & ID Resolution (`unwrapYouCanPayload`):**
   - Automatically unwrap `data.order`, `data`, `payload.order`, `payload`, or `order`.
   - In Resthook delivery envelopes, the root `id` is the webhook delivery UUID. The actual order identifier is resolved from `orderData.id`, `orderData.order_id`, or `orderData.ref`.
   - Preserves top-level metadata (`store_name`, `extra_fields`, `custom_fields`, `customer`, `notes`).
   - Normalizes flattened `shipping` objects into canonical `{ address: { ... } }`.

2. **Order Basics & Line Item Extraction:**
   - `orderId`: `String(data.id)`
   - `storeName`: `data.store_name || data.shop_name || "YouCan Store"`
   - `priceDa`: `Math.round(Number(data.total || 0))`
   - **Product Name (`itemName`) Resolution (in priority order):**
     1. `variants[0]?.variant?.product?.name`
     2. `variants[0]?.variant?.product?.meta?.title`
     3. `variants[0]?.item?.name`
     4. `variants[0]?.name` / `variants[0]?.title`
     5. `line_items[0]?.title` / `line_items[0]?.name`
     6. Fallback: `"Article"`
   - **Selected Variant (`currentVariant`) Resolution (in priority order):**
     1. Case-insensitive lookup in `variants[0]?.variant?.variations` (for keys matching `variant`, `size`, `taille`, `pointure`, `مقاس`, or first non-default string value)
     2. `variants[0]?.variant?.values?.[0]` (if not `"default"`)
     3. `variants[0]?.variation` (case-insensitive key lookup)
     4. `variants[0]?.title` / `variants[0]?.variant?.title` / `line_items[0]?.variant_title`
     5. Fallback: `"Standard"`
   - **Allowed Variants (`allowedVariants`) Extraction:**
     - Inspect `variants[0]?.variant?.product?.variant_options`
     - Extract values from the option matching `/^(?:size|taille|pointure|مقاس|variant)$/i` (or first option with non-empty string values array, e.g. `["M", "L", "XL"]`)
     - Ensure `currentVariant` is always included in `allowedVariants`
     - Populates `constraints.allowedVariants` in `createStandardizedDzOrder`

3. **Resilient Multi-Candidate Algerian Address & Phone Extraction:**
   - **Phone Extraction:**
     - Primary: `shipping.address.phone` or `shipping.phone` or `customer.phone`
     - Fallback: `extra_fields` / `custom_fields` or customer notes matching `/(?:phone|téléphone|telephone|tel|mobile|هاتف|تلفون|موبايل|جوال)/i`
   - **Multi-Candidate Wilaya Resolution:**
     - Try in order: `extra_fields`/`custom_fields` -> `customer_notes` -> `shipping.address.region` -> `shipping.address.state` -> `shipping.address.city` -> `zip` (5-digit prefix or 2-digit code) -> `first_line`/`address1` -> `second_line`/`address2`.
     - Validates against all 69 official 2026 Wilayas via `normalizeWilaya(...)`.
   - **Smart Commune Resolution:**
     - Once Wilaya is resolved, checks `extra_fields`, `customer_notes`, `city`, `first_line`, and `second_line` against `normalizeCommune(..., wilayaCode)`.
     - Prioritizes specific non-capital communes over the Wilaya capital when found in street lines.

4. **Normalization via `@akadli/dz-geo` & `@akadli/core`:**
   - Phone is normalized to 10-digit local format (`05/06/07XXXXXXXX`) via `normalizeDzPhone(..., "local")`.
   - Populates `constraints` (`allowedWilayas`, `allowedCommunes`, `allowedVariants`) and builds a canonical `StandardizedDzOrder`.

---

## 3. Order Decision Mutation (`applyOrderDecision`)

Once the customer concludes the voice confirmation call, the decision is updated in the YouCan REST API.

### Required Credentials
```typescript
export interface YouCanCredentials {
  accessToken: string;       // YouCan API Access Token (Bearer auth)
  baseUrl?: string;          // Default: "https://api.youcan.shop"
  closeOnRefused?: string;   // Default: "true" ("false" to skip /orders/{id}/close)
}
```

### Outbound REST Endpoints

All requests include headers:
- `Authorization: Bearer {accessToken}`
- `Content-Type: application/json`
- `Accept: application/json`

#### 1. `CONFIRMED`
- **Method:** `PUT {baseUrl}/orders/{orderId}`
- **Payload:**
```json
{
  "tags": ["akadli-confirmed"],
  "notes": "[Akadli-AI] Order CONFIRMED by customer."
}
```
- **Returns:** `{ success: true, externalStatus: "CONFIRMED", rawResponse: ... }`

#### 2. `MODIFIED`
- **Method:** `PUT {baseUrl}/orders/{orderId}`
- **Payload:**
```json
{
  "shipping": {
    "address": {
      "region": "13",
      "city": "Mansourah",
      "first_line": "Near Pharmacie Centrale"
    }
  },
  "tags": ["akadli-modified", "akadli-variant-XL"],
  "notes": "[Akadli-AI] Order MODIFIED: Variant -> XL; Wilaya -> 13; Commune -> Mansourah; Note -> Near Pharmacie Centrale; Details: Customer requested XL"
}
```
- **Returns:** `{ success: true, externalStatus: "UPDATED_AND_CONFIRMED", rawResponse: ... }`

#### 3. `REFUSED`
- **Step A:** `PUT {baseUrl}/orders/{orderId}`
```json
{
  "tags": ["akadli-refused"],
  "notes": "[Akadli-AI] Order REFUSED: Customer cancelled on call."
}
```
- **Step B:** If `credentials.closeOnRefused !== "false"`, call:
  - **Method:** `PUT {baseUrl}/orders/{orderId}/close`
  - **Payload:** `{"cancel_order": true}`
  - Closes the refused order and returns items back to stock.
- **Returns:** `{ success: true, externalStatus: "CANCELLED", rawResponse: ... }`

#### 4. Additional Status Updates (`YouCanClient.updateOrderStatus`)
- **Method:** `PUT {baseUrl}/orders/{orderId}/status`
- **Payload:** `{"status": "processed"}` (or `"open"`, `"closed"`, `"canceled-by-seller"`)

---

## 4. HTTP Error Handling

- **401 Unauthorized / 403 Forbidden**: Invalid or expired `accessToken`. Fails immediately without retries.
- **404 Not Found**: Order does not exist on YouCan.
- **422 Unprocessable Entity**: Invalid order field or state transition.
- **429 Too Many Requests / 5xx Server Error**: Retried up to 3 times with exponential backoff before failing.
