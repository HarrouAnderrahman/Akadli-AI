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

YouCan `order.created` payloads for Algerian COD merchants typically arrive in one of two modes:
1. **Standard YouCan Checkout:** Customer address and phone are located in `customer` and `shipping.address` (`region` or `state` for Wilaya, `city` for Commune, `first_line` for street/address note).
2. **Algerian 1-Page COD Checkout Form:** Because merchants in Algeria frequently streamline checkout into a single fast form, `shipping.address` can be minimal or empty, and customer phone, Wilaya, and Commune are submitted via `extra_fields` or `custom_fields`.

### Extraction Pipeline

1. **Order Basics:**
   - `orderId`: `String(payload.id)`
   - `storeName`: `payload.store_name || "YouCan Store"`
   - `itemName`: First variant item name (`payload.variants?.[0]?.item?.name || payload.line_items?.[0]?.title || "Article"`)
   - `currentSize`: Variant variation size or title (`payload.variants?.[0]?.variation?.size || payload.variants?.[0]?.title || "Standard"`)
   - `priceDa`: `Math.round(Number(payload.total || 0))`

2. **Dual-Source Address & Phone Extraction (CRITICAL for Algerian YouCan COD Forms):**
   - **Primary Source:**
     - Customer name: `${payload.customer?.first_name || ""} ${payload.customer?.last_name || ""}`.trim() || `payload.shipping?.address?.first_name`
     - Phone: `payload.customer?.phone || payload.shipping?.address?.phone`
     - Wilaya: `payload.shipping?.address?.region || payload.shipping?.address?.state`
     - Commune: `payload.shipping?.address?.city`
     - Address Note: `payload.shipping?.address?.first_line || payload.shipping?.address?.second_line`
   - **Fallback Source (`extra_fields` / `custom_fields`):**
     When primary fields are missing or empty, inspect `extra_fields` or `custom_fields` (which may be provided as an array of key-value pairs or as an object map):
     - Keys matching `/(?:phone|téléphone|telephone|tel|هاتف|تلفون)/i`: overrides phone.
     - Keys matching `/(?:wilaya|province|ولاية)/i`: overrides Wilaya.
     - Keys matching `/(?:commune|city|بلدية)/i`: overrides Commune.
     - Keys matching `/(?:address|adresse|عنوان)/i`: overrides Address Note.
     - Keys matching `/(?:^nom$|^name$|^full[_\s]?name$|اسم)/i`: overrides Customer Name.

3. **Normalization via `@akadli/dz-geo` & `@akadli/core`:**
   - Phone is normalized to 10-digit local format (`05/06/07XXXXXXXX`) via `normalizeDzPhone(..., "local")`.
   - Wilaya is resolved against all 69 official 2026 Wilayas via `normalizeWilaya(...)`.
   - Commune is resolved and checked against the valid communes for the resolved Wilaya via `normalizeCommune(..., wilayaCode)`.
   - Populates `constraints` (`allowedWilayas`, `allowedCommunes`, `allowedSizes`) and builds a canonical `StandardizedDzOrder`.

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
  "tags": ["akadli-modified", "akadli-size-XL"],
  "notes": "[Akadli-AI] Order MODIFIED: Size -> XL; Wilaya -> 13; Commune -> Mansourah; Note -> Near Pharmacie Centrale; Details: Customer requested XL"
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
  - Closes the refused order in YouCan.
- **Returns:** `{ success: true, externalStatus: "CANCELLED", rawResponse: ... }`

---

## 4. HTTP Error Handling

- **401 Unauthorized / 403 Forbidden**: Invalid or expired `accessToken`. Fails immediately without retries.
- **404 Not Found**: Order does not exist on YouCan.
- **422 Unprocessable Entity**: Invalid order field or state transition.
- **429 Too Many Requests / 5xx Server Error**: Retried up to 3 times with exponential backoff before failing.
