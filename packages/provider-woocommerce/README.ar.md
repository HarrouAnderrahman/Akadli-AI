**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-woocommerce

> محول WooCommerce لتأكيد طلبيات الدفع عند الاستلام (COD) مع مطابقة رموز الولايات DZ-XX واستخراج بيانات إضافات COD وتحديث الطلبات عبر REST API v3.

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract` لمتاجر WordPress / WooCommerce في الجزائر.

---

## دليل إعداد WooCommerce و WordPress

1. **إنشاء مفاتيح REST API:**
   - من لوحة تحكم WordPress، ادخل إلى **WooCommerce** -> **الإعدادات (Settings)** -> **متقدم (Advanced)** -> **REST API**.
   - اضغط **Add Key**، سمّ المفتاح `Akadli-AI`، وحدد الصلاحيات إلى **Read/Write**.
   - انسخ كل من `Consumer key` (`ck_...`) و `Consumer secret` (`cs_...`).
2. **ضبط الـ Webhook:**
   - من **WooCommerce** -> **الإعدادات** -> **متقدم** -> **Webhooks**، أضف Webhook جديداً.
   - الحالة: **Active** • الموضوع: **Order created** • رابط التسليم: `https://your-domain.com/api/webhooks/woocommerce`.
   - المفتاح السري: اكتب المفتاح السري المخصص للتحقق من ترويسة `x-wc-webhook-signature` (Base64).
   - إصدار الواجهة: **WP REST API Integration v3**.
3. **رموز الولايات الجزائرية `DZ-XX` واستخراج الكمية والتوصيل وإضافات COD:**
   - يعرّف نظام WooCommerce الولايات الجزائرية بصيغة `DZ-XX` (مثل `DZ-16` للجزائر أو `DZ-68` لبوسعادة).
   - المتاجر التي تستخدم إضافات COD جزائرية تخزن تفاصيل الولاية والبلدية داخل `meta_data`.
   - يدعم محول `@akadli/provider-woocommerce` كلا النظامين ويطابقهما بسلاسة مع تقسيم 2026 عبر `@akadli/dz-geo`، كما يستخرج الكمية `quantity` (مجموع `line_items[].quantity`، افتراضياً `1`) وسعر التوصيل `shippingFeeDa` (`shipping_total` أو `shipping_lines[0].total` أو `meta_data`، افتراضياً `0`).
   - عند التعديل (`MODIFIED`)، يسجل `_akadli_status` (`akadli-modified`) و `_akadli_variant` (`akadli-variant-{finalVariant}`) و `_akadli_qty` (`akadli-qty-{finalQuantity}`) في `meta_data` ويضيف ملاحظة `[Akadli-AI]`.

---

## جدول بيانات الاعتماد (`WooCommerceCredentialsSchema`)

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `siteUrl` | `string` | نعم | — | رابط موقع ووردبريس (مثال: `https://dz-store.com`) |
| `consumerKey` | `string` | نعم | — | مفتاح Consumer Key لـ WooCommerce REST API (`ck_...`) |
| `consumerSecret` | `string` | نعم | — | مفتاح Consumer Secret لـ WooCommerce REST API (`cs_...`) |
| `cancelOnRefused` | `string` | لا | `"true"` | تحويل حالة الطلب إلى `cancelled` في ووكومرس عند رفض الزبون |

---

## مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { WooCommerceProvider, isWooCommerceWebhookPing } from "@akadli/provider-woocommerce";

const provider = new WooCommerceProvider();

// 1. تأكيد استلام إشارة الفحص الأولية غير الموقعة لووكومرس (WC_Webhook::deliver_ping)
if (isWooCommerceWebhookPing(headers, req.body, rawBody)) {
  return res.status(200).json({ success: true, message: "Webhook ping acknowledged" });
}

// 2. التحقق من توقيع HMAC-SHA256 (Base64 من x-wc-webhook-signature)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.WOOCOMMERCE_WEBHOOK_SECRET!);
if (!isValid) {
  return res.status(401).json({ error: "Invalid HMAC signature" });
}

// 3. تحليل الطلبية وتطبيع رموز DZ-XX وحقول meta_data
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 4. تحديث الطلب في WooCommerce (تحديث البيانات الوصفية، إضافة ملاحظة، وتحديث الحالة)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "تم تأكيد الطلب مع الزبون هاتفياً"
}, {
  siteUrl: process.env.WOOCOMMERCE_SITE_URL!,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!
});
```

</div>
