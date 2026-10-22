---
title: Google Sheets Adapter (@akadli/provider-gsheets)
description: Universal Google Sheets & Apps Script bridge for Algerian COD landing pages and store builders (SetShop, JustSell, Foorweb).
---

`@akadli/provider-gsheets` provides a universal bridge for Algerian merchants selling via landing pages or entry-level store builders (such as **SetShop**, **JustSell**, and **Foorweb**) that export incoming orders directly into a Google Sheet.

It supports two operating modes:
- **Mode A (REST API v4):** Direct spreadsheet cell reading and writing via Google Cloud Service Accounts.
- **Mode B (Zero-OAuth Apps Script):** Instant setup with a copy-paste Google Apps Script Web App that handles two-way updates without needing a Google Cloud console project.

---

## Installation

```bash
pnpm add @akadli/provider-gsheets
```

---

## Mode B: Zero-OAuth Google Apps Script (Recommended for Fast Setup)

Merchants can deploy an Apps Script web app inside their existing Google Sheet in 60 seconds:

### 1. Paste the Apps Script Handler
1. Inside your Google Sheet, click **Extensions** -> **Apps Script**.
2. Replace any existing code with this snippet:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var row = Number(data.rowNumber);

  if (!row) {
    return ContentService.createTextOutput("Missing rowNumber");
  }

  // Update status (Column G)
  sheet.getRange(row, 7).setValue(data.status);

  // Update Wilaya (Column I) & Commune (Column J) if modified
  if (data.finalWilaya) sheet.getRange(row, 9).setValue(data.finalWilaya);
  if (data.finalCommune) sheet.getRange(row, 10).setValue(data.finalCommune);

  // Update call audit notes (Column L)
  if (data.reasonOrNotes) sheet.getRange(row, 12).setValue(data.reasonOrNotes);

  return ContentService.createTextOutput("OK");
}
```

### 2. Deploy Web App
1. Click **Deploy** -> **New deployment**.
2. Select type: **Web app**.
3. **Execute as:** `Me (your-email@gmail.com)`.
4. **Who has access:** `Anyone`.
5. Click **Deploy** and copy the Web App URL.

---

## Flexible Arabic & French Column Header Mapping

`@akadli/provider-gsheets` automatically recognizes Arabic, French, and English column headers commonly used across Algerian landing pages:

| Field | Recognized Headers |
| :--- | :--- |
| **Name** | `الاسم`, `الاسم واللقب`, `nom`, `name`, `full_name` |
| **Phone** | `الهاتف`, `رقم الهاتف`, `telephone`, `phone`, `mobile` |
| **Wilaya** | `الولاية`, `wilaya`, `province`, `state` |
| **Commune** | `البلدية`, `الدائرة`, `commune`, `city` |
| **Product** | `المنتج`, `السلعة`, `produit`, `item`, `title` |
| **Variant** | `المقاس`, `الحجم`, `اللون`, `taille`, `variant`, `size` |
| **Price** | `السعر`, `المبلغ`, `prix`, `total`, `price` |

---

## Credentials Schema

| Mode | Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `spreadsheetId` | `string` | Yes (Mode A) | — | Google Sheet ID from browser URL |
| **A** | `accessToken` | `string` | Yes (Mode A) | — | Google Cloud OAuth2 token |
| **A** | `sheetName` | `string` | No | `"Sheet1"` | Target tab name |
| **A** | `statusColumn` | `string` | No | `"G"` | Column letter for order status |
| **A** | `notesColumn` | `string` | No | `"L"` | Column letter for order notes |
| **B** | `appsScriptWebhookUrl` | `string` | Yes (Mode B) | — | Deployed Apps Script Web App URL |
| **B** | `secret` | `string` | No | — | Optional secret token for verification |

---

## Code Example

```typescript
import { GSheetsProvider } from "@akadli/provider-gsheets";

const provider = new GSheetsProvider();

// 1. Verify inbound webhook from Apps Script or sheet row trigger
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.GSHEETS_WEBHOOK_SECRET!
);

// 2. Parse standardized Algerian COD order
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Mutate Google Sheet row after voice call (Mode B)
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "Confirmed in Darja via voice call"
  },
  {
    appsScriptWebhookUrl: process.env.GSHEETS_APPS_SCRIPT_URL!
  }
);
```
