---
title: محول شوبيفاي (@akadli/provider-shopify)
description: محول تأكيد طلبيات الدفع عند الاستلام لمتاجر Shopify، وخطوات إعداد لوحة المطورين، وحل إشكالية الولاية المفقودة.
---

تطبق حزمة `@akadli/provider-shopify` واجهة `IEcommerceProvider` لمتاجر Shopify في الجزائر. تتولى الحزمة التحقق المشفر من توقيع HMAC، واستخراج العناوين الجزائرية من تطبيقات صفحة الدفع الواحدة (EasySell و Releasit)، وتحديث الطلبات عبر REST API.

---

## التثبيت

```bash
pnpm add @akadli/provider-shopify
```

---

## دليل إعداد تطبيق شوبيفاي في لوحة المطورين (2026)

### 1. إنشاء تطبيق في لوحة مطوري شوبيفاي
1. توجه إلى [dev.shopify.com](https://dev.shopify.com) أو لوحة Shopify Partners -> **Apps** -> **Create an App**.
2. اختر **Create app manually**.
3. حدد اسم التطبيق: `Akadli-AI Voice Confirmation`.
4. رابط التطبيق (App URL): ضع رابط الخادم الخاص بك (مثلاً `https://api.yourdomain.com`).
5. **هام جداً:** اترك خيار **Embed app in Shopify admin** **غير مفعل** (Unchecked) للتطبيقات الخارجية.

### 2. تحديد الصلاحيات ومفاتيح الوصول
1. من إعدادات التطبيق -> **Configuration** -> **Admin API integration**:
2. امنح الصلاحيات التالية:
   - `read_orders`
   - `write_orders`
   - `read_products` (لجلب مقاسات وألوان المنتج البديلة)

### 3. تفعيل الوصول لبيانات العملاء المحمية (Protected Customer Data Access)
1. في قسم **API access** -> **Protected customer data access**:
2. فعل الصلاحيات لـ:
   - **الاسم (Name)**
   - **العنوان (Address)**
   - **الهاتف (Phone)**
3. *ملاحظة هامة:* إذا لم تفعل هذه الصلاحية، ستقوم شوبيفاي بحجب رقم هاتف الزبون ولن تتمكن من إجراء المكالمة أو تعديل عنوان التوصيل!

### 4. إنشاء الـ Webhook
1. في لوحة إدارة المتجر -> **Settings** -> **Notifications** -> **Webhooks**:
2. أنشئ Webhook جديد:
   - **الحدث (Event):** `Order creation`
   - **الصيغة (Format):** `JSON`
   - **الرابط (URL):** `https://your-domain.com/api/webhooks/shopify`
3. انسخ المفتاح السري **Webhook Secret** الموجود أسفل الصفحة للتحقق من التوقيع.

---

## معالجة غياب حقل الولاية في الجزائر (`province: null`)

في نموذج الدفع الافتراضي لشوبيفاي، يتم إخفاء قائمة الولايات عند اختيار دولة الجزائر (`DZ`). ولهذا يكتب الزبائن الجزائريون اسم الولاية في:
- حقل المدينة (`city`)
- حقل العنوان الأول (`address1`)
- الرمز البريدي المكون من 5 أرقام (`13000` تشير لولاية تلمسان `13`).
- حقول الملاحظات `note_attributes` في تطبيقات الشراء بصفحة واحدة (EasySell أو Releasit).

تقوم حزمة `@akadli/provider-shopify` بفحص جميع هذه الحقول وتمريرها على معالج `@akadli/dz-geo` لتحديد الولاية الصحيحة بدقة بين 01 و 69.

---

## بيانات الاعتماد المطلوبة

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `shopDomain` | `string` | نعم | — | نطاق المتجر (مثل `dz-store.myshopify.com`) |
| `accessToken` | `string` | اختياري* | — | مفتاح الوصول الدائم (`shpat_...`) |
| `clientId` | `string` | اختياري* | — | معرف العميل لتطبيق OAuth |
| `clientSecret` | `string` | اختياري* | — | المفتاح السري لتطبيق OAuth |
| `apiVersion` | `string` | لا | `"2025-01"` | إصدار واجهة شوبيفاي REST |
| `cancelOnRefused` | `string` | لا | `"true"` | إلغاء الطلبية تلقائياً عند الرفض |

*\*يجب توفير إما `accessToken` أو كليهما (`clientId` و `clientSecret`).*

---

## مثال برمجي

```typescript
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

// 1. التحقق من توقيع HMAC المشفر
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.SHOPIFY_WEBHOOK_SECRET!
);

// 2. تحليل الطلبية وفق التقسيم الجزائري 2026
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تحديث المتجر بقرار المكالمة
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "تم التأكيد صوتياً بالدارجة"
  },
  {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
  }
);
```
