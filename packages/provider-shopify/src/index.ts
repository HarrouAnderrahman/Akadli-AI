import { createHmac, timingSafeEqual } from "node:crypto";
import {
  IEcommerceProvider,
  StandardizedDzOrder,
  FinalizedOrderDecision,
  FinalizedOrderDecisionSchema,
  ApplyOrderDecisionResult
} from "@akadli/adapter-contract";
import { createStandardizedDzOrder } from "@akadli/core";
import {
  ShopifyOrderWebhookPayloadSchema,
  ShopifyCredentialsSchema
} from "./schemas.js";
import { ShopifyClient } from "./client.js";

export * from "./schemas.js";
export * from "./client.js";

export class ShopifyProvider implements IEcommerceProvider {
  private readonly customFetch?: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.customFetch = fetchFn;
  }

  /**
   * Cryptographically verifies Shopify's HMAC-SHA256 webhook signature.
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    const headerKey = Object.keys(headers).find(
      (k) => k.toLowerCase() === "x-shopify-hmac-sha256"
    );
    const signature = headerKey ? headers[headerKey] : undefined;
    if (!signature || !secret) {
      return false;
    }

    try {
      const bodyBuffer =
        typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
      const calculatedHmac = createHmac("sha256", secret)
        .update(bodyBuffer)
        .digest("base64");

      const sigBuffer = Buffer.from(signature, "utf8");
      const calcBuffer = Buffer.from(calculatedHmac, "utf8");

      if (sigBuffer.length !== calcBuffer.length) {
        return false;
      }

      return timingSafeEqual(sigBuffer, calcBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parses and normalizes an inbound Shopify orders/create webhook payload into
   * a canonical StandardizedDzOrder using dual-source address extraction (shipping_address + note_attributes).
   */
  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    const data = ShopifyOrderWebhookPayloadSchema.parse(payload);

    // Helpers to scan note_attributes for Algerian COD form apps (EasySell, Releasit, CodForm, etc.)
    const phonePatterns = [/(?:phone|téléphone|telephone|tel|هاتف|تلفون)/i];
    const wilayaPatterns = [/(?:wilaya|province|ولاية)/i];
    const communePatterns = [/(?:commune|city|بلدية)/i];
    const addressPatterns = [/(?:address|adresse|عنوان)/i];
    const namePatterns = [/(?:^nom$|^name$|^full[_\s]?name$|اسم)/i];

    const findInNotes = (patterns: RegExp[]): string | undefined => {
      for (const attr of data.note_attributes) {
        if (!attr.value) continue;
        const val = String(attr.value).trim();
        if (!val) continue;
        for (const pattern of patterns) {
          if (pattern.test(attr.name)) {
            return val;
          }
        }
      }
      return undefined;
    };

    // 1. Phone extraction
    const rawCustomerPhone =
      data.shipping_address?.phone ||
      data.billing_address?.phone ||
      data.customer?.phone ||
      findInNotes(phonePatterns) ||
      "";

    // 2. Wilaya extraction
    const rawWilaya =
      data.shipping_address?.province ||
      data.shipping_address?.province_code ||
      findInNotes(wilayaPatterns) ||
      "";

    // 3. Commune extraction
    const rawCommune =
      data.shipping_address?.city ||
      findInNotes(communePatterns) ||
      "";

    // 4. Customer Name extraction
    const customerFullName = [data.customer?.first_name, data.customer?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const noteName = findInNotes(namePatterns);
    const rawAddressName = data.shipping_address?.name?.trim();
    const isGenericAddressName =
      !rawAddressName || /^(?:client(?:\s+cod)?|cod|customer)$/i.test(rawAddressName);

    const customerName =
      (isGenericAddressName && noteName)
        ? noteName
        : rawAddressName ||
          (customerFullName.length > 0 ? customerFullName : undefined) ||
          noteName ||
          "Client";

    // 5. Address note extraction
    const shippingAddressLines = [
      data.shipping_address?.address1,
      data.shipping_address?.address2
    ]
      .filter(Boolean)
      .join(", ")
      .trim();

    const currentAddressNote =
      (shippingAddressLines.length > 0 ? shippingAddressLines : undefined) ||
      findInNotes(addressPatterns);

    // 6. Items & Pricing
    const firstItem = data.line_items[0];
    const itemName = firstItem?.title || "Article";
    const currentSize = firstItem?.variant_title || "Standard";
    const priceDa = Math.round(Number(data.total_price || 0));
    const storeName = data.shop_name || data.store_name || "Shopify Store";

    return createStandardizedDzOrder({
      orderId: String(data.id),
      storeName,
      customerName,
      rawCustomerPhone,
      itemName,
      priceDa,
      currentSize,
      rawWilaya,
      rawCommune,
      currentAddressNote
    });
  }

  /**
   * Applies the customer's finalized confirmation decision back to Shopify.
   */
  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    const validDecision = FinalizedOrderDecisionSchema.parse(decision);
    const validCreds = ShopifyCredentialsSchema.parse(credentials);
    const client = new ShopifyClient(validCreds, this.customFetch);

    if (validDecision.status === "CONFIRMED") {
      const updateRes = await client.updateOrder(orderId, {
        tags: "akadli-confirmed",
        note: "[Akadli-AI] Order CONFIRMED by customer."
      });

      return {
        success: updateRes.success,
        externalStatus: updateRes.success ? "CONFIRMED" : updateRes.externalStatus,
        rawResponse: updateRes.rawResponse
      };
    }

    if (validDecision.status === "MODIFIED") {
      const tagsList = ["akadli-modified"];
      if (validDecision.finalSize) {
        tagsList.push(`akadli-size-${validDecision.finalSize}`);
      }
      const tags = tagsList.join(", ");

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
      const note = `[Akadli-AI] Order MODIFIED: ${noteParts.join("; ")}`;

      const shippingAddressUpdate: Record<string, unknown> = {};
      if (validDecision.finalWilaya) {
        shippingAddressUpdate.province = validDecision.finalWilaya;
      }
      if (validDecision.finalCommune) {
        shippingAddressUpdate.city = validDecision.finalCommune;
      }
      if (validDecision.finalAddressNote) {
        shippingAddressUpdate.address1 = validDecision.finalAddressNote;
      }

      const updateRes = await client.updateOrder(orderId, {
        tags,
        note,
        shipping_address:
          Object.keys(shippingAddressUpdate).length > 0
            ? shippingAddressUpdate
            : undefined
      });

      return {
        success: updateRes.success,
        externalStatus: updateRes.success
          ? "UPDATED_AND_CONFIRMED"
          : updateRes.externalStatus,
        rawResponse: updateRes.rawResponse
      };
    }

    // REFUSED
    const refusalNote = `[Akadli-AI] Order REFUSED: ${validDecision.reasonOrNotes || "Customer refused order."}`;
    const updateRes = await client.updateOrder(orderId, {
      tags: "akadli-refused",
      note: refusalNote
    });

    if (!updateRes.success) {
      return {
        success: false,
        externalStatus: updateRes.externalStatus,
        rawResponse: updateRes.rawResponse
      };
    }

    if (validCreds.cancelOnRefused !== "false") {
      const cancelRes = await client.cancelOrder(orderId, {
        reason: "customer",
        email: false,
        restock: true
      });

      return {
        success: cancelRes.success,
        externalStatus: cancelRes.success ? "CANCELLED" : cancelRes.externalStatus,
        rawResponse: {
          update: updateRes.rawResponse,
          cancel: cancelRes.rawResponse
        }
      };
    }

    return {
      success: true,
      externalStatus: "REFUSED_TAGGED",
      rawResponse: updateRes.rawResponse
    };
  }
}
