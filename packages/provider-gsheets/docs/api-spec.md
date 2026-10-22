# Google Sheets Algerian COD Adapter Specification (`@akadli/provider-gsheets`)

This document defines the technical specification, webhook signature verification, Algerian COD sheet row extraction, and outbound mutation endpoints for Google Sheets integrating with the **Akadli-AI** voice confirmation engine.

---

## Background: Why Google Sheets Integration is Critical

In the Algerian e-commerce ecosystem, entry-level store builders (such as **SetShop**, **JustSell**, **DZBuild**, and **Foorweb**) as well as custom single-product COD landing pages do not expose full-featured two-way REST APIs for order management. Instead, they sync every incoming checkout submission into a **Google Sheet row** and trigger an outbound webhook via Google Apps Script (`UrlFetchApp`).

`@akadli/provider-gsheets` acts as the universal bridge for these platforms, enabling:
1. Ingesting new order rows with flexible multi-lingual column headers (Arabic, French, English).
2. Normalizing Algerian customer phone numbers and 2026 Wilayas/Communes.
3. Mutating the Google Sheet row directly upon voice call completion via either:
   - **Mode A**: Direct Google Sheets REST API v4 (`values:batchUpdate`).
   - **Mode B**: Google Apps Script Web App Webhook callback (`doPost`).

---

## 1. Webhook Signature Verification (`verifyWebhook`)

Google Apps Script webhooks emit payloads using `UrlFetchApp.fetch()`. Merchants can configure either a cryptographic HMAC-SHA256 signature header or a shared secret token header.

### Supported Headers
- **HMAC Signature:** `x-akadli-signature` or `x-gsheets-signature` (case-insensitive) containing the `hex` digest of HMAC-SHA256 over the unparsed raw body.
- **Shared Secret / Token:** `x-akadli-secret` (or `authorization: Bearer <secret>`).

### Verification Protocol
1. If `x-akadli-signature` or `x-gsheets-signature` is present:
   - Compute `crypto.createHmac("sha256", secret).update(bodyBuffer).digest("hex")`.
   - Compare with the signature using `crypto.timingSafeEqual` after verifying byte lengths match.
2. If `x-akadli-secret` is present:
   - Compare header value with configured `secret` using `crypto.timingSafeEqual` over UTF-8 buffers of equal length.
3. If neither header matches or signatures differ, return `false` gracefully without throwing unhandled exceptions.

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGSheetsWebhook(
  headers: Record<string, string>,
  rawBody: string | Buffer,
  secret: string
): boolean {
  if (!secret) return false;

  // Case-insensitive header lookup
  const getHeader = (name: string): string | undefined => {
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
  };

  const sigHeader = getHeader("x-akadli-signature") || getHeader("x-gsheets-signature");
  if (sigHeader) {
    const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
    const computedHex = createHmac("sha256", secret).update(bodyBuffer).digest("hex");
    const sigBuf = Buffer.from(sigHeader.trim(), "utf8");
    const compBuf = Buffer.from(computedHex, "utf8");
    if (sigBuf.length === compBuf.length && timingSafeEqual(sigBuf, compBuf)) {
      return true;
    }
  }

  const secretHeader = getHeader("x-akadli-secret");
  if (secretHeader) {
    const headerBuf = Buffer.from(secretHeader.trim(), "utf8");
    const secBuf = Buffer.from(secret.trim(), "utf8");
    if (headerBuf.length === secBuf.length && timingSafeEqual(headerBuf, secBuf)) {
      return true;
    }
  }

  return false;
}
```

---

## 2. Inbound COD Row Extraction (`parseWebhookOrder`)

Google Sheet rows arrive as JSON payloads containing row numbers and flexible column key mappings across English, French, and Arabic.

### Row Identification & Tracking
- Payload supplies either `rowNumber` (number or string like `42`) or `orderId` (e.g., `"ROW-42"` or `"SS-1042"`).
- `@akadli/provider-gsheets` preserves the `rowNumber` in the canonical `orderId` (e.g. `ROW-42` or `SS-1042#ROW-42`), ensuring that `applyOrderDecision` can target the exact row on Google Sheets.

### Column Key Mapping
Column keys are evaluated case-insensitively, supporting trimmed Arabic, French, and English variations:

