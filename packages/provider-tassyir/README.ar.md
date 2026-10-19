**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-tassyir

> محول نظام تسيير (Tassyir ERP) لإدارة طلبيات الدفع عند الاستلام في الجزائر مع التحقق من التوقيع، والتحديث ثنائي المراحل، وتجهيز الشحن التلقائي لشركات التوصيل (Yalidine, ZR Express, Ecotrack).

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract` لمتاجر ومستودعات التجارة الإلكترونية التي تدير عملياتها عبر نظام Tassyir ERP الجزائري.

---

## دليل إعداد نظام Tassyir وتدفق التحديث ثنائي المراحل

1. **الحصول على مفتاح API والمفتاح السري:**
   - من لوحة تحكم Tassyir ERP -> **الإعدادات (Settings)** -> **واجهات الربط (API & Integrations)**، أنشئ مفتاح API وانسخ المفتاح السري للـ Webhook (ترويسة `x-tassyir-signature` بصيغة hex).
2. **ضبط مسار الـ Webhook:**
   - عيّن رابط التسليم إلى `https://your-domain.com/api/webhooks/tassyir` للحدث `order.created`.
3. **بروتوكول التحديث ثنائي المراحل بعد المكالمة:**
   - **المرحلة الأولى (`PATCH /orders/{id}`):** تحديث حالة التأكيد (`confirmed` / `refused`) والوسوم (`akadli-confirmed`، `akadli-modified`، `akadli-refused`) وتعديلات العنوان والملاحظات.
   - **المرحلة الثانية (`POST /orders/{id}/dispatch`):** في حال كانت الحالة `CONFIRMED` وخيار `dispatchOnConfirm` مفعّلاً، يتم إرسال إشعار التجهيز للشحن المباشر إلى شركة التوصيل المرتبطة (ياليدين، زر إكسبريس، أو إيكوتراك) مع `ready_for_expedition: true`.

---

## جدول بيانات الاعتماد (`TassyirCredentialsSchema`)

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `apiKey` | `string` | نعم | — | مفتاح واجهة برمجة تطبيقات Tassyir ERP |
| `baseUrl` | `string` | لا | `"https://api.tassyir.dz/v1"` | الرابط الأساسي لواجهة Tassyir REST API |
| `dispatchOnConfirm` | `string` | لا | `"true"` | تفعيل المرحلة الثانية وتجهيز الشحن التلقائي لشركة التوصيل عند التأكيد |
| `cancelOnRefused` | `string` | لا | `"true"` | إلغاء الطلبية تلقائياً في ERP عند رفض الزبون |

---

## مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. التحقق من توقيع HMAC (ترويسة x-tassyir-signature بصيغة hex)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.TASSYIR_WEBHOOK_SECRET!);

// 2. تحليل الطلبية وتطبيع العناوين وفق تقسيم 2026
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تطبيق القرار (المرحلة 1: تحديث الطلب + المرحلة 2: تجهيز الشحن التلقائي)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "تم تأكيد الطلبية عبر مكالمة الوكيل الصوتي"
}, {
  apiKey: process.env.TASSYIR_API_KEY!,
  dispatchOnConfirm: "true"
});
```

</div>
