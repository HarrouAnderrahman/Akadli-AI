---
title: Google Sheets
description: جسر ربط جداول جوجل (Google Sheets) ومتاجر SetShop و JustSell وصفحات الهبوط عبر Apps Script بدون تعقيد OAuth.
---

توفر حزمة `@akadli/provider-gsheets` جسراً شاملاً للتجار الجزائريين الذين يستقبلون طلبياتهم عبر صفحات الهبوط أو المنصات الخفيفة مثل **SetShop** و **JustSell** و **Foorweb** التي تسجل الطلبات مباشرة في جدول Google Sheets.

يدعم المحول نمطين للعمل:
- **النمط الأول (Mode A - REST API v4):** الاتصال المباشر عبر حسابات خدمة Google Cloud للمتاجر الكبيرة.
- **النمط الثاني (Mode B - Apps Script السريع):** تشغيل فوري بدون الحاجة لإنشاء مشروع سحابي أو مفاتيح OAuth معقدة، بالاعتماد على سكربت بسيط يتم لصقه داخل الجدول.

---

## التثبيت

```bash
pnpm add @akadli/provider-gsheets
```

---

## النمط السريع (Mode B): كود Google Apps Script الجاهز

يمكنك ربط جدولك خلال دقيقة واحدة عبر الخطوات التالية:

### 1. لصق كود معالج الـ Webhook
1. افتح جدول Google Sheet الخاص بالطلبيات، واضغط على **الإضافات (Extensions)** -> **Apps Script**.
2. احذف أي كود موجود والصق هذا الكود:

```javascript
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var row = Number(data.rowNumber);

  if (!row) {
    return ContentService.createTextOutput("Missing rowNumber");
  }

  // تحديث حالة الطلبية (العمود G)
  sheet.getRange(row, 7).setValue(data.status);

  // تحديث الولاية (العمود I) والبلدية (العمود J) عند التعديل
  if (data.finalWilaya) sheet.getRange(row, 9).setValue(data.finalWilaya);
  if (data.finalCommune) sheet.getRange(row, 10).setValue(data.finalCommune);

  // تسجيل الملاحظات وتفاصيل المكالمة (العمود L)
  if (data.reasonOrNotes) sheet.getRange(row, 12).setValue(data.reasonOrNotes);

  return ContentService.createTextOutput("OK");
}
```

### 2. نشر السكربت كتطبيق ويب (Web App)
1. اضغط على زر **نشر (Deploy)** -> **نشر جديد (New deployment)**.
2. اختر النوع: **تطبيق ويب (Web app)**.
3. **التشغيل باسم (Execute as):** `حسابي (Me)`.
4. **من يملك حق الوصول (Who has access):** `الجميع (Anyone)`.
5. اضغط على **Deploy** وانسخ الرابط الناتج لاستخدامه كـ `appsScriptWebhookUrl`.

---

## التعرف التلقائي على رؤوس الأعمدة بالعربية والفرنسية

يتعرف محول `@akadli/provider-gsheets` بمرونة على تسميات الأعمدة الشائعة في صفحات الهبوط الجزائرية:

| الحقل | التسميات المدعومة |
| :--- | :--- |
| **الاسم** | `الاسم`, `الاسم واللقب`, `nom`, `name`, `full_name` |
| **الهاتف** | `الهاتف`, `رقم الهاتف`, `telephone`, `phone`, `mobile` |
| **الولاية** | `الولاية`, `wilaya`, `province`, `state` |
| **البلدية** | `البلدية`, `الدائرة`, `commune`, `city` |
| **المنتج** | `المنتج`, `السلعة`, `produit`, `item`, `title` |
| **المقاس** | `المقاس`, `الحجم`, `اللون`, `taille`, `variant`, `size` |
| **الكمية** | `الكمية`, `عدد`, `quantite`, `qte`, `quantity`, `qty` |
| **التوصيل** | `التوصيل`, `سعر التوصيل`, `livraison`, `frais_livraison`, `shipping`, `shipping_fee` |
| **السعر** | `السعر`, `المبلغ`, `prix`, `total`, `price` |

---

## بيانات الاعتماد المطلوبة

| النمط | الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | `spreadsheetId` | `string` | نعم (لـ Mode A) | — | معرف الجدول المستخرج من رابط المتصفح |
| **A** | `accessToken` | `string` | نعم (لـ Mode A) | — | رمز وصول Google Cloud OAuth2 |
| **A** | `sheetName` | `string` | لا | `"Sheet1"` | اسم الورقة |
| **A** | `statusColumn` | `string` | لا | `"G"` | حرف عمود حالة الطلبية |
| **A** | `notesColumn` | `string` | لا | `"L"` | حرف عمود ملاحظات المكالمة |
| **B** | `appsScriptWebhookUrl` | `string` | نعم (لـ Mode B) | — | رابط تطبيق الويب من Apps Script |
| **B** | `secret` | `string` | لا | — | رمز تحقق اختياري للأمان |

---

## مثال برمجي

```typescript
import { GSheetsProvider } from "@akadli/provider-gsheets";

const provider = new GSheetsProvider();

// 1. التحقق من توقيع أو سر إشعار الـ Webhook
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.GSHEETS_WEBHOOK_SECRET!
);

// 2. تحليل سطر الطلبية وتطبيع العنوان الجزائري 2026
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تحديث سطر الجدول بعد انتهاء المكالمة الصوتية
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "تم تأكيد الطلبية صوتياً بالدارجة"
  },
  {
    appsScriptWebhookUrl: process.env.GSHEETS_APPS_SCRIPT_URL!
  }
);
```
