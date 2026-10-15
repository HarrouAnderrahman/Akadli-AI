# Algerian 69 Wilayas (2026 Administrative Division), 1,708 Communes & Phone Normalization Specification

This reference provides the complete 69 Algerian Wilayas lookup table (`"01"` through `"69"`), 1,708 Communes dataset specification, legacy `WILAYAS_58` backward-compatibility subset, messy input normalization algorithms, commune scoping rules, and Algerian phone number regex/normalization implementations for `@akadli/dz-geo`.

---

## 1. Official 69 Algerian Wilayas Table (`"01"` to `"69"`)

| Code | Canonical Label (`code - nameFr`) | Canonical French Name | Canonical Arabic Name | Common Aliases / Arabizi / Abbreviations |
| :--- | :--- | :--- | :--- | :--- |
| `"01"` | `01 - Adrar` | Adrar | أدرار | `adrar`, `أدرار` |
| `"02"` | `02 - Chlef` | Chlef | الشلف | `chlef`, `ech cheliff`, `el asnam`, `شلف`, `الشلف` |
| `"03"` | `03 - Laghouat` | Laghouat | الأغواط | `laghouat`, `اغواط`, `الأغواط` |
| `"04"` | `04 - Oum El Bouaghi` | Oum El Bouaghi | أم البواقي | `oum el bouaghi`, `oeb`, `oum bouaghi`, `ام البواقي`, `أم البواقي` |
| `"05"` | `05 - Batna` | Batna | باتنة | `batna`, `باتنه`, `باتنة` |
| `"06"` | `06 - Bejaia` | Bejaia | بجاية | `bejaia`, `béjaïa`, `bgayet`, `bougie`, `بجايه`, `بجاية` |
| `"07"` | `07 - Biskra` | Biskra | بسكرة | `biskra`, `بسكره`, `بسكرة` |
| `"08"` | `08 - Bechar` | Bechar | بشار | `bechar`, `béchar`, `بشار` |
| `"09"` | `09 - Blida` | Blida | البليدة | `blida`, `بليدة`, `بليده`, `البليدة` |
| `"10"` | `10 - Bouira` | Bouira | البويرة | `bouira`, `tubirett`, `بويرة`, `بويره`, `البويرة` |
| `"11"` | `11 - Tamanrasset` | Tamanrasset | تمنراست | `tamanrasset`, `tamanghasset`, `tam`, `تمنراست` |
| `"12"` | `12 - Tebessa` | Tebessa | تبسة | `tebessa`, `tébessa`, `تبسه`, `تبسة` |
| `"13"` | `13 - Tlemcen` | Tlemcen | تلمسان | `tlemcen`, `tilimsen`, `تلمسان` |
| `"14"` | `14 - Tiaret` | Tiaret | تيارت | `tiaret`, `tahert`, `تيارت` |
| `"15"` | `15 - Tizi Ouzou` | Tizi Ouzou | تيزي وزو | `tizi ouzou`, `tizi-ouzou`, `tizi`, `to`, `تيزي وزو` |
| `"16"` | `16 - Alger` | Alger | الجزائر | `alger`, `algiers`, `dzayer`, `el djazair`, `الجزائر العاصمة`, `الجزائر` |
| `"17"` | `17 - Djelfa` | Djelfa | الجلفة | `djelfa`, `جلفة`, `جلفه`, `الجلفة` |
| `"18"` | `18 - Jijel` | Jijel | جيجل | `jijel`, `djdjel`, `جيجل` |
| `"19"` | `19 - Setif` | Setif | سطيف | `setif`, `sétif`, `سطيف` |
| `"20"` | `20 - Saida` | Saida | سعيدة | `saida`, `saïda`, `سعيده`, `سعيدة` |
| `"21"` | `21 - Skikda` | Skikda | سكيكدة | `skikda`, `rusicada`, `سكيكده`, `سكيكدة` |
| `"22"` | `22 - Sidi Bel Abbes` | Sidi Bel Abbes | سيدي بلعباس | `sidi bel abbes`, `sidi-bel-abbes`, `sba`, `bel abbes`, `بلعباس`, `سيدي بلعباس` |
| `"23"` | `23 - Annaba` | Annaba | عنابة | `annaba`, `bone`, `bône`, `عنابه`, `عنابة` |
| `"24"` | `24 - Guelma` | Guelma | قالمة | `guelma`, `قالمه`, `قالمة` |
| `"25"` | `25 - Constantine` | Constantine | قسنطينة | `constantine`, `qacentina`, `قسنطينه`, `قسنطينة` |
| `"26"` | `26 - Medea` | Medea | المدية | `medea`, `médéa`, `مدية`, `مديه`, `المدية` |
| `"27"` | `27 - Mostaganem` | Mostaganem | مستغانم | `mostaganem`, `mosta`, `مستغانم` |
| `"28"` | `28 - M'Sila` | M'Sila | المسيلة | `msila`, `m'sila`, `m sila`, `مسيلة`, `مسيله`, `المسيلة` |
| `"29"` | `29 - Mascara` | Mascara | معسكر | `mascara`, `mouaskar`, `معسكر` |
| `"30"` | `30 - Ouargla` | Ouargla | ورقلة | `ouargla`, `wargla`, `ورقله`, `ورقلة` |
| `"31"` | `31 - Oran` | Oran | وهران | `oran`, `wahran`, `wahren`, `وهران` |
| `"32"` | `32 - El Bayadh` | El Bayadh | البيض | `el bayadh`, `bayadh`, `البيض` |
| `"33"` | `33 - Illizi` | Illizi | إليزي | `illizi`, `اليزي`, `إليزي` |
| `"34"` | `34 - Bordj Bou Arreridj` | Bordj Bou Arreridj | برج بوعريريج | `bordj bou arreridj`, `bba`, `bordj`, `برج بوعريريج` |
| `"35"` | `35 - Boumerdes` | Boumerdes | بومرداس | `boumerdes`, `boumerdès`, `بومرداس` |
| `"36"` | `36 - El Tarf` | El Tarf | الطارف | `el tarf`, `tarf`, `الطارف` |
| `"37"` | `37 - Tindouf` | Tindouf | تندوف | `tindouf`, `تندوف` |
| `"38"` | `38 - Tissemsilt` | Tissemsilt | تسمسيلت | `tissemsilt`, `تسمسيلت` |
| `"39"` | `39 - El Oued` | El Oued | الوادي | `el oued`, `oued souf`, `واد سوف`, `الوادي`, `الواد` |
| `"40"` | `40 - Khenchela` | Khenchela | خنشلة | `khenchela`, `خنشله`, `خنشلة` |
| `"41"` | `41 - Souk Ahras` | Souk Ahras | سوق أهراس | `souk ahras`, `souk-ahras`, `سوق اهراس`, `سوق أهراس` |
| `"42"` | `42 - Tipaza` | Tipaza | تيبازة | `tipaza`, `tipasa`, `تيبازه`, `تيبازة` |
| `"43"` | `43 - Mila` | Mila | ميلة | `mila`, `ميله`, `ميلة` |
| `"44"` | `44 - Ain Defla` | Ain Defla | عين الدفلى | `ain defla`, `aïn defla`, `عين دفلى`, `عين الدفلى` |
| `"45"` | `45 - Naama` | Naama | النعامة | `naama`, `naâma`, `نعامة`, `نعامه`, `النعامة` |
| `"46"` | `46 - Ain Temouchent` | Ain Temouchent | عين تموشنت | `ain temouchent`, `aïn témouchent`, `temouchent`, `عين تموشنت` |
| `"47"` | `47 - Ghardaia` | Ghardaia | غرداية | `ghardaia`, `ghardaïa`, `غردايه`, `غرداية` |
| `"48"` | `48 - Relizane` | Relizane | غليزان | `relizane`, `ghilizane`, `غليزان` |
| `"49"` | `49 - El M'ghair` | El M'ghair | المغير | `el mghair`, `el m'ghair`, `el meghaier`, `المغير` |
| `"50"` | `50 - El Menia` | El Menia | المنيعة | `el menia`, `el meniaa`, `el golea`, `el goléa`, `المنيعة`, `المنيعه` |
| `"51"` | `51 - Ouled Djellal` | Ouled Djellal | أولاد جلال | `ouled djellal`, `اولاد جلال`, `أولاد جلال` |
| `"52"` | `52 - Bordj Baji Mokhtar` | Bordj Baji Mokhtar | برج باجي مختار | `bordj baji mokhtar`, `bordj badji mokhtar`, `bbm`, `برج باجي مختار` |
| `"53"` | `53 - Béni Abbès` | Béni Abbès | بني عباس | `beni abbes`, `béni abbès`, `بني عباس` |
| `"54"` | `54 - Timimoun` | Timimoun | تيميمون | `timimoun`, `تيميمون` |
| `"55"` | `55 - Touggourt` | Touggourt | تقرت | `touggourt`, `tuggurt`, `تقرت` |
| `"56"` | `56 - Djanet` | Djanet | جانت | `djanet`, `جانت` |
| `"57"` | `57 - In Salah` | In Salah | عين صالح | `in salah`, `ain salah`, `إن صالح`, `عين صالح` |
| `"58"` | `58 - In Guezzam` | In Guezzam | عين قزام | `in guezzam`, `ain guezzam`, `إن قزام`, `عين قزام` |
| `"59"` | `59 - Aflou` | Aflou | آفلو | `aflou`, `افلو`, `آفلو` |
| `"60"` | `60 - Barika` | Barika | بريكة | `barika`, `بريكة`, `بريكه` |
| `"61"` | `61 - El Kantara` | El Kantara | القنطرة | `el kantara`, `kantara`, `القنطرة`, `القنطره` |
| `"62"` | `62 - Bir El Ater` | Bir El Ater | بئر العاتر | `bir el ater`, `bir el-ater`, `بئر العاتر` |
| `"63"` | `63 - El Aricha` | El Aricha | العريشة | `el aricha`, `aricha`, `العريشة`, `العريشه` |
| `"64"` | `64 - Ksar Chellala` | Ksar Chellala | قصر الشلالة | `ksar chellala`, `chellala`, `قصر الشلالة`, `قصر الشلاله` |
| `"65"` | `65 - Ain Oussera` | Ain Oussera | عين وسارة | `ain oussera`, `aïn oussera`, `oussera`, `عين وسارة`, `عين وساره` |
| `"66"` | `66 - Messad` | Messad | مسعد | `messad`, `messaad`, `مسعد` |
| `"67"` | `67 - Ksar El Boukhari` | Ksar El Boukhari | قصر البخاري | `ksar el boukhari`, `boukhari`, `قصر البخاري` |
| `"68"` | `68 - Bou Saada` | Bou Saada | بوسعادة | `bou saada`, `bousaada`, `bou-saada`, `بوسعادة`, `بوسعاده` |
| `"69"` | `69 - El Abiodh Sidi Cheikh` | El Abiodh Sidi Cheikh | الأبيض سيدي الشيخ | `el abiodh sidi cheikh`, `el abiodh`, `sidi cheikh`, `الابيض سيدي الشيخ`, `الأبيض سيدي الشيخ` |

