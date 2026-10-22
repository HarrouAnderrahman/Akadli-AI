---
title: Algerian Geography & Phone
description: Official 2026 Algerian 69 Wilayas, 1,708 Communes, postal code matching, and +213 phone normalizer.
---

`@akadli/dz-geo` provides the definitive, up-to-date dataset of the **2026 Algerian administrative division (69 Wilayas and 1,708 Communes)** along with robust fuzzy resolution algorithms across Arabic, French, and Franco-Arabic (Arabizi) inputs.

---

## Installation

```bash
pnpm add @akadli/dz-geo
```

---

## The 2026 Division & Promoted Wilayas (59–69)

In 2026, Algeria officially expanded its administrative map to 69 Wilayas. Global platforms (Shopify, WooCommerce, Stripe) often still lack native support for these divisions. `@akadli/dz-geo` fully resolves all 11 newly promoted Wilayas:

| Code | French Name | Arabic Name | Notable Communes |
| :--- | :--- | :--- | :--- |
| **59** | El Aricha | العريشة | El Aricha, Sidi Djillali |
| **60** | Barika | بريكة | Barika, M'doukal, Bitam |
| **61** | Ksar Chellala | قصر الشلالة | Ksar Chellala, Serghine |
| **62** | Ain Oussera | عين وسارة | Ain Oussera, Guernini |
| **63** | Messaad | مسعد | Messaad, Selmana, Deldoul |
| **64** | Brizina | بريزينة | Brizina, El Biodh, Krakda |
| **65** | Bir El Ater | بئر العاتر | Bir El Ater, Negrine, Ferkane |
| **66** | El Kantara | القنطرة | El Kantara, Ain Zaatout |
| **67** | Ksar El Boukhari | قصر البخاري | Ksar El Boukhari, Saneg |
| **68** | Bou Saada | بوسعادة | Bou Saada, El Hamel, Oultene |
| **69** | El Abiodh Sidi Cheikh | الأبيض سيدي الشيخ | El Abiodh Sidi Cheikh, Arbaouat |

---

## Core Functions

### 1. `normalizeWilaya(input)`

Resolves customer input using a 4-stage pipeline:
1. Two-digit code or numeric index (`"16"`, `16`).
2. Exact string match in Arabic or French (`"Alger"`, `"الجزائر"`).
3. 5-digit ONP postal code (`"13000"` -> Wilaya `"13"`, `"05001"` -> Wilaya `"05"`).
4. Levenshtein fuzzy string distance for typos (`"bou saada"` -> `"68"`, `"barika"` -> `"60"`).

```typescript
import { normalizeWilaya } from "@akadli/dz-geo";

normalizeWilaya("بريكة");
// => { code: "60", nameFr: "Barika", nameAr: "بريكة", score: 1 }

normalizeWilaya("bou saada");
// => { code: "68", nameFr: "Bou Saada", nameAr: "بوسعادة", score: 1 }

normalizeWilaya("13000"); // Postal code
// => { code: "13", nameFr: "Tlemcen", nameAr: "تلمسان", score: 1 }
```

### 2. `normalizeCommune(rawCommune, wilayaCode)`

Matches the customer's input against the official 1,708 Algerian Communes for that specific Wilaya:

```typescript
import { normalizeCommune } from "@akadli/dz-geo";

const match = normalizeCommune("maghnia", "13");
console.log(match.canonicalCommune); // "Maghnia"
console.log(match.isExactMatch); // true
```

### 3. `normalizeDzPhone(phone, format)`

Cleans spaces, dashes, parentheses, and prefixes (`+213`, `00213`, `213`) into standard Algerian formats:

```typescript
import { normalizeDzPhone } from "@akadli/dz-geo";

// Local 10-digit format (05XXXXXXXX, 06XXXXXXXX, 07XXXXXXXX)
normalizeDzPhone("+213 (0) 550 12 34 56", "local");
// => "0550123456"

// International E.164 format
normalizeDzPhone("0770-12-34-56", "e164");
// => "+213770123456"
```

### 4. `getCommunesForWilaya(code)` & Datasets

```typescript
import { getCommunesForWilaya, WILAYAS_69, WILAYAS_58 } from "@akadli/dz-geo";

// Retrieve official list of communes for Barika (60)
const communes = getCommunesForWilaya("60");
console.log(communes); // ["Barika", "M'doukal", "Bitam", ...]

// Backward-compatibility slice for couriers still on 58 Wilayas
console.log(WILAYAS_58.length); // 58
console.log(WILAYAS_69.length); // 69
```
