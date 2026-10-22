---
title: بوابة وكلاء الذكاء الاصطناعي وتكامل llms.txt
description: تعليمات وقوالب التوجيه والقواعد المعمارية الثابتة لنماذج Cursor و Antigravity و Claude Code و Codex.
---

تم تصميم مشروع Akadli-AI من الصفر ليدعم العمل التشاركي مع وكلاء البرمجة بالذكاء الاصطناعي (Agentic AI) ويسهل قراءة الكود وفهمه آلياً.

يمكن لأي وكيل ذكاء اصطناعي (مثل Cursor أو Google Antigravity أو Claude Code أو GitHub Copilot) استيعاب كامل المنظومة والبدء في ربط المتاجر فورياً.

---

## روابط الاستكشاف الآلي (llms.txt)

يولد كل بناء لموقع التوثيق ملفين نصيين وفق معيار `llms.txt` العالمي:

| الملف | الرابط المباشر | الغرض |
| :--- | :--- | :--- |
| **`llms.txt`** | [`https://akadli.me/llms.txt`](/llms.txt) | ملخص معماري موجز، وخريطة الحزم، وروابط الصفحات الرسمية. |
| **`llms-full.txt`** | [`https://akadli.me/llms-full.txt`](/llms-full.txt) | السياق البرمجي الكامل لجميع الحزم ووثائق الـ API وقواعد الوكلاء في طلب HTTP واحد. |

---

## قالب التوجيه (Prompt) للوكلاء البرمجيين

انسخ هذه التعليمات في ملف قواعد الوكيل (`.cursorrules` أو إرشادات Antigravity):

```markdown
أنت تعمل على منظومة تأكيد طلبيات الدفع عند الاستلام الجزائرية Akadli-AI (https://akadli.me).
قبل تعديل أو كتابة أي كود، استورد السياق الكامل من https://akadli.me/llms-full.txt والتزم بالمعايير الصارمة التالية:

1. نطاق الحزم: جميع الحزم تتبع حصرياً نطاق `@akadli/*` (@akadli/adapter-contract و @akadli/dz-geo و @akadli/core و @akadli/provider-<name>). لا تستخدم إطلاقاً بادئة `@dz-voice/*`.
2. حظر التبعيات الزائدة: اعتمد حصرياً على دوال Node 20+ الأصلية (`fetch` و `node:crypto`). لا تقم أبداً بتثبيت `axios` أو `node-fetch` أو `moment`.
3. الجغرافيا 2026: طابق العناوين حصرياً مع التقسيم الإداري الجزائري الرسمي 2026 (69 ولاية من "01" إلى "69" و 1708 بلدية) عبر `@akadli/dz-geo`.
4. وسوم المتاجر الرسمية: استخدم حصرياً `akadli-confirmed` و `akadli-modified` و `akadli-refused` و `akadli-variant-{variant}`.
5. ملاحظات المتجر: يجب أن تبدأ الملاحظات التلقائية دائماً ببادئة `[Akadli-AI]`.
6. بوابة التحقق قبل التثبيت: تحقق دائماً من سلامة الكود قبل الحفظ عبر:
   pnpm turbo run build typecheck lint test
```

---

## الدليل المعماري للمستودع (`AGENTS.md`)

فيما يلي المواصفات المعمارية الإلزامية المطبقة عبر كامل المستودع:

### 1. حدود الحزم
- `packages/adapter-contract`: مخططات Zod وواجهات TypeScript نقية (`StandardizedDzOrder`, `FinalizedOrderDecision`, `IEcommerceProvider`) بدون أي منطق تشغيلي.
- `packages/dz-geo`: بيانات التقسيم الإداري الجزائري 2026 (**69 ولاية، 1708 بلدية**) وتطبيع هواتف `+213`.
- `packages/core`: محرك التنسيق الصوتي بدون حالة (`createStandardizedDzOrder`, `buildElevenAgentsDynamicVariables`, `handleFinalizeOrderToolCall`). ملاحظة: موجهات وأدوات ElevenLabs تُدار في لوحة ElevenLabs وليس في الكود المحلي.
- `packages/provider-<name>`: محولات المتاجر التي تطبق `IEcommerceProvider`. يتضمن كل محول:
  - ملف `docs/api-spec.md` ونماذج `fixtures/*.json`
  - ملفات `src/schemas.ts`, `src/<name>-client.ts`, `src/<name>-provider.ts`, `src/index.ts`
  - اختبارات شاملة `test/<name>-provider.test.ts` (Vitest + MSW تغطي كافة سيناريوهات التحقق والتعديل والرفض)
- `apps/akadli-playground`: بيئة الاختبار التفاعلية المحلية عبر WebRTC (`/admin` و `/phone`).

### 2. مهارات الوكلاء المتخصصة (`.agents/skills/`)
- `dz-monorepo-architect`: بنية Turborepo والمحرك الصوتي والعقود.
- `dz-ecommerce-provider-builder`: بناء وهيكلة محولات المتاجر و ERP.
- `dz-geo-address-normalizer`: معالجة وتطبيع عناوين الولايات الـ 69 والبلديات وهواتف الجزائر.
- `git-tdd-atomic-workflow`: بوابات التحقق والفحص والتثبيت المنظم.
