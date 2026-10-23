**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)** • [https://akadli.me](https://akadli.me)

<div dir="rtl" align="right">

# Akadli-AI (`@akadli/*`)

> محرك مفتوح المصدر لتأكيد طلبيات الدفع عند الاستلام (COD) صوتياً ومحولات ربط المتاجر الإلكترونية في الجزائر.

يقوم **Akadli-AI** بأتمتة مكالمات تأكيد طلبيات الدفع عند الاستلام (COD) بعد إتمام الطلب بالدارجة الجزائرية عبر ElevenAgents (باستخدام روابط WebRTC / SIP / WhatsApp)، مع التحقق من صحة العناوين وتطبيعها وفق **التقسيم الإداري الجزائري الجديد 2026 (69 ولاية و 1708 بلدية)**، وتحديث بيانات وحالات الطلبات مباشرة عبر المتاجر: Shopify، YouCan، WooCommerce، Google Sheets و Tassyir.

---

## مسار العمل المتكامل (End-to-End Lifecycle)

</div>

<div dir="ltr" align="left">

```text
Store Webhook -> @akadli/provider-* (Verify & Parse) -> @akadli/dz-geo (69 Wilayas) -> @akadli/core (Darja Voice Call) -> applyOrderDecision() (Live Store Update)
```

</div>

<div dir="rtl" align="right">

---

## حزم المستودع (Monorepo Packages)

| الحزمة | النطاق | الوصف |
| :--- | :--- | :--- |
| [`@akadli/adapter-contract`](./packages/adapter-contract) | العقود البرمجية | مخططات Zod نقية وواجهة `IEcommerceProvider` بدون تبعيات تشغيلية خارجية |
| [`@akadli/dz-geo`](./packages/dz-geo) | الجغرافيا / الهاتف | التقسيم الإداري الجزائري 2026 (69 ولاية و 1708 بلدية) ومعالج أرقام الهاتف `+213` |
| [`@akadli/core`](./packages/core) | المحرك الأساسي | منشئ المتغيرات الديناميكية لـ ElevenAgents ومنسق استدعاءات `handleFinalizeOrderToolCall` |
| [`@akadli/provider-shopify`](./packages/provider-shopify) | محول المتجر | التحقق من توقيع HMAC لـ Shopify، معالجة غياب حقل الولاية، وتبادل OAuth `client_credentials` وتحديثات REST |
| [`@akadli/provider-youcan`](./packages/provider-youcan) | محول المتجر | التحقق من Webhook لـ YouCan `.shop`، واستخراج حقول COD أحادية الصفحة وتحديث وحفظ الطلبات |
| [`@akadli/provider-woocommerce`](./packages/provider-woocommerce) | محول المتجر | واجهة WooCommerce REST v3 وتطبيع رموز الولايات `DZ-XX` وحقول `meta_data` لإضافات COD |
| [`@akadli/provider-gsheets`](./packages/provider-gsheets) | محول الجداول | جسر Google Sheets v4 و Apps Script الشامل لمتاجر SetShop و JustSell و Foorweb وصفحات الهبوط |
| [`@akadli/provider-tassyir`](./packages/provider-tassyir) | محول / ERP | نظام Tassyir الجزائري لإدارة COD وتوزيع الشحنات ثنائي المراحل (Yalidine / Ecotrack / ZR) |

---

## مثال برمجي في 30 ثانية (TypeScript)

</div>

<div dir="ltr" align="left">

```typescript
import { ShopifyProvider } from "@akadli/provider-shopify";
import { handleFinalizeOrderToolCall, buildElevenAgentsDynamicVariables } from "@akadli/core";

const provider = new ShopifyProvider();

// 1. التحقق من توقيع Webhook وتحليل الطلبية وفق النموذج الجزائري القياسي
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.SHOPIFY_WEBHOOK_SECRET!);
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 2. حقن المتغيرات الديناميكية في ElevenAgents لبدء المكالمة الصوتية بالدارجة
const promptVars = buildElevenAgentsDynamicVariables(order);

// 3. معالجة قرار أداة finalize_order_decision وتحديث المتجر مباشرة
const result = await handleFinalizeOrderToolCall(
  agentToolPayload, // مثلاً: { orderId: order.orderId, status: "CONFIRMED" }
  provider,
  {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
  },
  order.constraints
);
```

</div>

<div dir="rtl" align="right">

---

## بيئة الاختبار التفاعلية (`@akadli/playground`)

لاختبار المكالمات الصوتية الحية عبر شبكة Wi-Fi المحلية بصوت WebRTC:

</div>

<div dir="ltr" align="left">

```bash
git clone https://github.com/HarrouAnderrahman/Akadli-AI.git
pnpm install
pnpm build
pnpm --filter @akadli/playground dev
```

</div>

<div dir="rtl" align="right">

- افتح `https://localhost:3000/admin` لإرسال الطلبيات ومعاينة البيانات ومحاكاة الاتصال واختبار استلام الـ Webhooks.
- افتح `https://localhost:3000/phone` على هاتفك الذكي لاستقبال المكالمة الصوتية كمشتري.
- للاطلاع على خطوات ربط متجر تجريبي مباشر عبر لوحة مطوري Shopify (`dev.shopify.com`) ونفق Cloudflare، راجع [`packages/provider-shopify/README.md`](./packages/provider-shopify/README.md).

---

## للوكلاء البرمجيين (AI Coding Agents)

يُرجى مراجعة [`./AGENTS.md`](./AGENTS.md) ومجلد [`.agents/skills/`](./.agents/skills/) قبل إجراء أي تعديل برمجي:
- الحفاظ على حدود حزم `@akadli/*` والاعتماد حصرياً على دوال Node.js الأصلية بدون مكاتب زائدة.
- الالتزام بتقسيم 2026 الإداري (`01`-`69`) والوسوم المعتمدة (`akadli-confirmed`، `akadli-modified`، `akadli-refused`).
- تنفيذ بوابة التحقق الإلزامية قبل التثبيت: `pnpm turbo run build typecheck lint test`.

---

## الترخيص (License)

رخصة [MIT](./LICENSE) مفتوحة المصدر.

</div>