| Field | Accepted Candidate Keys | Default Fallback |
| :--- | :--- | :--- |
| **Customer Name** | `full_name`, `nom`, `client`, `الاسم`, `اسم_العميل`, `name`, `customer` | `"Client"` |
| **Phone** | `phone`, `telephone`, `tel`, `الهاتف`, `رقم_الهاتف`, `mobile` | Must normalize via `@akadli/dz-geo` |
| **Wilaya** | `wilaya`, `province`, `state`, `الولاية`, `region` | Must normalize to 2-digit code (`"01"`-`"69"`) |
| **Commune** | `commune`, `baladiya`, `city`, `البلدية`, `ville` | Must match or fallback to Wilaya capital |
| **Address Note**| `address`, `adresse`, `note`, `العنوان`, `address_note` | `""` |
| **Product** | `product`, `item_name`, `produit`, `المنتج`, `اسم_المنتج`, `article` | `"Article"` |
| **Size / Variant** | `size`, `taille`, `variant`, `المقاس`, `الحجم` | `"Standard"` |
| **Price (DZD)** | `price`, `total`, `prix`, `السعر`, `montant` | `0` |

### Normalization Pipeline
1. Ingest flat or nested row payload (`payload.data` / `payload.row` / top-level keys).
2. Phone normalized to 10-digit Algerian format (`05/06/07XXXXXXXX`) via `normalizeDzPhone(..., "local")`.
3. Wilaya normalized to official 2-digit code (`"01"`-`"69"`) via `normalizeWilaya(...)`.
4. Commune normalized within the resolved Wilaya via `normalizeCommune(...)`.
5. Canonical order created via `createStandardizedDzOrder(...)` from `@akadli/core`.

---

## 3. Order Decision Mutation (`applyOrderDecision`)

Post-call decisions (`CONFIRMED`, `MODIFIED`, `REFUSED`) are mutated back into Google Sheets. Two execution modes are supported:

### Mode A: Direct Google Sheets REST API v4 (Google Cloud Service Account / OAuth)

Used when `credentials.spreadsheetId` and `credentials.accessToken` are provided.

#### Credentials Schema
```typescript
export interface GSheetsApiCredentials {
  spreadsheetId: string;
  accessToken: string;
  sheetName?: string;      // default: "Sheet1"
  statusColumn?: string;   // default: "G"
  sizeColumn?: string;     // default: "H"
  wilayaColumn?: string;   // default: "I"
  communeColumn?: string;  // default: "J"
  addressColumn?: string;  // default: "K"
  notesColumn?: string;    // default: "L"
  baseUrl?: string;        // default: "https://sheets.googleapis.com"
}
```

#### Mutation Endpoint
- **Method:** `POST {baseUrl}/v4/spreadsheets/{spreadsheetId}/values:batchUpdate`
- **Headers:**
  - `Authorization: Bearer {accessToken}`
  - `Content-Type: application/json`
- **Payload (`valueInputOption: "USER_ENTERED"`):**
```json
{
  "valueInputOption": "USER_ENTERED",
  "data": [
    {
      "range": "Sheet1!G42",
      "values": [["akadli-confirmed"]]
    },
    {
      "range": "Sheet1!L42",
      "values": [["Confirmed by customer via voice call"]]
    }
  ]
}
```

For `MODIFIED` decisions, `sizeColumn`, `wilayaColumn`, `communeColumn`, and `addressColumn` are included in the `data` array if specified in the decision.

### Mode B: Apps Script Webhook Callback URL

For merchants without Google Cloud API credentials, a Google Apps Script Web App URL can be configured.

#### Credentials Schema
```typescript
export interface GSheetsAppsScriptCredentials {
  appsScriptWebhookUrl: string;
  secret?: string;
}
```

#### Callback Request
- **Method:** `POST {appsScriptWebhookUrl}`
- **Headers:**
  - `Content-Type: application/json`
  - `x-akadli-secret: {secret}` (if secret provided)
  - `x-akadli-signature: {hexHmac}` (if secret provided)
- **Body:**
```json
{
  "orderId": "SS-1042#ROW-42",
  "rowNumber": 42,
  "status": "CONFIRMED",
  "externalStatus": "CONFIRMED",
  "finalVariant": "43",
  "finalWilaya": "16",
  "finalCommune": "Bab Ezzouar",
  "finalAddressNote": "Cité 8 Mai 1945",
  "reasonOrNotes": "Confirmed with size change",
  "updatedAt": "2026-10-19T14:00:00.000Z"
}
```

---

## 4. Error Handling & HTTP Status Codes

- **401 / 403 Unauthorized:** Return `{ success: false, externalStatus: "UNAUTHORIZED", rawResponse: ... }`.
- **404 Not Found:** Return `{ success: false, externalStatus: "NOT_FOUND", rawResponse: ... }`.
- **Missing Row Number:** Return `{ success: false, externalStatus: "INVALID_ROW_NUMBER", rawResponse: ... }`.
- **Network / Other Errors:** Fail gracefully with descriptive error payloads.
