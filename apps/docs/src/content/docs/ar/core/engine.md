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
  customer_name: "أمين بلقاسم",
  customer_phone_e164: "+213550123456",
  customer_phone_local: "0550123456",
  store_name: "متجر الأحذية الرياضية",
  item_name: "حذاء رياضي Air Jordan 1",
  price_da: "12500",
  current_variant: "43",
  current_wilaya_code: "60",
  current_wilaya_name_fr: "Barika",
  current_wilaya_name_ar: "بريكة",
  current_commune: "Barika",
  current_address_note: "بجانب المسجد الكبير",
  allowed_variants: "42, 43, 44",
  allowed_wilayas: "01, 02, ..., 69",
  allowed_communes: "Barika, M'doukal, Bitam"
}
*/
```

### 3. `handleFinalizeOrderToolCall(payload, provider, creds, constraints)`

تستقبل وتدقق استدعاء الأداة من وكيل ElevenLabs في ختام المكالمة، وترفض أي تعديل على مقاس غير متوفر أو بلدية وهمية، ثم ترسل أمر التحديث إلى المتجر:

```typescript
import { handleFinalizeOrderToolCall } from "@akadli/core";
import { ShopifyProvider } from "@akadli/provider-shopify";

const provider = new ShopifyProvider();

const result = await handleFinalizeOrderToolCall(
  {
    orderId: "1001",
    status: "MODIFIED",
    finalVariant: "44", // طلب الزبون مقاساً أكبر
    finalCommune: "بريكة",
    reasonOrNotes: "طلب الزبون مقاس 44 بدلاً من 43"
  },
  provider,
  {
    shopDomain: "dz-store.myshopify.com",
    accessToken: "shpat_xxxxxxxx"
  },
  order.constraints // يتأكد من أن "44" موجود ضمن allowedVariants
);

console.log(result.success); // true
console.log(result.externalStatus); // "MODIFIED"
```

---

## تعريف الأداة في لوحة تحكم ElevenLabs

في لوحة ElevenLabs Conversational AI ضمن قسم **Tools** -> **Add Server Tool**:

- **اسم الأداة:** `finalize_order_decision`
- **الوصف:** `تسجيل قرار العميل بعد مكالمة تأكيد الطلبية (تأكيد أو رفض أو تعديل المقاس والعنوان).`
- **مخطط المعاملات (JSON Schema):**
  ```json
  {
    "type": "object",
    "properties": {
      "orderId": { "type": "string" },
      "status": { "type": "string", "enum": ["CONFIRMED", "REFUSED", "MODIFIED"] },
      "finalVariant": { "type": "string" },
      "finalWilaya": { "type": "string" },
      "finalCommune": { "type": "string" },
      "finalAddressNote": { "type": "string" },
      "reasonOrNotes": { "type": "string" }
    },
    "required": ["orderId", "status"]
  }
  ```
