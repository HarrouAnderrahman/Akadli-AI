**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/provider-shopify

> محول Shopify لتأكيد طلبيات الدفع عند الاستلام (COD) في الجزائر مع تطبيع عناوين 2026 والتحقق من توقيع HMAC-SHA256 وتحديث الطلبات عبر REST API.

ينفذ واجهة `IEcommerceProvider` من حزمة `@akadli/adapter-contract` لمتاجر Shopify سواء باستخدام صفحة الدفع القياسية أو تطبيقات COD الجزائرية (مثل EasySell و Releasit و CodForm).

---

## دليل إعداد تطبيق Shopify في لوحة المطورين 2026

1. **إنشاء التطبيق:** ادخل إلى [dev.shopify.com](https://dev.shopify.com) ثم **Apps** ثم **Create an App**.
   - عنوان التطبيق (App URL): ضع `https://example.com` (واترك خيار **Embed app in Shopify admin** **غير مفعّل**).
   - الصلاحيات: من قسم **API access**، امنح صلاحيات `read_orders` و `write_orders`.
2. **تفعيل الوصول إلى بيانات العملاء المحمية (ضروري جداً):**
   - من قسم **Protected customer data access**، اضغط **Manage** وفعّل الخيار.
   - حدد كل من: **Name** و **Address** و **Phone**.
   - *بدون هذه الخطوة، تقوم Shopify بإخفاء بيانات العميل من الـ Webhook وتمنع تحديث عنوان الشحن.*
3. **ضبط الـ Webhook:**
   - من لوحة تحكم المتجر -> **Settings** -> **Notifications** -> **Webhooks**، أنشئ Webhook للحدث `Order creation` بصيغة JSON موجهاً إلى `/api/webhooks/shopify`.
4. **معالجة غياب حقل الولاية (`province: null`):**
   - تخفي Shopify قائمة الولايات في الجزائر؛ يكتب الزبائن ولاياتهم في حقول `city` أو `address1` أو الرمز البريدي `zip` (`13000` تشير للولاية `13`)، أو داخل `note_attributes`. تستخرج الحزمة العنوان وتطبقه بدقة وفق تقسيم 2026 عبر `@akadli/dz-geo`.

---

## جدول بيانات الاعتماد (`ShopifyCredentialsSchema`)

| الحقل | النوع | إلزامي | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `shopDomain` | `string` | نعم | — | نطاق المتجر (مثال: `store.myshopify.com`) |
| `accessToken` | `string` | اختياري* | — | رمز وصول دائم للـ Admin API (`shpat_...`) |
| `clientId` | `string` | اختياري* | — | معرف عميل OAuth (يتم استبداله تلقائياً برمز وصول) |
| `clientSecret` | `string` | اختياري* | — | المفتاح السري لعميل OAuth |
| `apiVersion` | `string` | لا | `"2024-04"` | إصدار واجهة برمجة تطبيقات Shopify Admin REST |
| `cancelOnRefused` | `string` | لا | `"true"` | إلغاء الطلبية تلقائياً وإعادة المخزون عند الرفض |

*\*يجب توفير `accessToken` أو كل من `clientId` و `clientSecret` معاً.*

---

## مثال تطبيقي في TypeScript

</div>

<div dir="ltr" align="left">

```typescript
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

// 1. التحقق من توقيع HMAC-SHA256 (Base64)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.SHOPIFY_WEBHOOK_SECRET!);

// 2. تحليل الطلبية الجزائرية الموحدة وتطبيع العنوان
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. تطبيق قرار المكالمة (الوسوم: akadli-confirmed / akadli-modified / akadli-refused)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "تم تأكيد الطلبية عبر المكالمة الصوتية"
}, {
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
});
```

</div>
