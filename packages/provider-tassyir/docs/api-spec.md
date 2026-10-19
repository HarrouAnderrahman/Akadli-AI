# Tassyir Algerian COD ERP & Courier Dispatch Adapter Specification (`@akadli/provider-tassyir`)

This document defines the technical specification, webhook signature verification, Algerian COD data extraction, and two-phase courier dispatch mutations for Tassyir ERP (`api.tassyir.dz`) integrating with the **Akadli-AI** voice confirmation engine.

---

## 1. Webhook Signature Verification (`verifyWebhook`)

Tassyir signs inbound webhook notifications using HMAC-SHA256 computed over the untouched raw request body with the merchant's configured webhook secret.

### Specifications
- **Header:** `x-tassyir-signature` or `x-akadli-signature` (case-insensitive extraction).
- **Algorithm:** `sha256` HMAC encoded as a lowercase **hex** string.
- **Timing Attack Prevention:** Comparison must be performed using `crypto.timingSafeEqual` between buffers of identical byte length.
- **Fail Safe:** If the signature header or secret is missing, byte lengths differ, or the signature is invalid, return `false` without throwing uncaught exceptions.

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyTassyirWebhook(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): boolean {
  const headerKey = Object.keys(headers).find((k) => {
    const lower = k.toLowerCase();
    return lower === "x-tassyir-signature" || lower === "x-akadli-signature";
  });
  const signature = headerKey ? headers[headerKey] : undefined;
  if (!signature || !secret) return false;

  const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
  const calculatedHex = createHmac("sha256", secret).update(bodyBuffer).digest("hex");

  const sigBuffer = Buffer.from(signature, "utf8");
  const calcBuffer = Buffer.from(calculatedHex, "utf8");

  if (sigBuffer.length !== calcBuffer.length) return false;
  return timingSafeEqual(sigBuffer, calcBuffer);
}
```

---

## 2. Inbound COD Order Extraction (`parseWebhookOrder`)

Tassyir emits `order.created` or `order.pending_confirmation` webhook events. Payloads follow Algerian COD ERP conventions where customer and delivery info can exist in nested `customer`/`shipping_address` objects or top-level flat fields (with stop-desk support).

### Extraction Pipeline

1. **Order Basics:**
   - `orderId`: `String(payload.id || payload.order_id || payload.tracking_id)`
   - `storeName`: `payload.store_name || "Tassyir Store"`
   - `itemName`: First item title (`payload.items?.[0]?.name || payload.product_name || "Article"`)
   - `currentSize`: Variant size (`payload.items?.[0]?.variant || payload.items?.[0]?.size || payload.size || "Standard"`)
   - `priceDa`: `Math.round(Number(payload.total_price ?? payload.total ?? payload.cod_amount ?? 0))`

2. **Customer & Delivery Extraction:**
   - **Customer Name:** `payload.customer?.full_name || payload.customer?.name || payload.client_name || payload.full_name || "Client"`
   - **Customer Phone:** `payload.customer?.phone || payload.client_phone || payload.phone || payload.shipping_address?.phone || ""`
   - **Wilaya:** Extracted from `payload.customer?.wilaya || payload.wilaya || payload.wilaya_code || payload.wilaya_id || payload.shipping_address?.wilaya || payload.shipping_address?.province || ""`. Normalized via `@akadli/dz-geo` supporting all 69 Wilayas of the 2026 administrative division (e.g. `25` -> `25 - Constantine`, `59` -> `59 - Aflou`).
   - **Commune:** Extracted from `payload.customer?.commune || payload.commune || payload.commune_name || payload.shipping_address?.commune || payload.shipping_address?.city || ""`.
   - **Address Note & Stop-Desk:** Extracted from `payload.customer?.address || payload.address || payload.shipping_address?.address || payload.delivery_note || (payload.stop_desk ? "Stop-Desk / Bureau" : undefined)`.

3. **Normalization:**
   - Normalized into `StandardizedDzOrder` via `@akadli/core` (`createStandardizedDzOrder`), populating `constraints.allowedWilayas`, `constraints.allowedCommunes`, and `constraints.allowedSizes`.

---

## 3. Two-Phase Order Decision & Courier Dispatch Mutation (`applyOrderDecision`)

Tassyir operates as an Algerian COD ERP integrated with local couriers (Yalidine, Ecotrack, ZR Express, Maystro).

### Credentials Schema
```typescript
interface TassyirCredentials {
  apiKey: string;
  baseUrl?: string; // Default: https://api.tassyir.dz/v1
  dispatchOnConfirm?: string; // "true" | "false", default: "true"
  cancelOnRefused?: string; // "true" | "false", default: "true"
}
```

### Authentication
Requests to Tassyir API include:
```http
Authorization: Bearer {apiKey}
X-Tassyir-Api-Key: {apiKey}
Content-Type: application/json
```

---

### Outbound Decisions

#### 1. `CONFIRMED`
- **Phase 1 (ERP State Update):**
  `PATCH {baseUrl}/orders/{orderId}`
  ```json
  {
    "confirmation_status": "confirmed",
    "tags": ["akadli-confirmed"],
    "notes": "[Akadli-AI] Order CONFIRMED by customer."
  }
  ```
- **Phase 2 (Courier Dispatch):**
  If `credentials.dispatchOnConfirm !== "false"`:
  `POST {baseUrl}/orders/{orderId}/dispatch`
  ```json
  {
    "ready_for_expedition": true,
    "trigger_source": "akadli-ai"
  }
  ```
  Returns `externalStatus: "CONFIRMED_AND_DISPATCHED"` (or `"CONFIRMED"` if dispatch is skipped).

#### 2. `MODIFIED`
- **Phase 1 (ERP State Update):**
  `PATCH {baseUrl}/orders/{orderId}`
  ```json
  {
    "confirmation_status": "confirmed",
    "shipping_address": {
      "wilaya": "25",
      "commune": "El Khroub",
      "address": "Cité nouvelle près de la mosquée"
    },
    "variant_size": "XL",
    "tags": ["akadli-modified", "akadli-size-XL"],
    "notes": "[Akadli-AI] Order MODIFIED: Size -> XL; Wilaya -> 25; Commune -> El Khroub; Note -> Cité nouvelle près de la mosquée"
  }
  ```
- **Phase 2 (Courier Dispatch with Corrected Destination):**
  If `credentials.dispatchOnConfirm !== "false"`:
  `POST {baseUrl}/orders/{orderId}/dispatch`
  ```json
  {
    "ready_for_expedition": true,
    "trigger_source": "akadli-ai",
    "shipping_address": {
      "wilaya": "25",
      "commune": "El Khroub",
      "address": "Cité nouvelle près de la mosquée"
    },
    "variant_size": "XL"
  }
  ```
  Returns `externalStatus: "UPDATED_AND_DISPATCHED"` (or `"UPDATED_AND_CONFIRMED"`).

#### 3. `REFUSED`
- `PATCH {baseUrl}/orders/{orderId}`
  ```json
  {
    "confirmation_status": "refused",
    "status": "cancelled",
    "tags": ["akadli-refused"],
    "notes": "[Akadli-AI] Order REFUSED: Customer refused delivery."
  }
  ```
  *(Never calls `/dispatch`)*. Returns `externalStatus: "REFUSED"`.
