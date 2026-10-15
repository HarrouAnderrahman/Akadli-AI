import { WilayaCode, WILAYA_CODES } from "@dz-voice/adapter-contract";
import { WILAYAS_58, WILAYAS_MAP } from "./data/wilayas.js";
import { NormalizedWilayaResult, WilayaRecord } from "./types.js";

export class InvalidWilayaError extends Error {
  constructor(public readonly rawInput: unknown) {
    super(`Unrecognized Algerian Wilaya input: "${String(rawInput)}". Expected 01-58 or valid Wilaya name.`);
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

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i]![0] = i;
  for (let j = 0; j <= n; j++) d[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1,
        d[i]![j - 1]! + 1,
        d[i - 1]![j - 1]! + cost
      );
    }
  }
  return d[m]![n]!;
}

/**
 * Normalizes any messy Wilaya input (numeric code, Arabic, French, Arabizi, or alias)
 * into a canonical 58-Wilaya result.
 */
export function normalizeWilaya(rawInput: string | number): NormalizedWilayaResult {
  if (rawInput === null || rawInput === undefined) {
    throw new InvalidWilayaError(rawInput);
  }

  // --- Stage 1: Numeric & Prefix Extraction ---
  if (typeof rawInput === "number") {
    if (rawInput >= 1 && rawInput <= 58) {
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

  // Check direct 2-digit code or leading/embedded numeric code like "16", "13 - Tlemcen", "Wilaya 09", "31 Oran"
  const numericMatch = str.match(/(?:^|\b|wilaya\s*)(\d{1,2})\b/i);
  if (numericMatch && numericMatch[1]) {
    const num = parseInt(numericMatch[1], 10);
    if (num >= 1 && num <= 58) {
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

  // --- Stage 2: Script & Diacritic Canonicalization ---
  const cleaned = canonicalizeGeoToken(str);

  // --- Stage 3: Alias & Dictionary Lookup ---
  for (const record of WILAYAS_58) {
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

    for (const alias of record.aliases) {
      if (cleaned === canonicalizeGeoToken(alias)) {
        return {
          code: record.code,
          nameFr: record.nameFr,
          nameAr: record.nameAr,
          canonicalLabel: record.canonicalLabel
        };
      }
    }
  }

  // Also check without stripping leading "el" / "al" if the canonical name itself has it
  for (const record of WILAYAS_58) {
    const lowerFr = record.nameFr.toLowerCase();
    if (str.toLowerCase() === lowerFr) {
      return {
        code: record.code,
        nameFr: record.nameFr,
        nameAr: record.nameAr,
        canonicalLabel: record.canonicalLabel
      };
    }
  }

  // --- Stage 4: Bounded Levenshtein Fuzzy Match ---
  let bestMatch: WilayaRecord | null = null;
  let lowestDist = Infinity;

  for (const record of WILAYAS_58) {
    const cleanFr = canonicalizeGeoToken(record.nameFr);
    const cleanAr = canonicalizeGeoToken(record.nameAr);

    const distFr = levenshteinDistance(cleaned, cleanFr);
    const distAr = levenshteinDistance(cleaned, cleanAr);
    const minDist = Math.min(distFr, distAr);

    // Only allow edit distance <= 2 for strings length >= 5, or <= 1 for length >= 4
    const maxAllowedDist = cleaned.length >= 5 ? 2 : cleaned.length >= 4 ? 1 : 0;
    if (minDist <= maxAllowedDist && minDist < lowestDist) {
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
