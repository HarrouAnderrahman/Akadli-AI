import { createHmac, timingSafeEqual } from "node:crypto";
import {
  IEcommerceProvider,
  StandardizedDzOrder,
  FinalizedOrderDecision,
  FinalizedOrderDecisionSchema,
  ApplyOrderDecisionResult,
} from "@akadli/adapter-contract";
import { createStandardizedDzOrder } from "@akadli/core";
import {
  TassyirWebhookPayloadSchema,
  TassyirCredentialsSchema,
} from "./schemas.js";
import { TassyirClient } from "./tassyir-client.js";

export class TassyirProvider implements IEcommerceProvider {
  private readonly customFetch?: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.customFetch = fetchFn;
  }

  /**
   * Cryptographically verifies Tassyir's HMAC-SHA256 webhook signature.
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    const headerKey = Object.keys(headers).find((k) => {
      const lower = k.toLowerCase();
      return lower === "x-tassyir-signature" || lower === "x-akadli-signature";
    });
    const signature = headerKey ? headers[headerKey] : undefined;
    if (!signature || !secret) {
      return false;
    }

    try {
      const bodyBuffer =
        typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
      const calculatedHex = createHmac("sha256", secret)
        .update(bodyBuffer)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "utf8");
      const calcBuffer = Buffer.from(calculatedHex, "utf8");

      if (sigBuffer.length !== calcBuffer.length) {
        return false;
      }

      return timingSafeEqual(sigBuffer, calcBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parses and normalizes an inbound Tassyir orders webhook payload into a canonical StandardizedDzOrder.
   */
  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    const data = TassyirWebhookPayloadSchema.parse(payload);

    const orderId = String(data.id || data.order_id || data.tracking_id || "");
    const storeName = data.store_name || "Tassyir Store";

    const firstItem = data.items?.[0];
    const itemName = firstItem?.name || firstItem?.title || data.product_name || "Article";
    const currentSize = firstItem?.variant || firstItem?.size || data.size || "Standard";

    const priceDa = Math.round(Number(data.total_price ?? data.total ?? data.cod_amount ?? 0));

    const customerName =
      data.customer?.full_name ||
      data.customer?.name ||
      data.client_name ||
      data.full_name ||
      "Client";

    const rawCustomerPhone =
      data.customer?.phone ||
      data.client_phone ||
      data.phone ||
      data.customer_phone ||
      data.shipping_address?.phone ||
      "";

    const rawWilaya = String(
      data.customer?.wilaya ||
        data.wilaya ||
        data.wilaya_code ||
        data.wilaya_id ||
        data.shipping_address?.wilaya ||
        data.shipping_address?.province ||
        ""
    );

    const rawCommune = String(
      data.customer?.commune ||
        data.commune ||
        data.commune_name ||
        data.shipping_address?.commune ||
        data.shipping_address?.city ||
        ""
    );

    const currentAddressNote =
      data.customer?.address ||
      data.shipping_address?.address ||
      data.address ||
      data.delivery_note ||
      (data.stop_desk ? "Stop-Desk / Bureau" : undefined);

    return createStandardizedDzOrder({
      orderId,
      storeName,
      customerName,
      rawCustomerPhone,
      itemName,
      priceDa,
      currentSize,
      rawWilaya,
      rawCommune,
      currentAddressNote,
    });
  }

  /**
   * Applies the customer's finalized confirmation decision back to Tassyir ERP.
   */
  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    const validDecision = FinalizedOrderDecisionSchema.parse(decision);
    const validCreds = TassyirCredentialsSchema.parse(credentials);
    const client = new TassyirClient(validCreds, this.customFetch);

    if (validDecision.status === "CONFIRMED") {
      // Phase 1: Update ERP order status
      const updateRes = await client.updateOrder(orderId, {
        confirmation_status: "confirmed",
        tags: ["akadli-confirmed"],
        notes: "[Akadli-AI] Order CONFIRMED by customer.",
      });

      if (!updateRes.success) {
        return {
          success: false,
          externalStatus: updateRes.externalStatus,
          rawResponse: updateRes.rawResponse,
        };
      }

      // Phase 2: Two-Phase Courier Dispatch
      if (validCreds.dispatchOnConfirm !== "false") {
        const dispatchRes = await client.dispatchOrder(orderId, {
          ready_for_expedition: true,
          trigger_source: "akadli-ai",
        });

        return {
          success: dispatchRes.success,
          externalStatus: dispatchRes.success
            ? "CONFIRMED_AND_DISPATCHED"
            : dispatchRes.externalStatus,
          rawResponse: {
            update: updateRes.rawResponse,
            dispatch: dispatchRes.rawResponse,
          },
        };
      }

      return {
        success: true,
        externalStatus: "CONFIRMED",
        rawResponse: updateRes.rawResponse,
      };
    }

    if (validDecision.status === "MODIFIED") {
      const tags = ["akadli-modified"];
      if (validDecision.finalSize) {
        tags.push(`akadli-size-${validDecision.finalSize}`);
      }

      const noteParts: string[] = [];
      if (validDecision.finalSize) {
        noteParts.push(`Size -> ${validDecision.finalSize}`);
      }
      if (validDecision.finalWilaya) {
        noteParts.push(`Wilaya -> ${validDecision.finalWilaya}`);
      }
      if (validDecision.finalCommune) {
        noteParts.push(`Commune -> ${validDecision.finalCommune}`);
      }
      if (validDecision.finalAddressNote) {
        noteParts.push(`Note -> ${validDecision.finalAddressNote}`);
      }
      if (validDecision.reasonOrNotes) {
        noteParts.push(`Details: ${validDecision.reasonOrNotes}`);
      }
      const notes = `[Akadli-AI] Order MODIFIED: ${noteParts.join("; ")}`;

      const shippingAddressUpdate: Record<string, string> = {};
      if (validDecision.finalWilaya) {
        shippingAddressUpdate.wilaya = validDecision.finalWilaya;
      }
      if (validDecision.finalCommune) {
        shippingAddressUpdate.commune = validDecision.finalCommune;
      }
      if (validDecision.finalAddressNote) {
        shippingAddressUpdate.address = validDecision.finalAddressNote;
      }

      // Phase 1: Update ERP order with modifications
      const updateRes = await client.updateOrder(orderId, {
        confirmation_status: "confirmed",
        shipping_address:
          Object.keys(shippingAddressUpdate).length > 0
            ? shippingAddressUpdate
            : undefined,
        variant_size: validDecision.finalSize,
        tags,
        notes,
      });

      if (!updateRes.success) {
        return {
          success: false,
          externalStatus: updateRes.externalStatus,
          rawResponse: updateRes.rawResponse,
        };
      }

      // Phase 2: Dispatch with updated shipping details for courier bordereau
      if (validCreds.dispatchOnConfirm !== "false") {
        const dispatchRes = await client.dispatchOrder(orderId, {
          ready_for_expedition: true,
          trigger_source: "akadli-ai",
          shipping_address:
            Object.keys(shippingAddressUpdate).length > 0
              ? shippingAddressUpdate
              : undefined,
          variant_size: validDecision.finalSize,
        });

        return {
          success: dispatchRes.success,
          externalStatus: dispatchRes.success
            ? "UPDATED_AND_DISPATCHED"
            : dispatchRes.externalStatus,
          rawResponse: {
            update: updateRes.rawResponse,
            dispatch: dispatchRes.rawResponse,
          },
        };
      }

      return {
        success: true,
        externalStatus: "UPDATED_AND_CONFIRMED",
        rawResponse: updateRes.rawResponse,
      };
    }

    // REFUSED
    const refusalNotes = `[Akadli-AI] Order REFUSED: ${validDecision.reasonOrNotes || "Customer refused order."}`;
    const status = validCreds.cancelOnRefused !== "false" ? "cancelled" : "pending";

    const updateRes = await client.updateOrder(orderId, {
      confirmation_status: "refused",
      status,
      tags: ["akadli-refused"],
      notes: refusalNotes,
    });

    return {
      success: updateRes.success,
      externalStatus: updateRes.success ? "REFUSED" : updateRes.externalStatus,
      rawResponse: updateRes.rawResponse,
    };
  }
}
