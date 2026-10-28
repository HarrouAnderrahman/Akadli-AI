import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  createStandardizedDzOrder,
  buildElevenAgentsDynamicVariables,
  handleFinalizeOrderToolCall,
  fetchElevenLabsConversationTranscript,
  fetchElevenLabsConversationAudio
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
    currentVariant: "42",
    rawWilaya: "13 - Tlemcen",
    rawCommune: "Mansoura",
    currentAddressNote: "Near the grand mosque",
    allowedVariants: ["41", "42", "43", "44"]
  };

  describe("createStandardizedDzOrder", () => {
    it("should build a valid canonical order with normalized phone, Wilaya, and commune", () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      expect(order.orderId).toBe("ord_dz_999");
      expect(order.customerPhone).toBe("0550112233");
      expect(order.quantity).toBe(1);
      expect(order.shippingFeeDa).toBe(0);
      expect(order.priceDa).toBe(8900);
      expect(order.currentWilaya).toBe("13");
      expect(order.currentCommune).toBe("Mansourah");
      expect(order.constraints.allowedVariants).toEqual(["41", "42", "43", "44"]);
      expect(order.constraints.allowedWilayas).toEqual(["13"]);
      expect(order.constraints.allowedCommunes.length).toBeGreaterThan(5);
      expect(order.constraints.allowedCommunes).toContain("Tlemcen");
    });

    it("should accept and coerce explicit quantity and shippingFeeDa", () => {
      const order = createStandardizedDzOrder({
        ...baseOrderParams,
        quantity: 2,
        shippingFeeDa: 600,
        priceDa: 9500
      });
      expect(order.quantity).toBe(2);
      expect(order.shippingFeeDa).toBe(600);
      expect(order.priceDa).toBe(9500);
    });
  });

  describe("buildElevenAgentsDynamicVariables", () => {
    it("should format all required ElevenAgents dynamic variables including quantity, shipping_fee_da, and subtotal_da", () => {
      const order = createStandardizedDzOrder({
        ...baseOrderParams,
        quantity: 2,
        shippingFeeDa: 600
      });
      const vars = buildElevenAgentsDynamicVariables(order);

      expect(vars.order_id).toBe("ord_dz_999");
      expect(vars.store_name).toBe("Algeria Footwear");
      expect(vars.customer_name).toBe("Ahmed Mansouri");
      expect(vars.customer_phone_e164).toBe("+213550112233");
      expect(vars.item_name).toBe("Chaussures Cuir Oxford");
      expect(vars.quantity).toBe("2");
      expect(vars.shipping_fee_da).toBe("600");
      expect(vars.subtotal_da).toBe("8300");
      expect(vars.price_da).toBe("8900");
      expect(vars.current_variant).toBe("42");
      expect(vars.current_wilaya).toBe("13");
      expect(vars.current_commune).toBe("Mansourah");
      expect(vars.current_address_note).toBe("Near the grand mosque");
      expect(vars.allowed_variants).toBe("41, 42, 43, 44");
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
        finalVariant: "43",
        finalCommune: "Mansoura",
        reasonOrNotes: "Customer requested variant 43"
      };

      const result = await handleFinalizeOrderToolCall(
        payload,
        mockProvider,
        { apiKey: "test_key" },
        order.constraints
      );

      expect(result.success).toBe(true);
      expect(result.decision?.finalVariant).toBe("43");
      expect(result.decision?.finalCommune).toBe("Mansourah");
    });

    it("should reject MODIFIED decision if finalVariant is not in allowedVariants", async () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      const payload = {
        orderId: "ord_dz_999",
        status: "MODIFIED",
        finalVariant: "50", // Not allowed
        reasonOrNotes: "Customer asked for variant 50"
      };

      const result = await handleFinalizeOrderToolCall(
        payload,
        mockProvider,
        { apiKey: "test_key" },
        order.constraints
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_VARIANT_CONSTRAINT");
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

    it("should accept raw snake_case ElevenLabs tool payload and normalize Wilaya string", async () => {
      const order = createStandardizedDzOrder(baseOrderParams);
      const snakePayload = {
        order_id: "ord_dz_999",
        status: "MODIFIED",
        final_variant: "42",
        final_wilaya: "13 - Tlemcen",
        final_commune: "Mansoura",
        reason_or_notes: "Customer confirmed over voice"
      };

      const result = await handleFinalizeOrderToolCall(
        snakePayload,
        mockProvider,
        { apiKey: "test_key" },
        order.constraints
      );

      expect(result.success).toBe(true);
      expect(result.decision?.orderId).toBe("ord_dz_999");
      expect(result.decision?.finalVariant).toBe("42");
      expect(result.decision?.finalWilaya).toBe("13");
      expect(result.decision?.finalCommune).toBe("Mansourah");
    });

    it("should support backwards-compatible final_size and final_quantity in tool payload", async () => {
      const order = createStandardizedDzOrder({ ...baseOrderParams, quantity: 2 });
      const legacyPayload = {
        order_id: "ord_dz_999",
        status: "MODIFIED",
        final_size: "42",
        final_quantity: 3,
        final_wilaya: "13 - Tlemcen",
        reason_or_notes: "Legacy tool call"
      };

      const result = await handleFinalizeOrderToolCall(
        legacyPayload,
        mockProvider,
        { apiKey: "test_key" },
        order.constraints,
        order
      );

      expect(result.success).toBe(true);
      expect(result.decision?.finalVariant).toBe("42");
      expect(result.decision?.finalQuantity).toBe(3);

      // Also verify fallback to order.quantity when final_quantity is omitted
      const fallbackResult = await handleFinalizeOrderToolCall(
        {
          order_id: "ord_dz_999",
          status: "CONFIRMED"
        },
        mockProvider,
        { apiKey: "test_key" },
        order.constraints,
        order
      );
      expect(fallbackResult.success).toBe(true);
      expect(fallbackResult.decision?.finalQuantity).toBe(2);
    });
  });

  describe("ElevenLabs Conversation Logs & Audio Helpers (MSW)", () => {
    const CONV_ID = "conv_dz_test_12345";
    const API_KEY = "xi_test_api_key_secret";
    const FAKE_MP3_BYTES = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0xff, 0xfb, 0x90]);

    let capturedHeaders: Record<string, string | null> = {};

    const mswServer = setupServer(
      http.get(
        `https://api.elevenlabs.io/v1/convai/conversations/${CONV_ID}`,
        ({ request }) => {
          capturedHeaders["xi-api-key"] = request.headers.get("xi-api-key");
          return HttpResponse.json({
            conversation_id: CONV_ID,
            status: "done",
            has_audio: true,
            has_user_audio: true,
            has_response_audio: true,
            transcript: [
              {
                role: "agent",
                message: "Salam Ahmed, m3ak Akadli men Algeria Footwear.",
                time_in_call_secs: 1
              },
              {
                role: "user",
                message: "Wa3likoum salam, oui rani nesma3 fik.",
                time_in_call_secs: 5
              },
              {
                role: "agent",
                message: "Confirmينا الطلبية تاعك في منصورة تلمسان. شكرا!",
                time_in_call_secs: 12
              }
            ],
            metadata: {
              call_duration_secs: 18
            }
          });
        }
      ),
      http.get(
        `https://api.elevenlabs.io/v1/convai/conversations/${CONV_ID}/audio`,
        ({ request }) => {
          capturedHeaders["xi-api-key"] = request.headers.get("xi-api-key");
          return new HttpResponse(FAKE_MP3_BYTES, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg"
            }
          });
        }
      )
    );

    beforeAll(() => {
      mswServer.listen({ onUnhandledRequest: "error" });
    });

    afterEach(() => {
      capturedHeaders = {};
      mswServer.resetHandlers();
    });

    afterAll(() => {
      mswServer.close();
    });

    it("fetchElevenLabsConversationTranscript should retrieve and normalize STT transcript turns", async () => {
      const result = await fetchElevenLabsConversationTranscript(CONV_ID, API_KEY);

      expect(capturedHeaders["xi-api-key"]).toBe(API_KEY);
      expect(result.conversationId).toBe(CONV_ID);
      expect(result.status).toBe("done");
      expect(result.durationSecs).toBe(18);
      expect(result.hasAudio).toBe(true);
      expect(result.transcript).toEqual([
        {
          role: "agent",
          message: "Salam Ahmed, m3ak Akadli men Algeria Footwear.",
          timeInCallSecs: 1
        },
        {
          role: "user",
          message: "Wa3likoum salam, oui rani nesma3 fik.",
          timeInCallSecs: 5
        },
        {
          role: "agent",
          message: "Confirmينا الطلبية تاعك في منصورة تلمسان. شكرا!",
          timeInCallSecs: 12
        }
      ]);
    });

    it("fetchElevenLabsConversationAudio should retrieve raw MP3 bytes as Uint8Array", async () => {
      const audioBytes = await fetchElevenLabsConversationAudio(CONV_ID, API_KEY);

      expect(capturedHeaders["xi-api-key"]).toBe(API_KEY);
      expect(audioBytes).toBeInstanceOf(Uint8Array);
      expect(Array.from(audioBytes)).toEqual(Array.from(FAKE_MP3_BYTES));
    });
  });
});
