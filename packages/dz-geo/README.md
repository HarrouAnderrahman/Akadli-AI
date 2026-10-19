**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/dz-geo

> 2026 Algerian Administrative Divisions (69 Wilayas & 1,708 Communes), fuzzy address resolver, and +213 phone normalizer.

`@akadli/dz-geo` provides official 2026 Algerian geographic data and normalization logic across Arabic, French, and Arabizi inputs for e-commerce checkout forms and voice agent verification.

---

## Core Functions & Exports

| Function / Constant | Returns | Description |
| :--- | :--- | :--- |
| `normalizeWilaya(input)` | `NormalizedWilayaResult` | 4-stage resolver: numbers, canonical script, aliases, Levenshtein fuzzy match |
| `normalizeCommune(raw, code)` | `CommuneMatchResult` | Resolves commune variations against official communes of the Wilaya |
| `normalizeDzPhone(phone, format)` | `string` | Converts Algerian numbers to local (`05/06/07XXXXXXXX`) or E.164 (`+213...`) |
| `getCommunesForWilaya(code)` | `readonly string[]` | List of all official communes for a Wilaya code (`"01"` to `"69"`) |
| `WILAYAS_69` / `WILAYAS_ALL` | `readonly WilayaRecord[]` | Complete 2026 dataset of 69 Wilayas with codes, Arabic/French names, and aliases |
| `WILAYAS_58` | `readonly WilayaRecord[]` | 58-Wilaya backward compatibility slice for legacy couriers |

---

## 2026 Promoted Wilayas (Codes 59–69)

Includes full support for the 11 promoted Wilayas:
- **59**: El Aricha • **60**: Barika • **61**: Ksar Chellala • **62**: Ain Oussera • **63**: Messaad
- **64**: Brizina • **65**: Bir El Ater • **66**: El Kantara • **67**: Ksar El Boukhari • **68**: Bou Saada • **69**: El Abiodh Sidi Cheikh

---

## Usage Example

```typescript
import {
  normalizeWilaya,
  normalizeCommune,
  normalizeDzPhone,
  getCommunesForWilaya
} from "@akadli/dz-geo";

// 1. Phone Normalization
normalizeDzPhone("05 50 12 34 56", "local"); // => "0550123456"
normalizeDzPhone("+213 (0) 661-23-45-67", "e164"); // => "+213661234567"

// 2. Fuzzy Wilaya Matching (Arabic, French, Arabizi, or 5-digit postal code)
normalizeWilaya("بريكة");        // => { code: "60", nameFr: "Barika", nameAr: "بريكة" }
normalizeWilaya("bou saada");    // => { code: "68", nameFr: "Bou Saada", nameAr: "بوسعادة" }
normalizeWilaya("13000");        // => { code: "13", nameFr: "Tlemcen", nameAr: "تلمسان" }

// 3. Commune Resolution within Wilaya
const result = normalizeCommune("maghnia", "13");
console.log(result.canonicalCommune); // => "Maghnia"
```

---

## Installation

```bash
pnpm add @akadli/dz-geo
```
