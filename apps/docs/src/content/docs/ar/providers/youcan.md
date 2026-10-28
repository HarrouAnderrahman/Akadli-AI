---
title: YouCan
description: محول تأكيد طلبيات الدفع عند الاستلام لمنصة YouCan (.shop) ودعم استخراج حقول extra_fields والتحقق من التوقيع.
---

توفر حزمة `@akadli/provider-youcan` تكاملاً مباشراً مع منصة التجارة الإلكترونية **YouCan (.shop)** للمتاجر العاملة في الجزائر. تدعم الحزمة معالجة نماذج الشراء ذات الصفحة الواحدة (1-Page COD) حيث يتم حفظ حقول الولاية والبلدية المخصصة داخل `extra_fields` أو `custom_fields`.

---

## التثبيت

```bash
pnpm add @akadli/provider-youcan
```

---

## خطوات الإعداد في لوحة تحكم YouCan للبائعين

### 1. توليد رمز الوصول البرمجي (API Token)
1. سجل الدخول إلى [seller-area.youcan.shop](https://seller-area.youcan.shop).
2. توجه إلى **الإعدادات (Settings)** -> **الربط البرمجي (API & Integrations)**.
3. أنشئ رمز وصول جديد (API Access Token) وامنحه صلاحيات إدارة الطلبيات كاملة.
4. احفظ الرمز باسم `YOUCAN_ACCESS_TOKEN`.

### 2. تهيئة الـ Webhook
1. من **الإعدادات (Settings)** -> **Webhooks**، اضغط على **إضافة Webhook جديد**.
2. **الحدث:** اختر `order.created`.
3. **الرابط:** أدخل عنوان الخادم لديك (مثل `https://your-domain.com/api/webhooks/youcan`).
4. انسخ المفتاح السري المولد **Webhook Secret** للتحقق من ترويسة `x-youcan-signature`.

### 3. دعم نماذج الشراء بصفحة واحدة (1-Page COD)
يعتمد معظم تجار يوكان في الجزائر على قوالب الشراء المباشر بصفحة واحدة، حيث ترسل المنصة بيانات الولاية والبلدية داخل مصفوفة `extra_fields`. تفحص الحزمة كلاً من:
- مصفوفة `extra_fields`
- مصفوفة `custom_fields`
- كائن العنوان الافتراضي `shipping_address`

وتقوم بمطابقة الولاية مع رموز تقسيم 2026 الرسمية (`01`–`69`) والبلديات عبر `@akadli/dz-geo`، بالإضافة إلى استخراج الكمية `quantity` (مجموع `variants[].quantity` أو `items[].quantity` أو `line_items[].quantity` أو `extra_fields`، افتراضياً `1`) وسعر التوصيل `shippingFeeDa` (`shipping.price` أو `shipping_cost` أو `shipping_total` أو `extra_fields`، افتراضياً `0`) وإضافة وسم `akadli-qty-{finalQuantity}` عند التعديل (`MODIFIED`).

---

## بيانات الاعتماد المطلوبة

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | نعم | — | رمز الوصول البرمجي لواجهة يوكان |
| `baseUrl` | `string` | لا | `"https://api.youcan.shop"` | الرابط الأساسي لواجهة REST |
| `closeOnRefused` | `string` | لا | `"true"` | إغلاق أو إلغاء الطلبية تلقائياً عند رفض الزبون |

---

## مثال برمجي

```typescript
import { YouCanProvider } from "@akadli/provider-youcan";

const provider = new YouCanProvider();

// 1. التحقق من توقيع HMAC السداسي عشري (x-youcan-signature)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.YOUCAN_WEBHOOK_SECRET!
);

// 2. تحليل الطلبية وفق التقسيم الجزائري 2026
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تحديث الطلبية بعد المكالمة
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "تم التأكيد صوتياً بالدارجة"
  },
  {
    accessToken: process.env.YOUCAN_ACCESS_TOKEN!
  }
);
```
