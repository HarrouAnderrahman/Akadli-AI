**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/provider-gsheets

> Universal Google Sheets & Apps Script bridge for Algerian COD landing pages and entry-level store builders (SetShop, JustSell, Foorweb).

Implements `IEcommerceProvider` from `@akadli/adapter-contract` supporting flexible Arabic, French, and English column headers, HMAC/secret verification, and two-way cell mutations.

---

## Connection Modes for Algerian Merchants

### Mode A: Direct Google Sheets REST API v4
Connects directly using a Google Cloud Service Account OAuth token. Requires `spreadsheetId` and `accessToken`.

### Mode B: Zero-OAuth Google Apps Script Web App (Recommended for Fast Setup)
Merchants deploy a simple Web App inside their Google Sheet that handles outbound webhooks and accepts post-call updates.

#### Copy-Paste Google Apps Script (`doPost` Handler)
Inside your Google Sheet -> **Extensions** -> **Apps Script**, paste:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var row = data.rowNumber;
  if (!row) return ContentService.createTextOutput("Missing rowNumber");

  sheet.getRange(row, 7).setValue(data.status); // Col G: Status
  if (data.finalWilaya) sheet.getRange(row, 9).setValue(data.finalWilaya); // Col I: Wilaya
  if (data.finalCommune) sheet.getRange(row, 10).setValue(data.finalCommune); // Col J: Commune
  if (data.reasonOrNotes) sheet.getRange(row, 12).setValue(data.reasonOrNotes); // Col L: Notes
  return ContentService.createTextOutput("OK");
}
```
*Deploy as Web App -> Execute as: Me -> Who has access: Anyone.*

---

## Credentials Schema

| Mode | Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `spreadsheetId` | `string` | Yes (Mode A) | — | Google Sheet ID from URL |
| **A** | `accessToken` | `string` | Yes (Mode A) | — | Google Cloud OAuth2 token |
| **A** | `sheetName` | `string` | No | `"Sheet1"` | Target tab name |
| **A** | `statusColumn` / `notesColumn` | `string` | No | `"G"` / `"L"` | Columns for status and notes |
| **B** | `appsScriptWebhookUrl` | `string` | Yes (Mode B) | — | Deployed Apps Script Web App URL |
| **B** | `secret` | `string` | No | — | Shared secret token for verification |

---

## Usage Example

```typescript
import { GSheetsProvider } from "@akadli/provider-gsheets";

const provider = new GSheetsProvider();

// 1. Verify Webhook (supports x-akadli-signature hex HMAC or x-akadli-secret)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.GSHEETS_WEBHOOK_SECRET!);

// 2. Parse row payload (supports Arabic/French/English headers for Name, Phone, Wilaya, Quantity, Shipping, Total)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Mutate Google Sheet row (Mode B Apps Script sends finalVariant, finalQuantity, finalWilaya, finalCommune, reasonOrNotes)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  finalQuantity: order.quantity,
  reasonOrNotes: "Confirmed via voice agent"
}, {
  appsScriptWebhookUrl: process.env.GSHEETS_APPS_SCRIPT_URL!
});
```
