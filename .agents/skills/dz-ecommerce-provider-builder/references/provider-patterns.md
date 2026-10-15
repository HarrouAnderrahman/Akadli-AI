# E-Commerce Provider Integration Patterns (`references/provider-patterns.md`)

This reference defines the three canonical architectural patterns for Algerian e-commerce platforms in `Akadli-AI`. Always select the pattern that matches the platform's real capabilities rather than inventing unsupported REST endpoints.

---

## Pattern Classification Matrix

| Platform | Pattern | Inbound Trigger | Signature Verification | Outbound `applyOrderDecision` Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Shopify** | Pattern A | `orders/create` webhook | `x-shopify-hmac-sha256` (Base64 HMAC-SHA256) | REST/GraphQL Order update (`tags`, `note`, `shipping_address`) + `/cancel.json` |
| **YouCan** | Pattern A | `order.created` webhook | `x-youcan-signature` (Hex HMAC-SHA256) | REST `PUT /orders/{id}` (`status`, `shipping_address`, `notes`) |
| **WooCommerce** | Pattern A | `order.created` webhook | `x-wc-webhook-signature` (Base64 HMAC-SHA256) | REST `PUT /wp-json/wc/v3/orders/{id}` (`status`, `shipping`, `line_items`, `customer_note`) |
| **Tassyir** | Pattern B | Webhook / Order Polling Sync | `x-tassyir-signature` (Hex HMAC-SHA256) or Bearer Token | COD ERP Status Mutation + Two-Phase Courier Dispatch (Yalidine / Ecotrack / ZR Express) |
| **Ayor** | Pattern B | Webhook / Order Sync | `x-ayor-signature` (Hex HMAC-SHA256) or API Key | COD ERP Order Confirmation / Refusal endpoint + Courier Waybill Trigger |
| **SetShop** | Pattern C | Outbound Webhook / Sheet Sync | `x-setshop-token` or Shared Webhook Secret | Outbound Webhook Bridge / Google Sheets Row Update / Courier Draft Creation |
| **JustSell** | Pattern C | Outbound Webhook / Sheet Sync | `x-justsell-token` or Shared Webhook Secret | Outbound Webhook Bridge / Google Sheets Row Update / Courier Draft Creation |
| **Google Sheets** | Pattern C | Apps Script `onChange` / Row Webhook | `x-dzvoice-sheet-signature` (Hex HMAC-SHA256) | Google Sheets API v4 `spreadsheets.values.update` (Status, Final Size, Final Wilaya, Final Commune, Notes) |

---

## Pattern A: Full Two-Way REST API (Shopify, YouCan, WooCommerce)

Use Pattern A when the platform provides both outbound order webhooks and authenticated REST/GraphQL endpoints to mutate orders in place.

### 1. Inbound Flow (`verifyWebhook` + `parseWebhookOrder`)
- Verify the platform's HMAC signature against the raw request body.
- Extract `orderId`, `customerName`, `customerPhone` (from `shipping_address.phone` or `billing_address.phone`), `itemName` (first line item title), `priceDa` (total price in DZD), `currentSize` (variant title/option), `currentWilaya` (`shipping_address.province` or `state`), and `currentCommune` (`shipping_address.city`).
- Normalize `customerPhone` and `currentWilaya` using `@akadli/dz-geo`.

### 2. Outbound Flow (`applyOrderDecision`)

```typescript
// Pattern A Blueprint: Two-Way REST Mutation
export async function applyPatternADecision(
  orderId: string,
  decision: FinalizedOrderDecision,
  credentials: { baseUrl: string; accessToken: string },
  httpClient: typeof fetch = fetch
): Promise<ApplyOrderDecisionResult> {
  if (decision.status === "REFUSED") {
    const res = await httpClient(`${credentials.baseUrl}/orders/${orderId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.accessToken}`
      },
      body: JSON.stringify({
        reason: "customer",
        note: `Refused via ElevenAgents voice call: ${decision.reasonOrNotes}`
      })
    });
    if (!res.ok) {
      return { success: false, externalStatus: `HTTP_${res.status}`, rawResponse: await res.text() };
    }
    return { success: true, externalStatus: "CANCELLED", rawResponse: await res.json() };
  }

  // CONFIRMED or MODIFIED
  const updatePayload: Record<string, unknown> = {
    status: decision.status === "MODIFIED" ? "confirmed_modified" : "confirmed",
    tags: decision.status === "MODIFIED" ? ["akadli-confirmed", "akadli-modified"] : ["akadli-confirmed"],
    note: decision.reasonOrNotes
  };

  if (decision.status === "MODIFIED") {
    updatePayload.shipping_address = {
      ...(decision.finalWilaya ? { province_code: decision.finalWilaya } : {}),
      ...(decision.finalCommune ? { city: decision.finalCommune } : {}),
      ...(decision.finalAddressNote ? { address2: decision.finalAddressNote } : {})
    };
    if (decision.finalSize) {
      updatePayload.custom_attributes = [{ key: "confirmed_size", value: decision.finalSize }];
    }
  }

  const res = await httpClient(`${credentials.baseUrl}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.accessToken}`
    },
    body: JSON.stringify(updatePayload)
  });

  if (!res.ok) {
    return { success: false, externalStatus: `HTTP_${res.status}`, rawResponse: await res.text() };
  }
  return {
    success: true,
    externalStatus: decision.status === "MODIFIED" ? "UPDATED_AND_CONFIRMED" : "CONFIRMED",
    rawResponse: await res.json()
  };
}
```

