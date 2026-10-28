**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/playground

> بيئة اختبار تفاعلية محلية تحاكي استقبال المكالمات الصوتية عبر الهاتف الذكي بتقنية WebRTC وبث صوتي بالدارجة، مع مركز تحكم مكتبي ومراقبة استلام الـ Webhooks عبر شبكة Wi-Fi المحلية.

توفر حزمة `@akadli/playground` بيئة معزولة للمطورين لاختبار تدفقات طلبيات المتاجر، ومحاكاة المحادثات الصوتية بالدارجة مع ElevenAgents، ومعاينة نتائج وقرارات الطلبيات مباشرة بدون الحاجة لرفع السيرفر إلى الاستضافة السحابية.

---

## التشغيل السريع

</div>

<div dir="ltr" align="left">

```bash
# 1. التثبيت والبناء من المجلد الرئيسي
pnpm install && pnpm build

# 2. إعداد المتغيرات في apps/akadli-playground/.env
cp apps/akadli-playground/.env.example apps/akadli-playground/.env

# 3. تشغيل خادم الاختبار
pnpm --filter @akadli/playground dev
```

</div>

<div dir="rtl" align="right">

- **لوحة التحكم المركزية (`/admin`):** افتح `https://localhost:3000/admin` لبدء المكالمات وتجربة النماذج الجاهزة ومتابعة النصوص الصوتية المباشرة.
- **مستقبل الهاتف المحمول (`/phone`):** افتح `https://<YOUR-LAN-IP>:3000/phone` على هاتفك الذكي (المتصل بنفس شبكة Wi-Fi) لاستقبال المكالمة التجريبية بنغمة الهاتف والاهتزاز.

---

## جدول متغيرات البيئة (`server/src/config.ts`)

| التصنيف | متغير البيئة | القيمة الافتراضية | الوصف |
| :--- | :--- | :--- | :--- |
| **الخادم** | `PORT` / `SERVER_PORT` | `3000` / `3001` | منافذ واجهة Vite وخادم Express |
| **ElevenLabs** | `ELEVENLABS_API_KEY` / `_AGENT_ID` | — | بيانات الاعتماد للوكيل الصوتي الذكي |
| **سجلات المكالمات** | `SAVE_CALL_LOGS` / `CALL_LOGS_DIR` | `"true"` / `"./logs/calls"` | حفظ وأرشفة نصوص المحادثات (`.json`) والتسجيلات الصوتية (`.mp3`) |
| **Shopify** | `SHOPIFY_SHOP_DOMAIN` / `_ACCESS_TOKEN` | — | نطاق المتجر ورمز الوصول الدائم |
| **Shopify** | `SHOPIFY_CLIENT_ID` / `_CLIENT_SECRET` | — | بيانات OAuth لتبادل التوكن التلقائي |
| **Shopify** | `SHOPIFY_WEBHOOK_SECRET` / `_API_VERSION` | `"2025-01"` | المفتاح السري لتوقيع HMAC وإصدار الـ API |
| **YouCan** | `YOUCAN_ACCESS_TOKEN` / `_WEBHOOK_SECRET` | — | رمز وصول YouCan والمفتاح السري للـ Webhook |
| **YouCan** | `YOUCAN_API_BASE_URL` | `"https://api.youcan.shop"` | الرابط الأساسي لـ REST API الخاص بـ YouCan |
| **WooCommerce** | `WOOCOMMERCE_SITE_URL` | — | رابط موقع ووردبريس |
| **WooCommerce** | `WOOCOMMERCE_CONSUMER_KEY` / `_SECRET` | — | مفاتيح REST API v3 (`ck_...`, `cs_...`) |
| **WooCommerce** | `WOOCOMMERCE_WEBHOOK_SECRET` | — | المفتاح السري لتوقيع Webhook ووكومرس |
| **GSheets** | `GSHEETS_SPREADSHEET_ID` / `_ACCESS_TOKEN`| — | بيانات الطريقة (أ) عبر REST API v4 |
| **GSheets** | `GSHEETS_APPS_SCRIPT_URL` / `_SECRET` | — | بيانات الطريقة (ب) عبر رابط تطبيق الويب |
| **Tassyir** | `TASSYIR_API_KEY` / `_WEBHOOK_SECRET` | — | مفتاح ومفتاح توقيع نظام Tassyir ERP |
| **Tassyir** | `TASSYIR_API_BASE_URL` | `"https://api.tassyir.dz/v1"` | الرابط الأساسي لواجهة Tassyir REST API |

---

## مسارات الـ Webhook ونماذج المحاكاة

تسجل جميع المحولات مسارات استقبال حية ونماذج محاكاة محلية عبر `providerRegistry`:

| المحول | مسار الاستقبال المباشر | مسار المحاكاة بنماذج الاختبار |
| :--- | :--- | :--- |
| **Shopify** | `POST /api/webhooks/shopify` | `POST /api/webhooks/shopify/simulate` |
| **YouCan** | `POST /api/webhooks/youcan` | `POST /api/webhooks/youcan/simulate` |
| **WooCommerce** | `POST /api/webhooks/woocommerce` | `POST /api/webhooks/woocommerce/simulate` |
| **Google Sheets** | `POST /api/webhooks/gsheets` | `POST /api/webhooks/gsheets/simulate` |
| **Tassyir ERP** | `POST /api/webhooks/tassyir` | `POST /api/webhooks/tassyir/simulate` |

---

## أرشفة نصوص المحادثات (STT) والتسجيلات الصوتية (`/api/logs`)

عند تفعيل `SAVE_CALL_LOGS=true` (مفعل افتراضياً)، يقوم `@akadli/playground` بأرشفة المكالمات المكتملة تلقائياً داخل مجلد `CALL_LOGS_DIR` (`./logs/calls`) عبر دوال `@akadli/core`:
- `GET /api/logs` — استعراض قائمة المكالمات المؤرشفة مع بيانات الطلبية، حالة القرار، ملف النص `transcriptFile` (`.json`) وملف الصوت `audioFile` (`.mp3`).
- `GET /api/logs/:filename` — عرض أو تحميل ملف نص المحادثة (`.json`) أو التسجيل الصوتي للمكالمة (`.mp3`) مع جلبه تلقائياً من ElevenLabs إذا لم يكن مخزناً بعد.
- **الاستماع المباشر في لوحة التحكم (`/admin`):** يمكنك الاستماع لتسجيل المكالمة مباشرة عبر مشغل الصوت المدمج أو معاينة وتحميل نص الحوار الكامل (JSON).

---

## اختبار الـ Webhooks الحية عبر نفق Cloudflare Tunnel

لاختبار استقبال الـ Webhooks من متاجر حية دون الحاجة إلى نشر الخادم:

</div>

<div dir="ltr" align="left">

```bash
cloudflared tunnel --url http://127.0.0.1:3001
```

</div>

<div dir="rtl" align="right">

ثم قم بضبط رابط الـ Webhook في متجرك على `https://<tunnel-subdomain>.trycloudflare.com/api/webhooks/<provider>`.

</div>
