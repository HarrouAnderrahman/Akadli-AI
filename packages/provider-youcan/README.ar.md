**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-youcan

> محول منصة YouCan (.shop) لتأكيد طلبيات الدفع عند الاستلام (COD) مع استخراج حقول النموذج أحادي الصفحة والتحقق من توقيع HMAC وتحديث حالات الطلبات.

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract` لمتاجر YouCan في الجزائر.

---

## دليل إعداد متجر YouCan عبر لوحة البائع (Seller Area)

1. **إنشاء رمز الوصول (API Token):** ادخل إلى [seller-area.youcan.shop](https://seller-area.youcan.shop) ثم **الإعدادات (Settings)** -> **واجهة برمجة التطبيقات (API & Integrations)** وأنشئ رمز الوصول.
2. **ضبط الـ Webhook:**
   - من **الإعدادات** -> **الـ Webhooks**، أضف Webhook جديداً للحدث `order.created`.
   - عيّن الرابط إلى مسار الاستقبال (مثال: `https://your-domain.com/api/webhooks/youcan`).
   - انسخ المفتاح السري للـ Webhook (يُستخدم للتحقق من ترويسة `x-youcan-signature` بصيغة hex).
3. **استخراج حقول COD أحادية الصفحة والكمية وسعر التوصيل (Extra Fields):**
   - يعتمد معظم تجار YouCan في الجزائر على نماذج الشراء السريعة أحادية الصفحة حيث تُخزن البيانات داخل `extra_fields` أو `custom_fields`.
   - يقوم محول `@akadli/provider-youcan` تلقائياً باستخراج ومعالجة العناوين من كلا المصدرين وتطبيع الولاية (`01`-`69`) والبلدية وفق تقسيم 2026 عبر `@akadli/dz-geo`.
   - يستخرج تلقائياً الكمية `quantity` (مجموع `variants[].quantity` أو `items[].quantity` أو `line_items[].quantity` أو من `extra_fields`، افتراضياً `1`) وسعر التوصيل `shippingFeeDa` (`shipping.price` أو `shipping_cost` أو `shipping_total` أو من `extra_fields`، افتراضياً `0`).
   - عند التعديل (`MODIFIED`)، يضيف الوسوم القياسية `akadli-modified` و `akadli-variant-{finalVariant}` و `akadli-qty-{finalQuantity}`.

---

## جدول بيانات الاعتماد (`YouCanCredentialsSchema`)

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | نعم | — | رمز الوصول الخاص بحساب YouCan |
| `baseUrl` | `string` | لا | `"https://api.youcan.shop"` | الرابط الأساسي لـ REST API الخاص بـ YouCan |
| `closeOnRefused` | `string` | لا | `"true"` | إغلاق أو إلغاء الطلبية تلقائياً في حال رفض المشتري التأكيد |

---

## مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { YouCanProvider } from "@akadli/provider-youcan";

const provider = new YouCanProvider();

// 1. التحقق من توقيع الـ Webhook (ترويسة x-youcan-signature بصيغة hex)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.YOUCAN_WEBHOOK_SECRET!);

// 2. تحليل الطلبية الجزائرية واستخراج حقول extra_fields
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تحديث الطلب في YouCan بعد انتهاء المكالمة (الوسوم: akadli-confirmed / akadli-modified / akadli-refused)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "تم تأكيد الطلب مع الزبون هاتفياً"
}, {
  accessToken: process.env.YOUCAN_ACCESS_TOKEN!
});
```

</div>
