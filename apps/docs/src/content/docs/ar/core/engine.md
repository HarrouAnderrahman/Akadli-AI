---
title: المحرك الصوتي
description: محرك التنسيق بدون حالة (Stateless) لربط وكلاء ElevenLabs بمحولات المتاجر الإلكترونية.
---

حزمة `@akadli/core` هي حلقة الوصل المحورية التي تربط بين بيانات الطلبيات في المتاجر، وبناء التعليمات الذكية لوكلاء ElevenLabs بالدارجة الجزائرية، وتنفيذ قرارات التعديل أو التأكيد بعد انتهاء المكالمة.

تم تصميم المحرك ليعمل **بدون حالة (Stateless)** تماماً، مما يتيح استضافته على خدمات Serverless (مثل AWS Lambda أو Vercel) أو حاويات Docker مع التوسع الأفقي العالي.

---

## التثبيت

```bash
pnpm add @akadli/core
```

---

## الدوال الرئيسية

### 1. `createStandardizedDzOrder(params)`

تقوم بإنشاء كائن طلبية موحد ومتحقق منه `StandardizedDzOrder`. وتقوم بتطبيع أرقام الهواتف والولايات والبلديات عبر `@akadli/dz-geo` وضبط قيود الأمان:

```typescript
import { createStandardizedDzOrder } from "@akadli/core";

const order = createStandardizedDzOrder({
  orderId: "1001",
  storeName: "متجر الأحذية الرياضية",
  customerName: "أمين بلقاسم",
  rawCustomerPhone: "0550123456",
  itemName: "حذاء رياضي Air Jordan 1",
  quantity: 1,
  shippingFeeDa: 600,
  priceDa: 12500,
  currentVariant: "43",
  rawWilaya: "بريكة",
  rawCommune: "بريكة",
  currentAddressNote: "بجانب المسجد الكبير",
  allowedVariants: ["42", "43", "44"] // خيارات المقاسات المتوفرة في المخزون
});
```

### 2. `buildElevenAgentsDynamicVariables(order)`

تنشئ كائن المتغيرات الديناميكية الموجه إلى جلسة ElevenLabs. وتنسق الأسعار والمناطق الجغرافية لنطق سليم ومفهوم بالدارجة الجزائرية:

```typescript
import { buildElevenAgentsDynamicVariables } from "@akadli/core";

const dynamicVariables = buildElevenAgentsDynamicVariables(order);
/*
النتيجة:
{
  order_id: "1001",
  store_name: "متجر الأحذية الرياضية",
  customer_name: "أمين بلقاسم",
  customer_phone_e164: "+213550123456",
  item_name: "حذاء رياضي Air Jordan 1",
  quantity: "1",
  shipping_fee_da: "600",
  subtotal_da: "11900",
  price_da: "12500",
  current_variant: "43",
  current_wilaya: "60",
  current_commune: "Barika",
  current_address_note: "بجانب المسجد الكبير",
  allowed_variants: "42, 43, 44",
  allowed_wilayas: "01, 02, ..., 69",
  allowed_communes: "Barika, M'doukal, Bitam"
}
*/
```

### 3. `handleFinalizeOrderToolCall(payload, provider, creds, constraints?, order?)`

تستقبل وتدقق استدعاء الأداة من وكيل ElevenLabs في ختام المكالمة، وتستخرج الكمية النهائية `finalQuantity` (من `finalQuantity ?? final_quantity ?? quantity ?? order.quantity ?? 1`)، وترفض أي تعديل على مقاس غير متوفر أو بلدية وهمية، ثم ترسل أمر التحديث إلى المتجر:

```typescript
import { handleFinalizeOrderToolCall } from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "MODIFIED",
    finalVariant: "44", // طلب الزبون مقاساً أكبر
    finalQuantity: 1,
    finalCommune: "بريكة",
    reasonOrNotes: "طلب الزبون مقاس 44 بدلاً من 43"
  },
  provider,
  {
    shopDomain: "dz-store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints, // يتأكد من أن "44" موجود ضمن allowedVariants
  order
);

console.log(result.success); // true
console.log(result.externalStatus); // "MODIFIED"
```

### 4. `fetchElevenLabsConversationTranscript` و `fetchElevenLabsConversationAudio`

دوال مساعدة بدون أي تبعيات خارجية لاسترجاع النص الكامل للمحادثة الصوتية (STT) وتحميل التسجيل الصوتي للمكالمة بصيغة MP3 (`Uint8Array`) من ElevenLabs بعد انتهاء المكالمة:

```typescript
import {
  fetchElevenLabsConversationTranscript,
  fetchElevenLabsConversationAudio
} from "@akadli/core";

// 1. جلب نص الحوار الكامل (STT) وحالة المكالمة ومدتها الزمنية
const transcript = await fetchElevenLabsConversationTranscript(
  conversationId,
  process.env.ELEVENLABS_API_KEY!
);

// 2. تحميل التسجيل الصوتي للمكالمة بصيغة MP3 (Uint8Array)
const mp3Bytes = await fetchElevenLabsConversationAudio(
  conversationId,
  process.env.ELEVENLABS_API_KEY!
);
```

---

## تعريف الأداة في لوحة تحكم ElevenLabs

في لوحة ElevenLabs Conversational AI ضمن قسم **Tools** -> **Add Server Tool**:

- **اسم الأداة:** `finalize_order_decision`
- **الوصف:** `تسجيل قرار العميل بعد مكالمة تأكيد الطلبية (تأكيد أو رفض أو تعديل المقاس والكمية والعنوان).`
- **مخطط المعاملات (JSON Schema):**
  ```json
  {
    "type": "object",
    "properties": {
      "orderId": { "type": "string" },
      "status": { "type": "string", "enum": ["CONFIRMED", "REFUSED", "MODIFIED"] },
      "finalQuantity": { "type": "integer", "minimum": 1 },
      "finalVariant": { "type": "string" },
      "finalWilaya": { "type": "string" },
      "finalCommune": { "type": "string" },
      "finalAddressNote": { "type": "string" },
      "reasonOrNotes": { "type": "string" }
    },
    "required": ["orderId", "status"]
  }
  ```
