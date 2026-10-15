import {
  COMMUNES_2026,
  Commune2026,
  WILAYAS_2026,
  Wilaya2026,
} from './algeria2026Data.js';

export type { Wilaya2026, Commune2026 };
export { WILAYAS_2026, COMMUNES_2026 };

export interface LocationValidationResult {
  valid: boolean;
  commune?: Commune2026;
  wilaya?: Wilaya2026;
  formattedWilaya?: string;
  formattedCommune?: string;
  matchedCommuneName?: string;
  matchedWilayaName?: string;
  error?: string;
  suggestion?: string;
}

/**
 * Normalizes a string for robust matching across Arabic and French Algerian place names.
 * Strips diacritics, accents, hyphens, and standardizes Arabic variations.
 */
export function normalizeLocationName(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove latin accents
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove arabic tashkeel & tatweel
    .replace(/[أإآ]/g, 'ا') // standardize alef
    .replace(/ة/g, 'ه') // standardize teh marbuta
    .replace(/ى/g, 'ي') // standardize alef maqsura
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '') // remove punctuation, hyphens, spaces
    .trim();
}

/**
 * Get all 69 official 2026 Wilayas
 */
export function getAllWilayas(): Wilaya2026[] {
  return WILAYAS_2026;
}

/**
 * Find wilaya by id, code, or name (French or Arabic)
 */
export function findWilaya(query?: string): Wilaya2026 | undefined {
  if (!query) return undefined;
  const raw = query.trim();

  // Match pattern like "13 - Tlemcen" or "13"
  const leadingCodeMatch = raw.match(/^(\d{1,2})\b/);
  if (leadingCodeMatch) {
    const code = leadingCodeMatch[1].padStart(2, '0');
    const byCode = WILAYAS_2026.find(
      (w) => w.code === code || w.id === leadingCodeMatch[1]
    );
    if (byCode) return byCode;
  }

  const norm = normalizeLocationName(raw);
  if (!norm) return undefined;

  return WILAYAS_2026.find((w) => {
    return (
      normalizeLocationName(w.name) === norm ||
      normalizeLocationName(w.ar_name) === norm ||
      w.code === norm ||
      w.id === norm
    );
  });
}

/**
 * Get all communes in a given wilaya
 */
export function getCommunesByWilayaId(wilayaId: string): Commune2026[] {
  const normId = String(parseInt(wilayaId, 10));
  return COMMUNES_2026.filter((c) => c.wilaya_id === normId);
}

/**
 * Find communes matching a query string, optionally restricted to a wilaya
 */
export function findCommunes(
  query: string,
  wilayaId?: string
): Commune2026[] {
  const norm = normalizeLocationName(query);
  if (!norm) return [];

  let candidates = COMMUNES_2026;
  if (wilayaId) {
    const normId = String(parseInt(wilayaId, 10));
    candidates = candidates.filter((c) => c.wilaya_id === normId);
  }

  // Exact normalized match first
  const exact = candidates.filter(
    (c) =>
      normalizeLocationName(c.name) === norm ||
      normalizeLocationName(c.ar_name) === norm
  );
  if (exact.length > 0) return exact;

  // Prefix or partial match
  return candidates.filter((c) => {
    const nName = normalizeLocationName(c.name);
    const nAr = normalizeLocationName(c.ar_name);
    return (
      nName.startsWith(norm) ||
      norm.startsWith(nName) ||
      nAr.startsWith(norm) ||
      norm.startsWith(nAr)
    );
  });
}

/**
 * Validate whether a commune and/or wilaya exists in official Algerian administrative records.
 * Anti-hallucination guard for automated voice order confirmation.
 */
