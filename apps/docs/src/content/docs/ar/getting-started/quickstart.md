---
title: البدء السريع
description: خطوات ربط محرك تأكيد طلبيات الدفع عند الاستلام بالدارجة مع خادمك خطوة بخطوة.
---

يشرح هذا الدليل كيفية إعداد مسار عمل متكامل لتأكيد طلبيات الدفع عند الاستلام في الجزائر باستخدام بيئة Node 20+، و `@akadli/core`، و `@akadli/dz-geo`، وأحد محولات المتاجر مثل `@akadli/provider-shopify`.

## المتطلبات الأساسية

- بيئة تشغيل Node.js إصدار `20.0.0` أو أحدث (تعتمد الحزم على دوال `fetch` و `node:crypto` الأصلية).
- مدير الحزم pnpm أو npm.
- حساب في ElevenLabs مع وكيل محادثة صوتية مهيأ بالدارجة الجزائرية.
- بيانات الربط البرمجي لمتجرك (Shopify أو YouCan أو WooCommerce أو Tassyir).

---

## 1. تثبيت الحزم

قم بتثبيت المحرك الأساسي، وحزمة الجغرافيا والهاتف، ومحول المتجر المطلوب:

```bash
pnpm add @akadli/core @akadli/dz-geo @akadli/provider-shopify
```

---

## 2. ضبط المتغيرات البيئية

أنشئ ملف `.env` وضع فيه مفاتيح الاتصال:

```bash
# بيانات ElevenLabs للمحادثات الصوتية
ELEVENLABS_API_KEY=xi_...
ELEVENLABS_AGENT_ID=agent_...

# بيانات متجر شوبيفاي
SHOPIFY_SHOP_DOMAIN=my-dz-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...
SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret
```

---

## 3. استقبال إشعار الطلبية (Webhook Ingress)

أنشئ مساراً في Express أو Fastify أو Next.js لاستقبال إشعارات `orders/create`:

```typescript
import express from "express";
import { ShopifyProvider } from "@akadli/provider-shopify";
import { buildElevenAgentsDynamicVariables } from "@akadli/core";

const app = express();
const shopify = new ShopifyProvider();

// استقبال البيانات بصيغة Buffer للتحقق من التوقيع المشفر
app.post(
  "/api/webhooks/shopify",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const rawBody = req.body.toString("utf-8");
      const headers = req.headers as Record<string, string>;

      // 1. التحقق من توقيع HMAC المشفر لمنع التلاعب
      const isValid = await shopify.verifyWebhook(
        headers,
        rawBody,
        process.env.SHOPIFY_WEBHOOK_SECRET!
      );

      if (!isValid) {
        return res.status(401).send("Invalid HMAC signature");
      }

      // 2. تحليل الطلبية وفق التقسيم الجزائري 2026
      const order = await shopify.parseWebhookOrder(JSON.parse(rawBody));
      console.log(`تم استلام الطلب #${order.orderId} للزبون ${order.customerName} (ولاية ${order.currentWilaya})`);

      // 3. بناء المتغيرات الديناميكية للمكالمة الصوتية
      const dynamicVariables = buildElevenAgentsDynamicVariables(order);

      // الرد فوراً على شوبيفاي (يجب الرد برمز 200 خلال 5 ثوانٍ)
      res.status(200).send("Webhook received");

      // 4. بدء المكالمة الصوتية في الخلفية
      await startConfirmationCall(order, dynamicVariables);
    } catch (err) {
      console.error("خطأ أثناء معالجة الطلبية:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);
```

---

## 4. معالجة قرار أداة ElevenLabs النهائية

في لوحة ElevenLabs، قم بإضافة أداة باسم `finalize_order_decision` بالمعاملات التالية:
- `orderId` (string)
- `status` ("CONFIRMED" | "REFUSED" | "MODIFIED")
- `finalVariant` (string, اختياري)
- `finalWilaya` (string, اختياري)
- `finalCommune` (string, اختياري)
- `finalAddressNote` (string, اختياري)
- `reasonOrNotes` (string, اختياري)

عند انتهاء المكالمة، يستدعي الوكيل مسار الخادم لتنفيذ القرار:

```typescript
import { handleFinalizeOrderToolCall } from "@akadli/core";

app.post("/api/elevenlabs/finalize", express.json(), async (req, res) => {
  const toolPayload = req.body; // { orderId: "1001", status: "CONFIRMED", ... }
  const orderConstraints = await lookupOrderConstraints(toolPayload.orderId);

  const result = await handleFinalizeOrderToolCall(
    toolPayload,
    shopify,
    {
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
    },
    orderConstraints
  );

  res.json({
    success: result.success,
    externalStatus: result.externalStatus
  });
});
```

---

## 5. التحقق من النتيجة في لوحة المتجر

بعد تنفيذ القرار، ستشاهد في لوحة إدارة شوبيفاي:
- **الوسوم (Tags):** `akadli-confirmed` أو (`akadli-modified` و `akadli-variant-42`) أو `akadli-refused`.
- **الملاحظات (Notes):** ملاحظة تبدأ بـ `[Akadli-AI]` توضح تفاصيل المكالمة وسبب التعديل أو الرفض.
- **تحديث العنوان والمنتج:** يتم تعديل البلدية والولاية والمقاس مباشرة إذا اختار المشتري التعديل (`MODIFIED`).
