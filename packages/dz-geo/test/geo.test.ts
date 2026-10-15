import { describe, it, expect } from "vitest";
import {
  normalizeDzPhone,
  InvalidDzPhoneError,
  normalizeWilaya,
  InvalidWilayaError,
  getCommunesForWilaya,
  normalizeCommune,
  WILAYAS_58,
  WILAYAS_69,
  WILAYAS_ALL
} from "../src/index.js";

describe("@dz-voice/dz-geo", () => {
  describe("Phone Normalization (normalizeDzPhone)", () => {
    it("should normalize local 10-digit mobile numbers", () => {
      expect(normalizeDzPhone("0550123456")).toBe("0550123456");
      expect(normalizeDzPhone("0661234567")).toBe("0661234567");
      expect(normalizeDzPhone("0770998877")).toBe("0770998877");
    });

    it("should normalize formatted strings with spaces, dashes, dots, and parentheses", () => {
      expect(normalizeDzPhone("05 50 12 34 56")).toBe("0550123456");
      expect(normalizeDzPhone("06-61-23-45-67")).toBe("0661234567");
      expect(normalizeDzPhone("+213 (0) 770.99.88.77")).toBe("0770998877");
    });

    it("should convert 00213 and +213 prefixes into local or E.164 format", () => {
      expect(normalizeDzPhone("00213550123456", "local")).toBe("0550123456");
      expect(normalizeDzPhone("00213550123456", "e164")).toBe("+213550123456");
      expect(normalizeDzPhone("+213661234567", "local")).toBe("0661234567");
      expect(normalizeDzPhone("+213661234567", "e164")).toBe("+213661234567");
      expect(normalizeDzPhone("213770123456", "local")).toBe("0770123456");
      expect(normalizeDzPhone("213770123456", "e164")).toBe("+213770123456");
    });

    it("should strip redundant trunk-zero in international format (+2130...)", () => {
      expect(normalizeDzPhone("+2130550123456", "local")).toBe("0550123456");
      expect(normalizeDzPhone("+2130550123456", "e164")).toBe("+213550123456");
    });

    it("should reject landline numbers or invalid prefixes", () => {
      expect(() => normalizeDzPhone("021123456")).toThrow(InvalidDzPhoneError);
      expect(() => normalizeDzPhone("041123456")).toThrow(InvalidDzPhoneError);
      expect(() => normalizeDzPhone("023123456")).toThrow(InvalidDzPhoneError);
      expect(() => normalizeDzPhone("123456")).toThrow(InvalidDzPhoneError);
    });
  });

  describe("Wilaya Normalization (normalizeWilaya)", () => {
    it("should contain exactly 69 official Algerian Wilayas (and 58 in backward-compatible subset)", () => {
      expect(WILAYAS_ALL).toHaveLength(69);
      expect(WILAYAS_69).toHaveLength(69);
      expect(WILAYAS_58).toHaveLength(58);
    });

    it("Stage 1: should normalize numeric inputs and codes up to 69", () => {
      expect(normalizeWilaya(1).code).toBe("01");
      expect(normalizeWilaya(16).code).toBe("16");
      expect(normalizeWilaya(58).code).toBe("58");
      expect(normalizeWilaya(59).code).toBe("59");
      expect(normalizeWilaya(68).code).toBe("68");
      expect(normalizeWilaya(69).code).toBe("69");
      expect(normalizeWilaya("16").code).toBe("16");
      expect(normalizeWilaya("69").code).toBe("69");
      expect(normalizeWilaya("13 - Tlemcen").code).toBe("13");
      expect(normalizeWilaya("68 - Bou Saada").code).toBe("68");
      expect(normalizeWilaya("Wilaya 09").code).toBe("09");
      expect(normalizeWilaya("Wilaya 59").code).toBe("59");
      expect(normalizeWilaya("31 Oran").code).toBe("31");
    });

    it("Stage 2: should normalize French names with diacritics and accents (including 2026 Wilayas)", () => {
      const alger = normalizeWilaya("Alger");
      expect(alger.code).toBe("16");
      expect(alger.canonicalLabel).toBe("16 - Alger");

      const bejaia = normalizeWilaya("Béjaïa");
      expect(bejaia.code).toBe("06");

      const msila = normalizeWilaya("M'Sila");
      expect(msila.code).toBe("28");

      const tizi = normalizeWilaya("Tizi Ouzou");
      expect(tizi.code).toBe("15");

      const bouSaada = normalizeWilaya("Bou Saada");
      expect(bouSaada.code).toBe("68");
      expect(bouSaada.canonicalLabel).toBe("68 - Bou Saada");

      const aflou = normalizeWilaya("Aflou");
      expect(aflou.code).toBe("59");

      const barika = normalizeWilaya("Barika");
      expect(barika.code).toBe("60");

      const sidiCheikh = normalizeWilaya("El Abiodh Sidi Cheikh");
      expect(sidiCheikh.code).toBe("69");
    });

    it("Stage 2: should normalize Arabic names with Alef and Teh Marbuta variations", () => {
      expect(normalizeWilaya("الجزائر").code).toBe("16");
      expect(normalizeWilaya("الجزائر العاصمة").code).toBe("16");
      expect(normalizeWilaya("وهران").code).toBe("31");
      expect(normalizeWilaya("قسنطينة").code).toBe("25");
      expect(normalizeWilaya("أم البواقي").code).toBe("04");
      expect(normalizeWilaya("ام البواقي").code).toBe("04");
      expect(normalizeWilaya("ولاية البليدة").code).toBe("09");
      expect(normalizeWilaya("تلمسان").code).toBe("13");

      // 2026 Wilayas in Arabic
      expect(normalizeWilaya("بوسعادة").code).toBe("68");
      expect(normalizeWilaya("بوسعاده").code).toBe("68");
      expect(normalizeWilaya("أفلو").code).toBe("59");
      expect(normalizeWilaya("افلو").code).toBe("59");
      expect(normalizeWilaya("بريكة").code).toBe("60");
      expect(normalizeWilaya("الأبيض سيدي الشيخ").code).toBe("69");
      expect(normalizeWilaya("الابيض سيدي الشيخ").code).toBe("69");
    });

    it("Stage 3: should match common abbreviations and Arabizi aliases", () => {
      expect(normalizeWilaya("sba").code).toBe("22"); // Sidi Bel Abbes
      expect(normalizeWilaya("oeb").code).toBe("04"); // Oum El Bouaghi
      expect(normalizeWilaya("bba").code).toBe("34"); // Bordj Bou Arreridj
      expect(normalizeWilaya("dzayer").code).toBe("16"); // Alger
      expect(normalizeWilaya("tam").code).toBe("11"); // Tamanrasset
      expect(normalizeWilaya("bousaada").code).toBe("68"); // Bou Saada
    });

    it("Stage 4: should fuzzy match small typos", () => {
      expect(normalizeWilaya("tilimsen").code).toBe("13");
      expect(normalizeWilaya("ghilizane").code).toBe("48");
      expect(normalizeWilaya("mosta").code).toBe("27");
      expect(normalizeWilaya("bou saada").code).toBe("68");
    });

    it("should throw InvalidWilayaError for unknown locations and out-of-range numbers", () => {
      expect(() => normalizeWilaya("Paris")).toThrow(InvalidWilayaError);
      expect(() => normalizeWilaya("UnknownPlace123")).toThrow(InvalidWilayaError);
      expect(() => normalizeWilaya("")).toThrow(InvalidWilayaError);
      expect(() => normalizeWilaya(0)).toThrow(InvalidWilayaError);
      expect(() => normalizeWilaya(70)).toThrow(InvalidWilayaError);
      expect(() => normalizeWilaya("70")).toThrow(InvalidWilayaError);
      expect(() => normalizeWilaya(99)).toThrow(InvalidWilayaError);
    });
  });

  describe("Commune Resolution (getCommunesForWilaya & normalizeCommune)", () => {
    it("should return official communes for Wilaya 16 (Alger)", () => {
      const communes = getCommunesForWilaya("16");
      expect(communes.length).toBeGreaterThan(10);
      expect(communes).toContain("Bab El Oued");
    });

    it("should return official communes for Wilaya 13 (Tlemcen)", () => {
      const communes = getCommunesForWilaya("13");
      expect(communes.length).toBeGreaterThan(10);
      expect(communes).toContain("Tlemcen");
    });

    it("should return official communes for Wilaya 68 (Bou Saada)", () => {
      const communes = getCommunesForWilaya("68");
      expect(communes.length).toBeGreaterThan(0);
      expect(communes).toContain("Bou Saada");
    });

    it("should return official communes for Wilaya 69 (El Abiodh Sidi Cheikh)", () => {
      const communes = getCommunesForWilaya("69");
      expect(communes.length).toBeGreaterThan(0);
      expect(communes).toContain("El Abiodh Sidi Cheikh");
    });

    it("should normalize exact commune name", () => {
      const res = normalizeCommune("Bab El Oued", "16");
      expect(res.matched).toBe(true);
      expect(res.canonicalCommune).toBe("Bab El Oued");
    });

    it("should match commune with trailing-h difference (Mansoura vs Mansourah)", () => {
      const res = normalizeCommune("Mansoura", "13");
      expect(res.matched).toBe(true);
      expect(res.canonicalCommune).toBe("Mansourah");
    });

    it("should match Arabic commune name to official French name", () => {
      const res = normalizeCommune("بوسعادة", "68");
      expect(res.matched).toBe(true);
      expect(res.canonicalCommune).toBe("Bou Saada");
    });

    it("should gracefully return trimmed raw input when commune is unrecognized", () => {
      const res = normalizeCommune("Nonexistent Village", "16");
      expect(res.matched).toBe(false);
      expect(res.canonicalCommune).toBe("Nonexistent Village");
    });
  });
});
