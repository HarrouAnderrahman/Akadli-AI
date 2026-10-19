**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/core

> المحرك الأساسي لربط وكلاء ElevenLabs الصوتيين الذكيين (ElevenAgents) بمحولات المتاجر الإلكترونية للطلبيات الجزائرية (COD).

تعمل حزمة `@akadli/core` كحلقة وصل خفيفة بين الطلبيات الواردة، وتجهيز متغيرات موجه الأوامر (Prompt) للوكيل الصوتي، ومعالجة قرارات إنهاء المكالمة وتحديث المتجر بدون تخزين حالات معقدة في السيرفر.

---

## الدوال المصدرة الأساسية

| الدالة | نوع الإرجاع | الوصف |
| :--- | :--- | :--- |
| `createStandardizedDzOrder(params)` | `StandardizedDzOrder` | إنشاء طلب قياسي بعد تطبيع الهاتف والولاية والبلدية وتحديد قيود التحقق الجغرافية |
| `buildElevenAgentsDynamicVariables(order)` | `ElevenAgentsDynamicVariables` | بناء متغيرات ElevenAgents الديناميكية (`price_da`، `allowed_sizes`، `allowed_wilayas`، إلخ) |
| `handleFinalizeOrderToolCall(payload, provider, creds, constraints)` | `Promise<FinalizeOrderToolResult>` | التحقق من صحة استدعاء أداة `finalize_order_decision` ومقارنتها بالقيود ثم استدعاء تحديث المتجر |

---

## مسار الربط مع ElevenAgents

</div>

<div dir="ltr" align="left">

```text
StandardizedDzOrder -> buildElevenAgentsDynamicVariables() -> ElevenLabs WebRTC Call -> finalize_order_decision Tool -> handleFinalizeOrderToolCall() -> Provider Mutation
```

</div>

<div dir="rtl" align="right">

---

## مثال تطبيقي

</div>

<div dir="ltr" align="left">

```typescript
import {
  createStandardizedDzOrder,
  buildElevenAgentsDynamicVariables,
  handleFinalizeOrderToolCall
} from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

// 1. إنشاء طلبية جزائرية موحدة
const order = createStandardizedDzOrder({
  orderId: "1001",
  storeName: "Algeria Store",
  customerName: "كريم زياني",
  rawCustomerPhone: "0550123456",
  itemName: "حذاء رياضي Air Max",
  priceDa: 4500,
  currentSize: "42",
  rawWilaya: "بريكة",
  rawCommune: "بريكة",
  allowedSizes: ["41", "42", "43"]
});

// 2. توليد المتغيرات الديناميكية للمكالمة الصوتية
const promptVariables = buildElevenAgentsDynamicVariables(order);

// 3. معالجة قرار أداة finalize_order_decision عند انتهاء المكالمة
const provider = new ShopifyProvider();
const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "CONFIRMED",
    reasonOrNotes: "تم التأكيد مع الزبون هاتفياً"
  },
  provider,
  {
    shopDomain: "store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints
);

console.log(result.success, result.externalStatus);
```

</div>

<div dir="rtl" align="right">

---

## التثبيت

</div>

<div dir="ltr" align="left">

```bash
pnpm add @akadli/core
```

</div>