export function validateLocation(
  communeQuery: string,
  wilayaQuery?: string
): LocationValidationResult {
  if (!communeQuery || !communeQuery.trim()) {
    return {
      valid: false,
      error: 'Nom de commune manquant.',
    };
  }

  const normCommune = normalizeLocationName(communeQuery);
  const wilaya = wilayaQuery ? findWilaya(wilayaQuery) : undefined;

  // 1. If wilaya was specified and resolved
  if (wilaya) {
    const communesInWilaya = getCommunesByWilayaId(wilaya.id);
    const matchInWilaya = communesInWilaya.find(
      (c) =>
        normalizeLocationName(c.name) === normCommune ||
        normalizeLocationName(c.ar_name) === normCommune ||
        normalizeLocationName(c.name).includes(normCommune) ||
        normCommune.includes(normalizeLocationName(c.name))
    );

    if (matchInWilaya) {
      return {
        valid: true,
        commune: matchInWilaya,
        wilaya,
        formattedWilaya: `${wilaya.code} - ${wilaya.name}`,
        formattedCommune: matchInWilaya.name,
        matchedCommuneName: matchInWilaya.name,
        matchedWilayaName: `${wilaya.code} - ${wilaya.name}`,
      };
    }

    // Commune not found in specified wilaya: check if it exists in another wilaya in Algeria
    const elsewhere = COMMUNES_2026.find(
      (c) =>
        normalizeLocationName(c.name) === normCommune ||
        normalizeLocationName(c.ar_name) === normCommune
    );

    if (elsewhere) {
      const correctWilaya = WILAYAS_2026.find((w) => w.id === elsewhere.wilaya_id);
      const correctWilayaName = correctWilaya
        ? `${correctWilaya.code} - ${correctWilaya.name}`
        : elsewhere.wilaya_id;
      return {
        valid: false,
        error: `La commune '${communeQuery.trim()}' existe en Algérie mais se trouve dans la wilaya de ${correctWilayaName}, pas dans ${wilaya.code} - ${wilaya.name}.`,
        suggestion: correctWilayaName,
      };
    }

    return {
      valid: false,
      error: `La commune '${communeQuery.trim()}' n'a pas été trouvée dans la wilaya de ${wilaya.code} - ${wilaya.name}.`,
    };
  }

  // 2. If no wilaya was specified or wilayaQuery couldn't be resolved
  const anyMatch = COMMUNES_2026.find(
    (c) =>
      normalizeLocationName(c.name) === normCommune ||
      normalizeLocationName(c.ar_name) === normCommune
  );

  if (anyMatch) {
    const parentWilaya = WILAYAS_2026.find((w) => w.id === anyMatch.wilaya_id);
    return {
      valid: true,
      commune: anyMatch,
      wilaya: parentWilaya,
      formattedWilaya: parentWilaya
        ? `${parentWilaya.code} - ${parentWilaya.name}`
        : anyMatch.wilaya_id,
      formattedCommune: anyMatch.name,
      matchedCommuneName: anyMatch.name,
      matchedWilayaName: parentWilaya
        ? `${parentWilaya.code} - ${parentWilaya.name}`
        : anyMatch.wilaya_id,
    };
  }

  // Fallback prefix search
  const prefixMatch = COMMUNES_2026.find((c) => {
    const nName = normalizeLocationName(c.name);
    return nName.startsWith(normCommune) || normCommune.startsWith(nName);
  });

  if (prefixMatch) {
    const parentWilaya = WILAYAS_2026.find((w) => w.id === prefixMatch.wilaya_id);
    return {
      valid: true,
      commune: prefixMatch,
      wilaya: parentWilaya,
      formattedWilaya: parentWilaya
        ? `${parentWilaya.code} - ${parentWilaya.name}`
        : prefixMatch.wilaya_id,
      formattedCommune: prefixMatch.name,
      matchedCommuneName: prefixMatch.name,
      matchedWilayaName: parentWilaya
        ? `${parentWilaya.code} - ${parentWilaya.name}`
        : prefixMatch.wilaya_id,
    };
  }

  return {
    valid: false,
    error: `La commune '${communeQuery.trim()}' n'existe pas dans le découpage administratif algérien officiel 2026.`,
  };
}
