---
title: العقود البرمجية
description: مخططات Zod وواجهات TypeScript التي تحدد معايير التكامل عبر منظومة Akadli-AI.
---

حزمة `@akadli/adapter-contract` هي حجر الأساس المعماري لمنظومة Akadli-AI، حيث تعرف النماذج القياسية للطلبيات، ومخططات التحقق (Validation Schemas)، والعقود البرمجية للمحولات.

الحزمة **خالية تماماً من أي تبعيات تشغيلية** باستثناء مكتبة Zod و TypeScript، مما يضمن خفة الوزن وثبات المعايير البرمجية عبر الخادم والعميل.

---

## التثبيت

```bash
pnpm add @akadli/adapter-contract
```

---

## 1. نموذج الطلبية القياسي الجزائري `StandardizedDzOrder`

النموذج الموحد الذي يتم تحويل كافة الطلبيات الواردة من المتاجر إليه:

```typescript
import { z } from "zod";
import { WilayaCodeSchema, DzPhoneSchema, OrderConstraintsSchema } from "@akadli/adapter-contract";

export const StandardizedDzOrderSchema = z.object({
  orderId: z.string().min(1),
  storeName: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: DzPhoneSchema, // صيغة محلية 05/06/07 أو دولية +213
  itemName: z.string().min(1),
  priceDa: z.number().nonnegative(),
  currentVariant: z.string().min(1), // مثل المقاس "42" أو "XL" أو اللون "أسود"
  currentWilaya: WilayaCodeSchema, // كود من خانتين "01" إلى "69"
  currentCommune: z.string().min(1),
  currentAddressNote: z.string().default(""),
  constraints: OrderConstraintsSchema
});

export type StandardizedDzOrder = z.infer<typeof StandardizedDzOrderSchema>;
```

### الحقول الأساسية وقواعد الثبات
- `currentVariant`: الحقل المعياري المعتمد لتمثيل متغير المنتج (المقاس، الحجم، اللون).
- `currentWilaya`: رمز الولاية المكون من رقمين (`01` إلى `69`) المطابق للتقسيم الإداري الرسمي 2026.
- `constraints`: حواجز الأمان (`allowedVariants` و `allowedWilayas` و `allowedCommunes`) التي تمنع وكيل الذكاء الاصطناعي من اقتراح مقاسات غير متوفرة في المخزون أو بلديات غير مدعومة.

---

## 2. قرار اعتماد الطلبية النهائي `FinalizedOrderDecision`

البيانات الصادرة من الوكيل الصوتي في نهاية المكالمة الهاتفية:

```typescript
export const OrderDecisionStatusSchema = z.enum([
  "CONFIRMED",
  "REFUSED",
  "MODIFIED"
]);

export const FinalizedOrderDecisionSchema = z
  .object({
    orderId: z.string().min(1),
    status: OrderDecisionStatusSchema,
    finalVariant: z.string().min(1).optional(),
    finalWilaya: WilayaCodeSchema.optional(),
    finalCommune: z.string().min(1).optional(),
    finalAddressNote: z.string().optional(),
    reasonOrNotes: z.string().default("")
  })
  .superRefine((decision, ctx) => {
    if (decision.status === "MODIFIED") {
      const hasModification =
        decision.finalVariant !== undefined ||
        decision.finalWilaya !== undefined ||
        decision.finalCommune !== undefined ||
        decision.finalAddressNote !== undefined;
      if (!hasModification) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'عندما تكون الحالة MODIFIED، يجب توفير واحد على الأقل من: finalVariant أو finalWilaya أو finalCommune أو finalAddressNote.'
        });
      }
    }
  });

export type FinalizedOrderDecision = z.infer<typeof FinalizedOrderDecisionSchema>;
```

---

## 3. واجهة المحول البرمجي `IEcommerceProvider`

الواجهة البرمجية الإلزامية التي يطبقها كل محول في `packages/provider-*`:

```typescript
export interface IEcommerceProvider {
  /**
   * التحقق المشفر من توقيع الـ Webhook الوارد باستخدام مقارنة آمنة زمنياً.
   */
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean>;

  /**
   * تحليل الطلبية الواردة ومطابقة بياناتها مع النموذج القياسي StandardizedDzOrder.
   */
  parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder>;

  /**
   * تنفيذ قرار العميل النهائي وتحديث المتجر أو ملف الإكسل أو نظام الـ ERP.
   */
  applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult>;
}
```
