---
title: محول ووكومرس (@akadli/provider-woocommerce)
description: محول تأكيد طلبيات الدفع عند الاستلام لمنصة WooCommerce في ووردبريس، وتطبيع رموز DZ-XX وحقول meta_data لإضافات COD.
---

تربط حزمة `@akadli/provider-woocommerce` متاجر ووردبريس (WooCommerce) بمنظومة Akadli-AI. تدعم الحزمة قراءة رموز الولايات الجزائرية الرسمية بصيغة `DZ-XX`، واستخراج البيانات المخصصة من إضافات الدفع عند الاستلام عبر حقول `meta_data`، وتحديث الطلبات عبر واجهة REST v3.

---

## التثبيت

```bash
pnpm add @akadli/provider-woocommerce
```

---

## خطوات الإعداد في لوحة تحكم ووكومرس وووردبريس

### 1. توليد مفاتيح واجهة REST API
1. في لوحة تحكم ووردبريس، توجه إلى **WooCommerce** -> **الإعدادات (Settings)** -> **خيارات متقدمة (Advanced)** -> **REST API**.
2. اضغط على **إضافة مفتاح (Add key)**:
   - **الوصف:** `Akadli-AI Integration`
   - **المستخدم:** اختر حساب المدير
   - **الصلاحيات:** **قراءة/كتابة (Read/Write)**
3. احفظ المفتاحين المولدين: **Consumer Key** (`ck_...`) و **Consumer Secret** (`cs_...`).

### 2. تهيئة الـ Webhook
1. توجه إلى **WooCommerce** -> **الإعدادات** -> **خيارات متقدمة** -> **Webhooks**.
2. اضغط على **إضافة Webhook**:
   - **الاسم:** `Akadli-AI Order Created`
   - **الحالة:** **مفعل (Active)**
   - **الموضوع (Topic):** `Order created`
   - **رابط التسليم:** `https://your-domain.com/api/webhooks/woocommerce`
   - **المفتاح السري:** أدخل نصاً سرياً قوياً (للتحقق من ترويسة `x-wc-webhook-signature`)
   - **إصدار الواجهة البرمجية:** **WP REST API Integration v3**
3. احفظ الـ Webhook.

### 3. دعم رموز `DZ-XX` وإضافات الدفع عند الاستلام
يمثل نظام ووكومرس الافتراضي الولايات الجزائرية بصيغة `DZ-XX` (مثل `DZ-16` للجزائر، و `DZ-60` لبريكة، و `DZ-68` لبوسعادة).
أما المتاجر التي تستخدم إضافات مخصصة (مثل إضافات COD Form الجزائرية) فتحفظ الولاية والبلدية في بيانات `meta_data` (مثل `_billing_wilaya` و `_shipping_commune`).

تفحص حزمة `@akadli/provider-woocommerce` كلا المصدرين وتطابق الولاية والبلدية تلقائياً مع التقسيم الإداري 2026 عبر `@akadli/dz-geo`.

---

## بيانات الاعتماد المطلوبة

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `siteUrl` | `string` | نعم | — | رابط موقع ووردبريس (مثل `https://my-dz-store.com`) |
| `consumerKey` | `string` | نعم | — | مفتاح Consumer Key الخاص بووكومرس (`ck_...`) |
| `consumerSecret` | `string` | نعم | — | المفتاح السري Consumer Secret الخاص بووكومرس (`cs_...`) |
| `cancelOnRefused` | `string` | لا | `"true"` | تحويل حالة الطلب إلى `cancelled` عند الرفض |

---

## مثال برمجي

```typescript
import { WooCommerceProvider, isWooCommerceWebhookPing } from "@akadli/provider-woocommerce";

const provider = new WooCommerceProvider();

// 1. استقبال الرد على إشعار التحقق الأولي غير الموقع (deliver_ping)
if (isWooCommerceWebhookPing(headers, req.body, rawBody)) {
  return res.status(200).json({ success: true, message: "Webhook ping acknowledged" });
}

// 2. التحقق من توقيع HMAC بصيغة Base64 من ترويسة x-wc-webhook-signature
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.WOOCOMMERCE_WEBHOOK_SECRET!
);

if (!isValid) {
  return res.status(401).json({ error: "Invalid HMAC signature" });
}

// 3. تحليل الطلبية وفق التقسيم الجزائري 2026
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 4. تحديث الطلبية بعد المكالمة
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "تم التأكيد صوتياً بالدارجة"
  },
  {
    siteUrl: process.env.WOOCOMMERCE_SITE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!
  }
);
```
