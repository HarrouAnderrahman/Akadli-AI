---
title: الجغرافيا والهاتف الجزائري 2026 (@akadli/dz-geo)
description: قاعدة البيانات الرسمية للتقسيم الإداري الجزائري 2026 (69 ولاية و 1708 بلدية) ومطابقة العناوين وتطبيع أرقام الهواتف.
---

توفر حزمة `@akadli/dz-geo` المرجع البرمجي الرسمي لـ **التقسيم الإداري الجزائري 2026 (69 ولاية و 1708 بلدية)** مع خوارزميات متطورة للبحث الضبابي (Fuzzy Matching) وتصحيح الأخطاء الإملائية بالعربية والفرنسية والعربيزي.

---

## التثبيت

```bash
pnpm add @akadli/dz-geo
```

---

## التقسيم الإداري 2026 والولايات المستحدثة (من 59 إلى 69)

في عام 2026، اعتمدت الجزائر رسمياً التقسيم الإداري لـ 69 ولاية. ونظراً لغياب هذا التحديث في أغلب المنصات العالمية، توفر هذه الحزمة الدعم الفوري والكامل للولايات الـ 11 المستحدثة:

| الرمز | الاسم بالفرنسية | الاسم بالعربية | أهم البلديات التابعة |
| :--- | :--- | :--- | :--- |
| **59** | El Aricha | العريشة | العريشة، سيدي الجيلالي |
| **60** | Barika | بريكة | بريكة، أمدوكال، بيطام |
| **61** | Ksar Chellala | قصر الشلالة | قصر الشلالة، سرغين |
| **62** | Ain Oussera | عين وسارة | عين وسارة، القرنيني |
| **63** | Messaad | مسعد | مسعد، سلمانة، دلدول |
| **64** | Brizina | بريزينة | بريزينة، الأبيض، كراكدة |
| **65** | Bir El Ater | بئر العاتر | بئر العاتر، نقرين، فركان |
| **66** | El Kantara | القنطرة | القنطرة، عين زعطوط |
| **67** | Ksar El Boukhari | قصر البخاري | قصر البخاري، السواقي |
| **68** | Bou Saada | بوسعادة | بوسعادة، الهامل، ولتان |
| **69** | El Abiodh Sidi Cheikh | الأبيض سيدي الشيخ | الأبيض سيدي الشيخ، أربوات |

---

## الدوال الأساسية

### 1. `normalizeWilaya(input)`

تقوم بمطابقة وتصحيح مدخلات الزبون عبر مسار رباعي المراحل:
1. الرمز الرقمي للولاية (`"16"`, `16`).
2. التطابق التام باللغة العربية أو الفرنسية (`"الجزائر"`, `"Alger"`).
3. الرمز البريدي المكون من 5 أرقام (`"13000"` -> ولاية تلمسان `"13"`).
4. خوارزمية Levenshtein لمطابقة الأخطاء الإملائية (`"bou saada"` -> `"68"`, `"بريكة"` -> `"60"`).

```typescript
import { normalizeWilaya } from "@akadli/dz-geo";

normalizeWilaya("بريكة");
// => { code: "60", nameFr: "Barika", nameAr: "بريكة", score: 1 }

normalizeWilaya("bou saada");
// => { code: "68", nameFr: "Bou Saada", nameAr: "بوسعادة", score: 1 }

normalizeWilaya("13000"); // عبر الرمز البريدي
// => { code: "13", nameFr: "Tlemcen", nameAr: "تلمسان", score: 1 }
```

### 2. `normalizeCommune(rawCommune, wilayaCode)`

تطابق اسم البلدية المدخل من الزبون مع قائمة البلديات الرسمية التابعة لتلك الولاية حصراً:

```typescript
import { normalizeCommune } from "@akadli/dz-geo";

const match = normalizeCommune("maghnia", "13");
console.log(match.canonicalCommune); // "Maghnia"
console.log(match.isExactMatch); // true
```

### 3. `normalizeDzPhone(phone, format)`

تنظيف رقم الهاتف من المسافات والفواصل والرموز الدولية وتحويله إلى صيغة جزائرية قياسية:

```typescript
import { normalizeDzPhone } from "@akadli/dz-geo";

// الصيغة المحلية المكونة من 10 أرقام (05/06/07XXXXXXXX)
normalizeDzPhone("+213 (0) 550 12 34 56", "local");
// => "0550123456"

// الصيغة الدولية E.164
normalizeDzPhone("0770-12-34-56", "e164");
// => "+213770123456"
```

### 4. `getCommunesForWilaya(code)` وقوائم الولايات

```typescript
import { getCommunesForWilaya, WILAYAS_69, WILAYAS_58 } from "@akadli/dz-geo";

// جلب بلديات ولاية بريكة (60)
const communes = getCommunesForWilaya("60");
console.log(communes); // ["Barika", "M'doukal", "Bitam", ...]

// التوافق العكسي مع شركات التوصيل التي لا تزال تستخدم تقسيم 58 ولاية
console.log(WILAYAS_58.length); // 58
console.log(WILAYAS_69.length); // 69
```
