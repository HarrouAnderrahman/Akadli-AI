import { describe, it, expect, vi } from "vitest";
import {
  createStandardizedDzOrder,
  buildElevenAgentsDynamicVariables,
  handleFinalizeOrderToolCall
} from "../src/index.js";
import { IEcommerceProvider, FinalizedOrderDecision } from "@akadli/adapter-contract";

describe("@akadli/core", () => {
  const baseOrderParams = {
    orderId: "ord_dz_999",
    storeName: "Algeria Footwear",
    customerName: "Ahmed Mansouri",
    rawCustomerPhone: "+213 (0) 550 11 22 33",
    itemName: "Chaussures Cuir Oxford",
    priceDa: 8900,
    currentSize: "42",
    rawWilaya: "13 - Tlemcen",
    rawCommune: "Mansoura",
    currentAddressNote: "Near the grand mosque",
    allowedSizes: ["41", "42", "43", "44"]
  };

  describe("createStandardizedDzOrder", () => {
    it("should build a valid canonical order with normalized phone, Wilaya, and commune", () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      expect(order.orderId).toBe("ord_dz_999");
      expect(order.customerPhone).toBe("0550112233");
      expect(order.currentWilaya).toBe("13");
      expect(order.currentCommune).toBe("Mansourah");
      expect(order.constraints.allowedSizes).toEqual(["41", "42", "43", "44"]);
      expect(order.constraints.allowedWilayas).toEqual(["13"]);
      expect(order.constraints.allowedCommunes.length).toBeGreaterThan(5);
      expect(order.constraints.allowedCommunes).toContain("Tlemcen");
    });
  });

  describe("buildElevenAgentsDynamicVariables", () => {
    it("should format all required ElevenAgents dynamic variables", () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      const vars = buildElevenAgentsDynamicVariables(order);

      expect(vars.order_id).toBe("ord_dz_999");
      expect(vars.store_name).toBe("Algeria Footwear");
      expect(vars.customer_name).toBe("Ahmed Mansouri");
      expect(vars.customer_phone_e164).toBe("+213550112233");
      expect(vars.item_name).toBe("Chaussures Cuir Oxford");
      expect(vars.price_da).toBe("8900");
      expect(vars.current_size).toBe("42");
      expect(vars.current_wilaya).toBe("13");
      expect(vars.current_commune).toBe("Mansourah");
      expect(vars.current_address_note).toBe("Near the grand mosque");
      expect(vars.allowed_sizes).toBe("41, 42, 43, 44");
      expect(vars.allowed_wilayas).toBe("13");
      expect(vars.allowed_communes).toContain("Mansourah");
    });
  });

  describe("handleFinalizeOrderToolCall", () => {
    const mockProvider: IEcommerceProvider = {
      verifyWebhook: vi.fn().mockResolvedValue(true),
      parseWebhookOrder: vi.fn(),
      applyOrderDecision: vi.fn().mockResolvedValue({
        success: true,
        externalStatus: "UPDATED"
      })
    };

    it("should accept and apply a valid CONFIRMED decision", async () => {
      const payload = {
        orderId: "ord_dz_999",
        status: "CONFIRMED",
        reasonOrNotes: "Customer confirmed all items"
      };

      const result = await handleFinalizeOrderToolCall(
        payload,
        mockProvider,
        { apiKey: "test_key" }
      );

      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe("UPDATED");
      expect(mockProvider.applyOrderDecision).toHaveBeenCalledWith(
        "ord_dz_999",
        expect.objectContaining({ status: "CONFIRMED" }),
        { apiKey: "test_key" }
      );
    });

    it("should accept and normalize a valid MODIFIED decision", async () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      const payload = {
        orderId: "ord_dz_999",
        status: "MODIFIED",
        finalSize: "43",
        finalCommune: "Mansoura",
        reasonOrNotes: "Customer requested size 43"
      };

      const result = await handleFinalizeOrderToolCall(
        payload,
        mockProvider,
        { apiKey: "test_key" },
        order.constraints
      );

      expect(result.success).toBe(true);
      expect(result.decision?.finalSize).toBe("43");
      expect(result.decision?.finalCommune).toBe("Mansourah");
    });

    it("should reject MODIFIED decision if finalSize is not in allowedSizes", async () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      const payload = {
        orderId: "ord_dz_999",
        status: "MODIFIED",
        finalSize: "50", // Not allowed
        reasonOrNotes: "Customer asked for size 50"
      };

      const result = await handleFinalizeOrderToolCall(
        payload,
        mockProvider,
        { apiKey: "test_key" },
        order.constraints
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_SIZE_CONSTRAINT");
    });

    it("should reject malformed tool payloads", async () => {
      const payload = {
        orderId: "",
        status: "INVALID_STATUS"
      };

      const result = await handleFinalizeOrderToolCall(
        payload,
        mockProvider,
        { apiKey: "test_key" }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid finalize_order_decision payload");
    });
  });
});
