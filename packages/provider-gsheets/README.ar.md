**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-gsheets

> الجسر البرمجي الشامل لجداول Google Sheets و Apps Script لمنصات التجارة الإلكترونية وصفحات الهبوط في الجزائر (SetShop, JustSell, Foorweb).

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract`، مع دعم مرن لأسماء الأعمدة بالعربية والفرنسية والإنجليزية، والتحقق من توقيع HMAC، وتحديث خلايا الجدول مباشرة بعد المكالمة.

---

## طرق الربط للتجار الجزائريين

### الطريقة (أ): عبر Google Sheets REST API v4 المباشر
تتطلب حساب Google Cloud Service Account ورمز وصول OAuth2. تحتاج إلى `spreadsheetId` و `accessToken`.

### الطريقة (ب): عبر تطبيق ويب Google Apps Script بدون OAuth (الأسهل والأسرع)
يقوم التاجر بإنشاء Web App بسيط داخل الجدول لإرسال واستقبال بيانات الطلبيات.

#### كود Google Apps Script جاهز للنسخ (دالة `doPost`)
من داخل جدول Google Sheet -> **الأدوات (Extensions)** -> **Apps Script**، الصق الكود التالي:

</div>

<div dir="ltr" align="left">

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var row = data.rowNumber;
  if (!row) return ContentService.createTextOutput("Missing rowNumber");

  sheet.getRange(row, 7).setValue(data.status); // العمود G: الحالة
  if (data.finalWilaya) sheet.getRange(row, 9).setValue(data.finalWilaya); // العمود I: الولاية
  if (data.finalCommune) sheet.getRange(row, 10).setValue(data.finalCommune); // العمود J: البلدية
  if (data.reasonOrNotes) sheet.getRange(row, 12).setValue(data.reasonOrNotes); // العمود L: الملاحظات
  return ContentService.createTextOutput("OK");
}
```

</div>

<div dir="rtl" align="right">

*انشر التطبيق: Deploy as Web App -> Execute as: Me -> Who has access: Anyone.*

---

## جدول بيانات الاعتماد

| الطريقة | الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **أ** | `spreadsheetId` | `string` | نعم (للطريقة أ) | — | معرف جدول Google Sheets من الرابط |
| **أ** | `accessToken` | `string` | نعم (للطريقة أ) | — | رمز وصول OAuth2 الخاص بـ Google Cloud |
| **أ** | `sheetName` | `string` | لا | `"Sheet1"` | اسم ورقة العمل المستهدفة |
| **أ** | `statusColumn` / `notesColumn` | `string` | لا | `"G"` / `"L"` | حروف أعمدة الحالة والملاحظات |
| **ب** | `appsScriptWebhookUrl` | `string` | نعم (للطريقة ب) | — | رابط تطبيق الويب المنشور في Apps Script |
| **ب** | `secret` | `string` | لا | — | المفتاح السري المشترك للتحقق من الطلبات |

---

## مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { GSheetsProvider } from "@akadli/provider-gsheets";

const provider = new GSheetsProvider();

// 1. التحقق من توقيع Webhook (ترويسة x-akadli-signature أو x-akadli-secret)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.GSHEETS_WEBHOOK_SECRET!);

// 2. تحليل سطر الطلبية (يدعم أعمدة 'الاسم'، 'الهاتف'، 'الولاية'، 'البلدية')
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تحديث سطر الطلبية في Google Sheets (الطريقة ب أو أ)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "تم تأكيد الطلب مع الزبون هاتفياً"
}, {
  appsScriptWebhookUrl: process.env.GSHEETS_APPS_SCRIPT_URL!
});
```

</div>