---

## 2. Backward Compatibility Subset (`WILAYAS_58`)

To guarantee smooth interoperability with older shipping carriers (Yalidine, Ecotrack, ZR Express) or ERPs that haven't updated beyond the 58 Wilaya division:
- `@akadli/dz-geo` exports `WILAYAS_ALL` (69 Wilayas) and `WILAYAS_58` (`WILAYAS_69.slice(0, 58)`).
- All 1,708 Communes are indexed across all 69 Wilayas.

---

## 3. Reference Normalizer Implementation (`packages/dz-geo/src/wilaya.ts`)

```typescript
import { WilayaCode, WILAYA_CODES } from "@akadli/adapter-contract";
import { WILAYAS_ALL, WILAYAS_MAP } from "./data/wilayas.js";
import { NormalizedWilayaResult, WilayaRecord } from "./types.js";

export class InvalidWilayaError extends Error {
  constructor(public readonly rawInput: unknown) {
    super(`Unrecognized Algerian Wilaya input: "${String(rawInput)}". Expected 01-69 or valid Wilaya name.`);
    this.name = "InvalidWilayaError";
  }
}

/**
 * Strips French accents, Arabic diacritics/tatweel, normalizes Alef/Teh Marbuta,
 * and collapses punctuation/whitespace.
 */
export function canonicalizeGeoToken(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip Latin accents
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // Strip Arabic tashkeel & tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/^(?:wilaya\s+(?:de\s+|d['’])?|ولايه\s+|ال)/i, "")
    .replace(/[-_.'’/\\()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes any messy Wilaya input into a canonical 69-Wilaya result.
 */
export function normalizeWilaya(rawInput: string | number): NormalizedWilayaResult {
  if (rawInput === null || rawInput === undefined) {
    throw new InvalidWilayaError(rawInput);
  }

  // --- Stage 1: Numeric & Prefix Extraction ---
  if (typeof rawInput === "number") {
    if (rawInput >= 1 && rawInput <= 69) {
      const code = String(rawInput).padStart(2, "0") as WilayaCode;
      const record = WILAYAS_MAP.get(code);
      if (record) {
        return {
          code: record.code,
          nameFr: record.nameFr,
          nameAr: record.nameAr,
          canonicalLabel: record.canonicalLabel
        };
      }
    }
    throw new InvalidWilayaError(rawInput);
  }

  const str = String(rawInput).trim();
  if (!str) {
    throw new InvalidWilayaError(rawInput);
  }

  const numericMatch = str.match(/(?:^|\b|wilaya\s*)(\d{1,2})\b/i);
  if (numericMatch && numericMatch[1]) {
    const num = parseInt(numericMatch[1], 10);
    if (num >= 1 && num <= 69) {
      const code = String(num).padStart(2, "0") as WilayaCode;
      const record = WILAYAS_MAP.get(code);
      if (record) {
        return {
          code: record.code,
          nameFr: record.nameFr,
          nameAr: record.nameAr,
          canonicalLabel: record.canonicalLabel
        };
      }
    }
  }

  // --- Stage 2 & 3: Clean Token & Alias Lookup across WILAYAS_ALL ---
  const cleaned = canonicalizeGeoToken(str);
  for (const record of WILAYAS_ALL) {
    const cleanFr = canonicalizeGeoToken(record.nameFr);
    const cleanAr = canonicalizeGeoToken(record.nameAr);

    if (cleaned === cleanFr || cleaned === cleanAr) {
      return {
        code: record.code,
        nameFr: record.nameFr,
        nameAr: record.nameAr,
        canonicalLabel: record.canonicalLabel
      };
    }

    if (record.aliases) {
      for (const alias of record.aliases) {
        if (cleaned === canonicalizeGeoToken(alias) || str.toLowerCase() === alias.toLowerCase()) {
          return {
            code: record.code,
            nameFr: record.nameFr,
            nameAr: record.nameAr,
            canonicalLabel: record.canonicalLabel
          };
        }
      }
    }
  }

  // --- Stage 4: Fuzzy Levenshtein Match ---
  let bestMatch: WilayaRecord | null = null;
  let lowestDist = Infinity;

  for (const record of WILAYAS_ALL) {
    const cleanFr = canonicalizeGeoToken(record.nameFr);
    const cleanAr = canonicalizeGeoToken(record.nameAr);

    const distFr = levenshteinDistance(cleaned, cleanFr);
    const distAr = levenshteinDistance(cleaned, cleanAr);
    const minDist = Math.min(distFr, distAr);

    if (minDist < lowestDist && minDist <= (cleaned.length > 5 ? 2 : 1)) {
      lowestDist = minDist;
      bestMatch = record;
    }
  }

  if (bestMatch) {
    return {
      code: bestMatch.code,
      nameFr: bestMatch.nameFr,
      nameAr: bestMatch.nameAr,
      canonicalLabel: bestMatch.canonicalLabel
    };
  }

  throw new InvalidWilayaError(rawInput);
}
```

