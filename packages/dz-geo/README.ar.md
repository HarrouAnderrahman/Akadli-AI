**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

<div dir="rtl" align="right">

# @akadli/dz-geo

> التقسيم الإداري الجزائري الرسمي لعام 2026 (69 ولاية و 1708 بلدية)، ومعالج مطابقة العناوين وتطبيع أرقام الهاتف الجزائري +213.

توفر حزمة `@akadli/dz-geo` بيانات التقسيم الإداري الجزائري الجديد مع خوارزميات تطبيع ومطابقة مرنة للمدخلات غير المنتظمة باللغة العربية، الفرنسية، وعربيزي، لمنع الهلوسة الجغرافية في وكلاء الذكاء الاصطناعي الصوتي ومتاجر التجارة الإلكترونية.

---

## الدوال والثوابت المصدرة

| الدالة / الثابت | المخرجات | الوصف |
| :--- | :--- | :--- |
| `normalizeWilaya(input)` | `NormalizedWilayaResult` | معالج ولايات رباعي المراحل: أرقام، توحيد النص، أسماء شائعة، وخوارزمية Levenshtein |
| `normalizeCommune(raw, code)` | `CommuneMatchResult` | مطابقة أسماء البلديات وتصحيح الأخطاء الإملائية ضمن نطاق الولاية المحددة |
| `normalizeDzPhone(phone, format)` | `string` | تحويل أرقام الهواتف إلى الصيغة المحلية (`05/06/07XXXXXXXX`) أو الدولية (`+213...`) |
| `getCommunesForWilaya(code)` | `readonly string[]` | جلب القائمة الرسمية لجميع بلديات الولاية (`"01"` إلى `"69"`) |
| `WILAYAS_69` / `WILAYAS_ALL` | `readonly WilayaRecord[]` | قاعدة بيانات 69 ولاية كاملة لعام 2026 مع الرموز، الأسماء بالعربية والفرنسية، والأسماء الشائعة |
| `WILAYAS_58` | `readonly WilayaRecord[]` | مصفوفة الـ 58 ولاية للتوافق مع شركات الشحن القديمة (Yalidine, ZR Express) |

---

## الولايات الجديدة المعتمدة (الرموز 59 إلى 69)

دعم كامل لجميع الولايات الـ 11 المستحدثة:
- **59**: العريشة • **60**: بريكة • **61**: قصر الشلالة • **62**: عين وسارة • **63**: مسعد
- **64**: بريزينة • **65**: بئر العاتر • **66**: القنطرة • **67**: قصر البخاري • **68**: بوسعادة • **69**: الأبيض سيدي الشيخ

---

## أمثلة الاستخدام

</div>

<div dir="ltr" align="left">

```typescript
import {
  normalizeWilaya,
  normalizeCommune,
  normalizeDzPhone,
  getCommunesForWilaya
} from "@akadli/dz-geo";

// 1. تطبيع رقم الهاتف الجزائري
normalizeDzPhone("05 50 12 34 56", "local"); // => "0550123456"
normalizeDzPhone("+213 (0) 661-23-45-67", "e164"); // => "+213661234567"

// 2. مطابقة الولاية بمرونة (بالعربية أو الفرنسية أو الرمز البريدي)
normalizeWilaya("بريكة");        // => { code: "60", nameFr: "Barika", nameAr: "بريكة" }
normalizeWilaya("bou saada");    // => { code: "68", nameFr: "Bou Saada", nameAr: "بوسعادة" }
normalizeWilaya("13000");        // => { code: "13", nameFr: "Tlemcen", nameAr: "تلمسان" }

// 3. مطابقة البلدية ضمن نطاق الولاية
const result = normalizeCommune("maghnia", "13");
console.log(result.canonicalCommune); // => "Maghnia"
```

</div>

<div dir="rtl" align="right">

---

## التثبيت

</div>

<div dir="ltr" align="left">

```bash
pnpm add @akadli/dz-geo
```

</div>
