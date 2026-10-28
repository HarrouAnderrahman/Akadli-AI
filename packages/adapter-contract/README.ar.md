**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/adapter-contract

> مخططات Zod وواجهات TypeScript القياسية بدون أي تبعيات لتنظيم تدفقات الدفع عند الاستلام (COD) والتأكيد الصوتي في الجزائر.

تحدد حزمة `@akadli/adapter-contract` العقود البرمجية الموحدة التي تنفذها جميع محولات المتاجر (`@akadli/provider-*`) ويعتمد عليها محرك التأكيد الصوتي (`@akadli/core`).

---

## المخططات والعقود المصدرة

| المخطط / الواجهة | النوع | الوصف |
| :--- | :--- | :--- |
| `StandardizedDzOrderSchema` | `StandardizedDzOrder` | نموذج الطلبية الموحد بعد استخراجه وتطبيعه من أي متجر (`quantity` افتراضياً `1`، `shippingFeeDa` افتراضياً `0`، `priceDa` الإجمالي) |
| `FinalizedOrderDecisionSchema` | `FinalizedOrderDecision` | هيكل قرار ElevenAgents النهائي (`CONFIRMED`, `REFUSED`, `MODIFIED`, `finalVariant`, `finalQuantity` افتراضياً `1`, `finalWilaya`, `finalCommune`) |
| `OrderConstraintsSchema` | `OrderConstraints` | قيود منع الهلوسة الصوتية (`allowedVariants`, `allowedWilayas`, `allowedCommunes`) |
| `OrderDecisionStatusSchema` | `OrderDecisionStatus` | قيم الحالات المسموحة: `"CONFIRMED" \| "REFUSED" \| "MODIFIED"` |
| `WilayaCodeSchema` | `WilayaCode` | رموز الولايات الجزائرية الرسمية من خانتين (`"01"` إلى `"69"`) |
| `DzPhoneSchema` | `string` | التحقق من أرقام الهاتف الجزائري محلياً `05/06/07XXXXXXXX` أو دولياً `+213[567]XXXXXXXX` |
| `IEcommerceProvider` | `interface` | الواجهة الأساسية للتحقق من Webhook واستخراج الطلب وتحديث المتجر |
| `ApplyOrderDecisionResult` | `interface` | النتيجة الموحدة لتحديث المتجر `{ success, externalStatus, rawResponse }` |

---

## مثال على تنفيذ محول مخصص (Custom Provider)

</div>

<div dir="ltr" align="left">

```typescript
import {
  IEcommerceProvider,
  StandardizedDzOrder,
  FinalizedOrderDecision,
  ApplyOrderDecisionResult
} from "@akadli/adapter-contract";

export class CustomStoreProvider implements IEcommerceProvider {
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    // مقارنة آمنة للتوكن أو التوقيع
    return headers["x-webhook-token"] === secret;
  }

  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    // تطبيع الطلبية إلى StandardizedDzOrder باستخدام @akadli/dz-geo
    return payload as StandardizedDzOrder;
  }

  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    // تحديث حالة الطلبية في المتجر حسب القرار (CONFIRMED / MODIFIED / REFUSED)
    return { success: true, externalStatus: decision.status };
  }
}
```

</div>

<div dir="rtl" align="right">

---

## التثبيت

</div>

<div dir="ltr" align="left">

```bash
pnpm add @akadli/adapter-contract
```

</div>
