**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-tassyir

> محول نظام تسيير الرسمي (Tassyir Admin API `2026-10`) مع دعم Webhooks المعيارية (`v1a` Ed25519 وتوقيع HMAC)، وتأكيد الطلبيات بدون تكرار (`Idempotency-Key`)، وتطبيع عناوين الدفع عند الاستلام في الجزائر (69 ولاية).

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract` للتكامل المباشر مع واجهة برمجة تطبيقات منصة **تسيير** (`api.tassyir.io`) لخدمة التجارة الإلكترونية ومراكز التوصيل في الجزائر.

---

## 🚀 إعداد متجر التطوير عبر واجهة أوامر تسيير (Tassyir CLI)

يمكنك ربط واختبار المتجر والـ Webhooks محلياً باستخدام أداة المطورين الرسمية:

```bash
# 1. تسجيل الدخول إلى حساب مطوري تسيير
npx tassyir@latest login

# 2. إنشاء متجر تجريبي للمطورين
npx tassyir@latest store create --name "Akadli Dev Store"

# 3. محاكاة وإرسال إشعار الويب (orders/created) إلى منصة Akadli Playground
npx tassyir@latest webhook trigger orders/created
```

### الصلاحيات المطلوبة للتطبيق (App Scopes)
عند إنشاء رمز الوصول (Access Token) في لوحة تحكم تسيير، يجب تحديد الصلاحيات التالية:
- `read_orders`: قراءة تفاصيل الطلبيات الواردة وبيانات الشحن.
- `write_orders`: تحديث ملاحظات الطلبية، وتأكيدها (`/confirm`) أو إلغائها (`/cancel`).
- `read_customer_contact`: **إلزامية للتأكيد الصوتي.** في حال عدم منح هذه الصلاحية (أو تجاوز باقة المتجر)، يتم حجب رقم هاتف الزبون كـ `"**********"` وتدخل الطلبية في حالة الانتظار `waiting: true`. يتعامل المحول مع هذه الحالة برمي خطأ استباقي واضح للمستخدم.

---

## ⚙️ المميزات والبنية التقنية

- **واجهة تسيير الرسمية (`2026-10`):** اتصال مباشر مع `https://api.tassyir.io/apps/2026-10`.
- **التحقق المعياري من الـ Webhooks (`v1a` Ed25519):** فحص ترويسات `webhook-id` و `webhook-timestamp` (ضمن نافذة 5 دقائق لمنع هجمات إعادة التشغيل) و `webhook-signature` باستخدام مكتبة `node:crypto`. يدعم أيضاً HMAC-SHA256 لمحاكاة البيئة التجريبية المحلية.
- **التقسيم الإداري الجزائري 2026:** استخراج وتطبيع الولايات (من 01 إلى 69) والبلديات تلقائياً عبر `@akadli/dz-geo`.
- **منع تكرار العمليات (`Idempotency-Key`):** إرسال ترويسة فريدة `Idempotency-Key: akadli-{action}-{orderId}` مع كل طلب `POST` (`/confirm` أو `/cancel`) لضمان عدم تكرار التأكيد أو الإلغاء عند انقطاع الشبكة وإعادة المحاولة.
- **إدارة حدود الاستخدام والضغط:** معالجة ترويسات `429 RATE_LIMITED` و `BUSINESS_RATE_LIMITED` و `503 API_BUSY` مع انتظار `Retry-After`.

---

## 🔑 جدول بيانات الاعتماد (`TassyirCredentialsSchema`)

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | نعم* | — | رمز Bearer لوصول واجهة Tassyir Admin API (يُقبل `apiKey` أيضاً للتوافق) |
| `baseUrl` | `string` | لا | `"https://api.tassyir.io/apps/2026-10"` | الرابط الأساسي لواجهة Tassyir REST API |
| `confirmOnModified` | `string` | لا | `"true"` | تأكيد الطلبية تلقائياً في تسيير عبر `/confirm` عند تعديل المقاس أو العنوان |
| `cancelOnRefused` | `string` | لا | `"true"` | إلغاء الطلبية عبر `/cancel` عند رفض الزبون للطلب خلال المكالمة |

---

## 💻 مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. التحقق من توقيع Webhook (معيار v1a Ed25519 أو HMAC)
const isValid = await provider.verifyWebhook(
  headers,
  rawBody,
  process.env.TASSYIR_WEBHOOK_PUBLIC_KEY!
);

// 2. تحليل الطلبية وتطبيع بيانات الدفع عند الاستلام الجزائرية
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تطبيق قرار المكالمة على واجهة تسيير 2026-10
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "تم تأكيد الطلبية عبر مكالمة الوكيل الصوتي ElevenAgents"
  },
  {
    accessToken: process.env.TASSYIR_ACCESS_TOKEN!,
    confirmOnModified: "true",
    cancelOnRefused: "true"
  }
);

console.log("نتيجة التعديل:", result.externalStatus); // "CONFIRMED"
```

</div>
