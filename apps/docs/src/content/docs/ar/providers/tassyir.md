---
title: محول تسيير (@akadli/provider-tassyir)
description: محول واجهة Tassyir Admin API (إصدار 2026-10) ونظام التحقق Ed25519 بدون مفاتيح سرية ومسار تثبيت OAuth.
---

تربط حزمة `@akadli/provider-tassyir` نظام **تسيير (Tassyir)** (`api.tassyir.io`)، المنصة الرائدة في الجزائر لإدارة طلبيات الدفع عند الاستلام (COD) وتوزيع الشحنات مع شركات التوصيل (Yalidine و Ecotrack و ZR Express)، بمحرك Akadli-AI للمكالمات الصوتية.

تعتمد الحزمة مواصفات واجهة **Tassyir Admin API (`2026-10`)** الرسمية، والتحقق بالمفتاح العام عبر معيار **Standard Webhooks (`v1a` Ed25519)** بدون مفاتيح سرية متغيرة، ومسار OAuth عبر رمز التثبيت `tsy_ic_...`.

---

## التثبيت

```bash
pnpm add @akadli/provider-tassyir
```

---

## إعداد تطبيق تسيير (`tassyir.app.toml`)

عند إنشاء تطبيق خارجي في منصة مطوري تسيير ([developers.tassyir.io](https://developers.tassyir.io))، قم بتهيئة ملف `tassyir.app.toml`:

```toml
[app]
name = "Akadli-AI Voice Confirmation"
handle = "akadli-ai"
client_id = "app_..."

[auth]
callback_url = "https://your-domain.com/api/webhooks/tassyir/callback"
scopes = [
  "read_orders",
  "write_orders",
  "read_customer_contact",
  "read_products"
]

[webhooks]
url = "https://your-domain.com/api/webhooks/tassyir"
events = [
  "orders/created"
]
```

### الصلاحيات المطلوبة (Scopes)
- `read_orders`: قراءة الطلبيات الواردة، وإجمالي المبالغ، والمنتجات.
- `write_orders`: تحديث الملاحظات، وتأكيد الطلبيات (`/confirm`)، وإلغائها (`/cancel`).
- `read_customer_contact`: **إلزامية للمكالمات الصوتية.** بدون هذه الصلاحية (أو عند استنفاد حصة باقة التاجر)، يحجب نظام تسيير رقم الهاتف كـ `"**********"` وتدخل الطلبية في حالة `waiting: true`. تفحص الحزمة هذا الشرط تلقائياً وتمنع الأخطاء المبهمة.
- `read_products`: يُنصح بها لجلب مقاسات وخيارات المنتج البديلة من مسار `GET /products/{productId}`.

---

## التحقق المشفر بالمعيار القياسي (v1a Ed25519 Zero-Secret)

يوقع نظام تسيير كافة إشعارات الـ Webhooks بموجب معيار **Standard Webhooks (`v1a` Ed25519)**، ولا يمنح المتجر "سراً مشتركاً"، بل يعتمد مفاتيح عامة:

1. ترويسات الإشعار الوارد:
   - `webhook-id`: معرف الرسالة الفريد (مثل `msg_741...`).
   - `webhook-timestamp`: الختم الزمني بالثواني (مهلة الحماية من إعادة الإرسال 5 دقائق).
   - `webhook-signature`: التوقيع بصيغة `v1a,<base64_ed25519_signature>`.
2. يتم جلب المفاتيح العامة (`whpk_<base64_raw_key>`) مباشرة من `https://api.tassyir.io/apps/webhook-keys` (مع تخزين مؤقت لساعة واحدة).
3. تفك الحزمة المفتاح العام عبر دالة `crypto.createPublicKey` الأصلية في Node.js باستخدام بادئة SPKI DER القياسية (`302a300506032b6570032100`).

---

## مسار التثبيت عبر كود OAuth (`tsy_ic_...`)

1. عند تثبيت التاجر للتطبيق في حسابه بتسيير، يتم توجيهه إلى رابط الـ `callback_url` لديك مع كود تثبيت:
   ```text
   GET /api/webhooks/tassyir/callback?code=tsy_ic_...
   ```
2. يستبدل خادمك الكود `tsy_ic_...` برمز وصول دائم عبر `POST https://api.tassyir.io/apps/oauth/token`:
   - **الترويسة:** `Authorization: Basic base64(client_id:client_secret)`
   - **الترويسة:** `Content-Type: application/x-www-form-urlencoded`
   - **البيانات:** `grant_type=authorization_code&code=tsy_ic_...`
   - **الرد:**
     ```json
     {
       "access_token": "tsy_at_...",
       "refresh_token": "tsy_rt_...",
       "expires_in": 3600,
       "token_type": "Bearer"
     }
     ```

---

## أدوات سطر الأوامر (CLI)

توفر تسيير أداة سطر أوامر رسمية لاختبار الـ Webhooks وتطوير التطبيقات محلياً:

```bash
npx tassyir@latest app dev
```

---

## بيانات الاعتماد المطلوبة

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `accessToken` | `string` | اختياري* | — | رمز وصول Bearer مباشر (`tsy_at_...`) |
| `clientId` | `string` | اختياري* | — | معرف التطبيق (`app_...`) |
| `clientSecret` | `string` | اختياري* | — | المفتاح السري للتطبيق (`tsy_cs_...`) |
| `refreshToken` | `string` | اختياري | — | رمز التحديث التلقائي (`tsy_rt_...`) |
| `baseUrl` | `string` | لا | `"https://api.tassyir.io/apps/2026-10"` | الرابط الأساسي لواجهة Admin API |
| `confirmOnModified` | `string` | لا | `"true"` | تأكيد الطلبية بعد تعديل المقاس أو العنوان |
| `cancelOnRefused` | `string` | لا | `"true"` | إلغاء الطلبية عند رفض الزبون |

---

## مثال برمجي

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. التحقق بالمفتاح العام Ed25519 بدون مفتاح سري مشترك
const isValid = await provider.verifyWebhook(headers, rawBody);

if (!isValid) {
  throw new Error("Invalid Tassyir Ed25519 signature");
}

// 2. تحليل مغلف الطلبية وتطبيع العنوان لتقسيم الـ 69 ولاية
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تحديث الطلبية في تسيير مع مفتاح التكرار Idempotency-Key
const result = await provider.applyOrderDecision(
  order.orderId,
  {
    orderId: order.orderId,
    status: "CONFIRMED",
    reasonOrNotes: "تم تأكيد الطلبية صوتياً بالدارجة"
  },
  {
    clientId: process.env.TASSYIR_CLIENT_ID!,
    clientSecret: process.env.TASSYIR_CLIENT_SECRET!,
    refreshToken: process.env.TASSYIR_REFRESH_TOKEN!
  }
);
```
