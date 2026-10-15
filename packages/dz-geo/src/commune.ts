import { WilayaCode } from "@dz-voice/adapter-contract";
import { COMMUNES_BY_WILAYA, ARABIC_TO_FRENCH_COMMUNES } from "./data/communes.js";
import { canonicalizeGeoToken } from "./wilaya.js";
import { CommuneMatchResult } from "./types.js";

/**
 * Legacy parent wilaya mappings for the 10 southern Wilayas created in 2019/2021.
 * When older checkout forms specify the legacy parent wilaya with a commune that
 * now has its own wilaya code, we can detect and suggest/upgrade the code.
 */
export const LEGACY_PARENT_WILAYAS: Record<string, WilayaCode> = {
  "49": "01", // Timimoun was Adrar
  "50": "01", // Bordj Badji Mokhtar was Adrar
  "51": "07", // Ouled Djellal was Biskra
  "52": "08", // Beni Abbes was Bechar
  "53": "11", // In Salah was Tamanrasset
  "54": "11", // In Guezzam was Tamanrasset
  "55": "30", // Touggourt was Ouargla
  "56": "33", // Djanet was Illizi
  "57": "39", // El M'Ghair was El Oued
  "58": "47"  // El Meniaa was Ghardaia
};

/**
 * Returns all official communes for a given Wilaya code ("01" to "58").
 */
export function getCommunesForWilaya(wilayaCode: WilayaCode): readonly string[] {
  return COMMUNES_BY_WILAYA[wilayaCode] || [];
}

/**
 * Strips trailing 'h' (e.g. "Mansourah" -> "Mansoura")
 */
function stripTrailingH(s: string): string {
  return s.replace(/([a-z]{3,})h$/i, "$1");
}

/**
 * Resolves a commune spelling variation against the official commune list for the resolved Wilaya.
 */
export function resolveCommuneForWilaya(
  rawCommune: string,
  allowedCommunesForWilaya: readonly string[],
  arabicToFrenchCommuneMap: Record<string, string> = ARABIC_TO_FRENCH_COMMUNES
): CommuneMatchResult {
  if (!rawCommune || !rawCommune.trim()) {
    return { canonicalCommune: "", matched: false };
  }

  const cleaned = canonicalizeGeoToken(rawCommune);

  // 1. Direct Arabic-to-French lookup within the Wilaya
  if (arabicToFrenchCommuneMap[rawCommune.trim()]) {
    const frName = arabicToFrenchCommuneMap[rawCommune.trim()];
    if (frName && allowedCommunesForWilaya.includes(frName)) {
      return { canonicalCommune: frName, matched: true };
    }
  }

  if (arabicToFrenchCommuneMap[cleaned]) {
    const frName = arabicToFrenchCommuneMap[cleaned];
    if (frName && allowedCommunesForWilaya.includes(frName)) {
      return { canonicalCommune: frName, matched: true };
    }
  }

  // 2. Exact match or trailing-'h' match (e.g. "mansoura" == "mansourah")
  const cleanedNoH = stripTrailingH(cleaned);

  for (const candidate of allowedCommunesForWilaya) {
    const candidateClean = canonicalizeGeoToken(candidate);
    if (
      candidateClean === cleaned ||
      stripTrailingH(candidateClean) === cleanedNoH
    ) {
      return { canonicalCommune: candidate, matched: true };
    }
  }

  // 3. Substring match if commune candidate contains cleaned name or vice versa
  for (const candidate of allowedCommunesForWilaya) {
    const candidateClean = canonicalizeGeoToken(candidate);
    if (
      cleaned.length >= 4 &&
      (candidateClean.startsWith(cleaned) || cleaned.startsWith(candidateClean))
    ) {
      return { canonicalCommune: candidate, matched: true };
    }
  }

  // 4. Fallback: return trimmed input so voice agent can clarify with the customer
  return { canonicalCommune: rawCommune.trim(), matched: false };
}

/**
 * Convenience helper to normalize a commune for a given Wilaya code.
 */
export function normalizeCommune(
  rawCommune: string,
  wilayaCode: WilayaCode
): CommuneMatchResult {
  const allowed = getCommunesForWilaya(wilayaCode);
  return resolveCommuneForWilaya(rawCommune, allowed);
}