---

## 4. Algerian Phone Normalization Reference (`packages/dz-geo/src/phone.ts`)

```typescript
export class InvalidDzPhoneError extends Error {
  constructor(public readonly rawPhone: string) {
    super(
      `Invalid Algerian mobile phone number "${rawPhone}". Expected 05/06/07XXXXXXXX or +213[567]XXXXXXXX.`
    );
    this.name = "InvalidDzPhoneError";
  }
}

export function normalizeDzPhone(
  rawPhone: string,
  targetFormat: "local" | "e164" = "local"
): string {
  const digitsAndPlus = rawPhone.replace(/[^\d+]/g, "");

  let subscriber = digitsAndPlus;
  if (subscriber.startsWith("+213")) {
    subscriber = subscriber.slice(4);
  } else if (subscriber.startsWith("00213")) {
    subscriber = subscriber.slice(5);
  } else if (subscriber.startsWith("213") && subscriber.length >= 12) {
    subscriber = subscriber.slice(3);
  }

  // Strip optional trunk '0' (e.g., +2130550123456 or 0550123456)
  if (subscriber.startsWith("0")) {
    subscriber = subscriber.slice(1);
  }

  if (!/^[567]\d{8}$/.test(subscriber)) {
    throw new InvalidDzPhoneError(rawPhone);
  }

  return targetFormat === "e164" ? `+213${subscriber}` : `0${subscriber}`;
}
```
