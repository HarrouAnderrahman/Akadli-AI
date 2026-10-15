import { describe, it, expect } from "vitest";
import {
  WILAYA_CODES,
  WilayaCodeSchema,
  DzPhoneSchema,
  OrderConstraintsSchema,
  StandardizedDzOrderSchema,
  FinalizedOrderDecisionSchema,
  StandardizedDzOrder,
  FinalizedOrderDecision
} from "../src/index.js";

describe("@dz-voice/adapter-contract", () => {
  describe("WilayaCodeSchema", () => {
    it("should accept zero-padded codes 01 through 69", () => {
      expect(WILAYA_CODES).toHaveLength(69);
      expect(WilayaCodeSchema.parse("01")).toBe("01");
      expect(WilayaCodeSchema.parse("16")).toBe("16");
      expect(WilayaCodeSchema.parse("58")).toBe("58");
      expect(WilayaCodeSchema.parse("69")).toBe("69");
    });

    it("should reject invalid, unpadded, or out-of-range wilaya codes", () => {
      expect(() => WilayaCodeSchema.parse("1")).toThrow();
      expect(() => WilayaCodeSchema.parse("00")).toThrow();
      expect(() => WilayaCodeSchema.parse("70")).toThrow();
      expect(() => WilayaCodeSchema.parse("Alger")).toThrow();
      expect(() => WilayaCodeSchema.parse(16 as any)).toThrow();
    });
  });

  describe("DzPhoneSchema", () => {
    it("should accept valid local 10-digit mobile numbers (05, 06, 07)", () => {
      expect(DzPhoneSchema.parse("0550123456")).toBe("0550123456");
      expect(DzPhoneSchema.parse("0661234567")).toBe("0661234567");
      expect(DzPhoneSchema.parse("0770987654")).toBe("0770987654");
    });

    it("should accept valid E.164 mobile numbers (+213[567]...)", () => {
      expect(DzPhoneSchema.parse("+213550123456")).toBe("+213550123456");
      expect(DzPhoneSchema.parse("+213661234567")).toBe("+213661234567");
      expect(DzPhoneSchema.parse("+213770987654")).toBe("+213770987654");
    });

    it("should reject landlines, invalid prefixes, or unnormalized formats", () => {
      expect(() => DzPhoneSchema.parse("021123456")).toThrow(); // Landline
      expect(() => DzPhoneSchema.parse("041123456")).toThrow(); // Landline
      expect(() => DzPhoneSchema.parse("0550-12-34-56")).toThrow(); // Unstripped
      expect(() => DzPhoneSchema.parse("+2130550123456")).toThrow(); // Trunk zero present
      expect(() => DzPhoneSchema.parse("12345")).toThrow();
    });
  });

  describe("StandardizedDzOrderSchema", () => {
    const validOrder: StandardizedDzOrder = {
      orderId: "ord_12345",
      storeName: "DzStyle Store",
      customerName: "Karim Benali",
      customerPhone: "0550123456",
      itemName: "Veste Cuir Bomber Noir",
      priceDa: 6500,
      currentSize: "XL",
      currentWilaya: "16",
      currentCommune: "Bab El Oued",
      currentAddressNote: "Near the post office",
      constraints: {
        allowedSizes: ["M", "L", "XL", "XXL"],
        allowedWilayas: ["16", "09", "35"],
        allowedCommunes: ["Bab El Oued", "Casbah", "Hydra", "Kouba"]
      }
    };

    it("should validate a canonical standardized order", () => {
      const parsed = StandardizedDzOrderSchema.parse(validOrder);
      expect(parsed.orderId).toBe("ord_12345");
      expect(parsed.currentWilaya).toBe("16");
      expect(parsed.priceDa).toBe(6500);
      expect(parsed.constraints.allowedSizes).toContain("XL");
    });

    it("should reject orders with missing required fields", () => {
      const invalid = { ...validOrder, customerName: "" };
      expect(() => StandardizedDzOrderSchema.parse(invalid)).toThrow();
    });

    it("should reject negative prices", () => {
      const invalid = { ...validOrder, priceDa: -100 };
      expect(() => StandardizedDzOrderSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid constraints (empty allowed arrays)", () => {
      const invalid = {
        ...validOrder,
        constraints: {
          allowedSizes: [],
          allowedWilayas: ["16"],
          allowedCommunes: ["Bab El Oued"]
        }
      };
      expect(() => StandardizedDzOrderSchema.parse(invalid)).toThrow();
    });
  });

  describe("FinalizedOrderDecisionSchema", () => {
    it("should validate CONFIRMED decision without modification fields", () => {
      const decision: FinalizedOrderDecision = {
        orderId: "ord_12345",
        status: "CONFIRMED",
        reasonOrNotes: "Customer confirmed all items unchanged"
      };
      const parsed = FinalizedOrderDecisionSchema.parse(decision);
      expect(parsed.status).toBe("CONFIRMED");
      expect(parsed.finalSize).toBeUndefined();
    });

    it("should validate REFUSED decision with cancellation reason", () => {
      const decision: FinalizedOrderDecision = {
        orderId: "ord_12345",
        status: "REFUSED",
        reasonOrNotes: "Customer found it too expensive"
      };
      const parsed = FinalizedOrderDecisionSchema.parse(decision);
      expect(parsed.status).toBe("REFUSED");
    });

    it("should validate MODIFIED decision when at least one modification is provided", () => {
      const sizeModified: FinalizedOrderDecision = {
        orderId: "ord_12345",
        status: "MODIFIED",
        finalSize: "L",
        reasonOrNotes: "Customer requested L instead of XL"
      };
      expect(FinalizedOrderDecisionSchema.parse(sizeModified).finalSize).toBe("L");

      const communeModified: FinalizedOrderDecision = {
        orderId: "ord_12345",
        status: "MODIFIED",
        finalCommune: "Hydra",
        reasonOrNotes: "Deliver to office instead"
      };
      expect(FinalizedOrderDecisionSchema.parse(communeModified).finalCommune).toBe("Hydra");
    });

    it("should reject MODIFIED decision when no modification fields are supplied", () => {
      const invalidModified = {
        orderId: "ord_12345",
        status: "MODIFIED",
        reasonOrNotes: "User claimed modification but none was specified"
      };
      expect(() => FinalizedOrderDecisionSchema.parse(invalidModified)).toThrow(
        /When status is ["\\]+MODIFIED["\\]+, at least one of finalSize/
      );
    });
  });
});
