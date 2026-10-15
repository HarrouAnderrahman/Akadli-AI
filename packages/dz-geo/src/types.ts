import { WilayaCode } from "@akadli/adapter-contract";

export interface NormalizedWilayaResult {
  code: WilayaCode;
  nameFr: string;
  nameAr: string;
  canonicalLabel: string; // e.g. "13 - Tlemcen"
}

export interface WilayaRecord {
  code: WilayaCode;
  nameFr: string;
  nameAr: string;
  canonicalLabel: string;
  aliases: string[];
}

export interface CommuneMatchResult {
  canonicalCommune: string;
  matched: boolean;
}
