**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/core

> المحرك الأساسي لربط وكلاء ElevenLabs الصوتيين الذكيين (ElevenAgents) بمحولات المتاجر الإلكترونية للطلبيات الجزائرية (COD).

تعمل حزمة `@akadli/core` كحلقة وصل خفيفة بين الطلبيات الواردة، وتجهيز متغيرات موجه الأوامر (Prompt) للوكيل الصوتي، ومعالجة قرارات إنهاء المكالمة وتحديث المتجر بدون تخزين حالات معقدة في السيرفر.

---

## الدوال المصدرة الأساسية

| الدالة | نوع الإرجاع | الوصف |
| :--- | :--- | :--- |
| `createStandardizedDzOrder(params)` | `StandardizedDzOrder` | إنشاء طلب قياسي بعد تطبيع الهاتف والولاية والبلدية والكمية (`quantity`) وسعر التوصيل (`shippingFeeDa`) وتحديد قيود التحقق |
| `buildElevenAgentsDynamicVariables(order)` | `ElevenAgentsDynamicVariables` | بناء متغيرات ElevenAgents الديناميكية (`quantity`، `price_da`، `shipping_fee_da`، `subtotal_da`، `allowed_variants`، `allowed_wilayas`، `allowed_communes`) |
| `handleFinalizeOrderToolCall(payload, provider, creds, constraints?, order?)` | `Promise<FinalizeOrderToolResult>` | التحقق من صحة استدعاء أداة `finalize_order_decision` (بما فيها `finalQuantity` أو `final_quantity`) ومقارنتها بالقيود ثم استدعاء تحديث المتجر |
| `fetchElevenLabsConversationTranscript(conversationId, apiKey, baseUrl?)` | `Promise<ElevenLabsConversationTranscript>` | استرجاع النص الكامل للمحادثة الصوتية (STT) وتفاصيلها من ElevenLabs بدون تبعيات خارجية |
| `fetchElevenLabsConversationAudio(conversationId, apiKey, baseUrl?)` | `Promise<Uint8Array>` | تحميل التسجيل الصوتي للمكالمة بصيغة MP3 (`Uint8Array`) مباشرة من ElevenLabs |

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
  handleFinalizeOrderToolCall,
  fetchElevenLabsConversationTranscript,
  fetchElevenLabsConversationAudio
} from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

// 1. إنشاء طلبية جزائرية موحدة
const order = createStandardizedDzOrder({
  orderId: "1001",
  storeName: "Algeria Store",
  customerName: "كريم زياني",
  rawCustomerPhone: "0550123456",
  itemName: "حذاء رياضي Air Max",
  quantity: 2,
  priceDa: 4500,
  shippingFeeDa: 600,
  currentVariant: "42",
  rawWilaya: "بريكة",
  rawCommune: "بريكة",
  allowedVariants: ["41", "42", "43"]
});

// 2. توليد المتغيرات الديناميكية للمكالمة الصوتية (quantity, price_da, shipping_fee_da, subtotal_da)
const promptVariables = buildElevenAgentsDynamicVariables(order);

// 3. معالجة قرار أداة finalize_order_decision عند انتهاء المكالمة
const provider = new ShopifyProvider();
const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "MODIFIED",
    finalVariant: "43",
    finalQuantity: 2,
    reasonOrNotes: "تم التأكيد مع الزبون هاتفياً وتغيير المقاس إلى 43"
  },
  provider,
  {
    shopDomain: "store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints,
  order
);

// 4. اختياري: استرجاع نص المحادثة (STT) والتسجيل الصوتي (MP3) من ElevenLabs
const transcript = await fetchElevenLabsConversationTranscript(conversationId, process.env.ELEVENLABS_API_KEY!);
const mp3Bytes = await fetchElevenLabsConversationAudio(conversationId, process.env.ELEVENLABS_API_KEY!);

console.log(result.success, result.externalStatus, transcript.transcript.length, mp3Bytes.byteLength);
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
