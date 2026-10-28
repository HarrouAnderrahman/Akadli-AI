**[English](./README.md) | [العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-tassyir

> محول نظام تسيير الرسمي (Tassyir Admin API 2026-10) مع التحقق المعياري من Webhooks عبر المفاتيح العامة (معيار v1a Ed25519 بدون أسرار)، ونظام المصادقة للتطبيقات الخارجية عبر رمز التثبيت (tsy_ic_...) والمصادقة الأساسية HTTP Basic Auth، وتأكيد الطلبيات بدون تكرار (Idempotency-Key)، وتطبيع عناوين الدفع عند الاستلام في الجزائر (69 ولاية).

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract` للتكامل المباشر مع منصة **تسيير** (`api.tassyir.io`) لمتاجر التجارة الإلكترونية ومراكز التوصيل في الجزائر.

---

## إعداد ملف التطبيق في تسيير (tassyir.app.toml)

عند بناء تطبيق خارجي في منصة مطوري تسيير (`developers.tassyir.io`)، يتم ضبط إعدادات التطبيق عبر ملف `tassyir.app.toml`:

</div>

<div dir="ltr" align="left">

```toml
name        = "Akadli"
handle      = "akadli"
api_version = "2026-10"

[access]
scopes = ["read_orders", "write_orders", "read_customer_contact", "read_products"]

[access.scope_reasons]
read_orders = "Read incoming COD orders for voice confirmation"
write_orders = "Confirm, modify, or cancel COD orders after voice call"
read_customer_contact = "Read buyer phone and address for confirmation call"
read_products = "Allows the adapter to fetch alternative sizes/variants"

[auth]
callback_url = "https://your-domain.com/api/webhooks/tassyir/callback"

[[webhooks]]
topics = ["orders/created"]
uri    = "/api/webhooks/tassyir"

[hosting]
mode = "external"
url  = "https://your-domain.com"
```

</div>

<div dir="rtl" align="right">

### الصلاحيات المطلوبة للتطبيق (App Scopes)
- `read_orders`: قراءة تفاصيل الطلبيات الواردة وبيانات الزبون وعناوين الشحن.
- `write_orders`: تعديل ملاحظات الطلبيات، وتأكيدها (`/confirm`) أو إلغائها (`/cancel`).
- `read_customer_contact`: **إلزامية للتأكيد الصوتي.** في حال عدم منح هذه الصلاحية (أو تجاوز باقة المتجر)، يتم حجب رقم هاتف الزبون كـ `"**********"` وتدخل الطلبية في حالة الانتظار `waiting: true`.

---

## بنية المصادقة ورمز التثبيت (OAuth Install Flow)

لا تعتمد تطبيقات تسيير الخارجية على مفاتيح سرية ثابتة للويب هوك، بل تستخدم نظام OAuth 2.0 عبر الخطوات التالية:

1. **تثبيت التطبيق:** عند قيام التاجر بتثبيت التطبيق على متجره، يتم توجيه المتصفح إلى رابط إعادة التوجيه `callback_url` مرفقاً برمز التثبيت:
   ```text
   GET https://<tunnel>/api/webhooks/tassyir/callback?code=tsy_ic_...
   ```
2. **استبدال رمز التثبيت:** يقوم الخادم باستبدال `tsy_ic_...` عبر `POST https://api.tassyir.io/apps/oauth/token`:
   - ترويسة المصادقة: `Authorization: Basic base64(client_id:client_secret)`
   - نوع المحتوى: `Content-Type: application/x-www-form-urlencoded`
   - نص الطلب: `grant_type=authorization_code&code=tsy_ic_...` (ملاحظة: لا يُرسل `client_secret` في نص الطلب أبداً).
   - النتيجة:
     ```json
     {
       "access_token": "tsy_at_...",
       "refresh_token": "tsy_rt_...",
       "expires_in": 3600,
       "token_type": "Bearer",
       "installation_id": "inst_..."
     }
     ```
3. **تجديد رمز الوصول:** عند انتهاء صلاحية الرمز، يتم تجديده تلقائياً بإرسال `grant_type=refresh_token&refresh_token=tsy_rt_...`.

---

## التحقق من Webhooks المعيارية بدون أسرار (Public Key Ed25519)

توقع منصة تسيير إشعارات الويب باستخدام معيار **Standard Webhooks (`v1a` Ed25519)**. لا توفر المنصة سراً مشتركاً (Webhook Secret)، بل تنشر المفاتيح العامة على الرابط:
```text
GET https://api.tassyir.io/apps/webhook-keys
```
يقوم المحول بفك تشفير المفتاح العام المكون من 32 بايت (`whpk_<base64>`) باستخدام بادئة ASN.1 SPKI DER القياسية المكونة من 12 بايت (`302a300506032b6570032100` بالنظام الست عشري) وتحويله إلى كائن مفتاح عام `crypto.KeyObject` دون الحاجة لأي مكتبات خارجية. ويتم تخزين المفاتيح العامة في الذاكرة لمدة ساعة كاملة مع مفتاح احتياطي مدمج.

---

## جدول بيانات الاعتماد (TassyirCredentialsSchema)

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | اختياري* | — | رمز الوصول المباشر من تسيير (`tsy_at_...`) |
| `clientId` | `string` | اختياري* | — | معرف التطبيق (`app_...`) من لوحة تحكم المطورين |
| `clientSecret` | `string` | اختياري* | — | الرمز السري للتطبيق (`tsy_cs_...`) |
| `refreshToken` | `string` | اختياري | — | رمز التجديد (`tsy_rt_...`) للتجديد التلقائي |
| `baseUrl` | `string` | لا | `"https://api.tassyir.io/apps/2026-10"` | الرابط الأساسي لواجهة تسيير |
| `confirmOnModified` | `string` | لا | `"true"` | تأكيد الطلبية تلقائياً عبر `/confirm` عند تعديل المقاس أو العنوان |
| `cancelOnRefused` | `string` | لا | `"true"` | إلغاء الطلبية عبر `/cancel` عند رفض الزبون للطلب |

\* يجب توفير إما `accessToken` أو (`clientId` و `clientSecret`).

---

## مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. التحقق من توقيع الويب هوك باستخدام المفاتيح العامة المعيارية
const isValid = await provider.verifyWebhook(headers, rawBody);
if (!isValid) {
  throw new Error("Invalid Tassyir Ed25519 signature");
}

// 2. تحليل وتطبيع بيانات الطلبية للدفع عند الاستلام في الجزائر (بما فيها items[].quantity و shippingPrice)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تطبيق قرار المكالمة على واجهة تسيير (تتضمن الملاحظات akadli-confirmed / akadli-modified / akadli-qty-{qty})
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    finalQuantity: order.quantity,
    reasonOrNotes: "تم تأكيد الطلبية عبر مكالمة صوتية",
  },
  {
    clientId: process.env.TASSYIR_CLIENT_ID!,
    clientSecret: process.env.TASSYIR_CLIENT_SECRET!,
    refreshToken: process.env.TASSYIR_REFRESH_TOKEN!,
  }
);
```

</div>