---

## Pattern B: Algerian COD ERP / Two-Phase Courier Dispatch (Tassyir, Ayor)

Algerian COD ERPs (Tassyir, Ayor) center around call-center confirmation queues and direct courier dispatch (Yalidine, Ecotrack, ZR Express, Maystro).

### 1. Inbound Flow
- Ingest the new order webhook payload from Tassyir/Ayor.
- Map the ERP's `wilaya_id` or `wilaya_name` and `commune_name` through `@akadli/dz-geo` to ensure canonical `"01"`-`"69"` codes and valid commune constraints.

### 2. Outbound Flow (Two-Phase Confirmation + Courier Dispatch)
- **Phase 1 (ERP Order State Update)**: Send the confirmation status (`confirmed`, `confirmed_modified`, or `canceled`) plus updated `wilaya_code`, `commune`, `size`, and `note` to the ERP webhook/API endpoint.
- **Phase 2 (Optional Courier Draft / Dispatch)**: When `credentials.courierDispatchMode === "auto_draft"` and `decision.status !== "REFUSED"`, create a pre-validated parcel draft in the merchant's courier account (e.g., Yalidine `/v1/parcels` or Ecotrack `/api/v1/create/order`) using the voice-verified `finalWilaya` and `finalCommune`.

```typescript
// Pattern B Blueprint: Algerian COD ERP + Optional Courier Draft
export interface ErpMutationPayload {
  order_id: string;
  confirmation_status: "CONFIRMED" | "MODIFIED" | "REFUSED";
  wilaya_code?: string;
  commune?: string;
  variant_size?: string;
  delivery_note?: string;
  agent_notes: string;
  trigger_courier_dispatch: boolean;
}
```

---

## Pattern C: Universal Sheet / Outbound Webhook Bridge (SetShop, JustSell, Google Sheets)

Many entry-level Algerian store builders (SetShop, JustSell, DZBuild, Foorweb) emit an outbound webhook when an order is placed or append a row to Google Sheets, but **do not expose a public inbound REST API** to mutate orders directly.

### Anti-Hallucination Rule for Pattern C
- **NEVER** fabricate endpoints like `https://api.setshop.dz/v1/orders/{id}` or `https://api.justsell.dz/v1/orders/{id}` unless explicitly verified in `docs/api-spec.md`.
- Instead, implement the **Pattern C Fallback Bridge** in `applyOrderDecision`:
  1. **Outbound Decision Webhook (`credentials.decisionWebhookUrl`)**: POST the validated `FinalizedOrderDecision` + `providerName` signed with `credentials.webhookSecret` to the merchant's automation webhook (Make, n8n, Zapier, or custom bridge).
  2. **Google Sheets Bridge (`credentials.spreadsheetId` + `credentials.sheetAccessToken`)**: Update the matching order row's confirmation columns (`Status`, `Final Size`, `Final Wilaya`, `Final Commune`, `Delivery Note`, `Call Reason`).
  3. **Courier Draft Bridge (`credentials.yalidineApiId` / `credentials.ecotrackToken`)**: For `CONFIRMED` and `MODIFIED` orders, optionally push a verified parcel draft directly to Yalidine/Ecotrack so the merchant can print the waybill immediately.

```typescript
// Pattern C Blueprint: Outbound Webhook / Sheet / Courier Fallback Bridge
export async function applyPatternCDecision(
  providerName: string,
  orderId: string,
  decision: FinalizedOrderDecision,
  credentials: Record<string, string>,
  httpClient: typeof fetch = fetch
): Promise<ApplyOrderDecisionResult> {
  const targetUrl = credentials.decisionWebhookUrl;
  if (!targetUrl) {
    throw new Error(
      `[${providerName}] Missing credentials.decisionWebhookUrl for Pattern C fallback bridge.`
    );
  }

  const res = await httpClient(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-DzVoice-Provider": providerName,
      ...(credentials.webhookSecret ? { "X-DzVoice-Token": credentials.webhookSecret } : {})
    },
    body: JSON.stringify({
      provider: providerName,
      orderId,
      status: decision.status,
      finalSize: decision.finalSize ?? null,
      finalWilaya: decision.finalWilaya ?? null,
      finalCommune: decision.finalCommune ?? null,
      finalAddressNote: decision.finalAddressNote ?? null,
      reasonOrNotes: decision.reasonOrNotes,
      processedAt: new Date().toISOString()
    })
  });

  if (!res.ok) {
    return {
      success: false,
      externalStatus: `BRIDGE_HTTP_${res.status}`,
      rawResponse: await res.text()
    };
  }

  return {
    success: true,
    externalStatus: `BRIDGE_${decision.status}`,
    rawResponse: await res.json()
  };
}
```
