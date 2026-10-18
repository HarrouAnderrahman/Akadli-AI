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
  YouCanOrderWebhookPayloadSchema,
  YouCanCredentialsSchema
} from "./schemas.js";
import { YouCanClient } from "./youcan-client.js";

export class YouCanProvider implements IEcommerceProvider {
  private readonly customFetch?: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.customFetch = fetchFn;
  }

  /**
   * Cryptographically verifies YouCan's HMAC-SHA256 (hex digest) webhook signature.
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    const headerKey = Object.keys(headers).find(
      (k) => k.toLowerCase() === "x-youcan-signature"
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
        .digest("hex");

      const sigBuffer = Buffer.from(signature.toLowerCase().trim(), "utf8");
      const calcBuffer = Buffer.from(calculatedHmac.toLowerCase().trim(), "utf8");

      if (sigBuffer.length !== calcBuffer.length) {
        return false;
      }

      return timingSafeEqual(sigBuffer, calcBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parses YouCan order.created webhook payload into canonical StandardizedDzOrder
   * using dual-source address & phone extraction.
   */
  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    const data = YouCanOrderWebhookPayloadSchema.parse(payload);

    // Helpers to scan extra_fields and custom_fields (used heavily in Algerian 1-page COD checkouts)
    const phonePatterns = [/(?:phone|téléphone|telephone|tel|هاتف|تلفون)/i];
    const wilayaPatterns = [/(?:wilaya|province|ولاية)/i];
    const communePatterns = [/(?:commune|city|بلدية)/i];
    const addressPatterns = [/(?:address|adresse|عنوان)/i];
    const namePatterns = [/(?:^nom$|^name$|^full[_\s]?name$|اسم)/i];

    const extractKeyValuePairs = (
      fields: unknown
    ): Array<{ key: string; value: string }> => {
      if (!fields) return [];
      if (Array.isArray(fields)) {
        return fields
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const record = item as Record<string, unknown>;
            const k = String(record.key || record.name || record.field || "");
            const v = record.value != null ? String(record.value).trim() : "";
            return { key: k, value: v };
          })
          .filter(
            (x): x is { key: string; value: string } =>
              x !== null && Boolean(x.key && x.value)
          );
      }
      if (typeof fields === "object") {
        return Object.entries(fields as Record<string, unknown>)
          .map(([k, v]) => ({
            key: k,
            value: v != null ? String(v).trim() : ""
          }))
          .filter((x) => Boolean(x.key && x.value));
      }
      return [];
    };

    const combinedExtraFields = [
      ...extractKeyValuePairs(data.extra_fields),
      ...extractKeyValuePairs(data.custom_fields)
    ];

    const findInExtra = (patterns: RegExp[]): string | undefined => {
      for (const entry of combinedExtraFields) {
        for (const pattern of patterns) {
          if (pattern.test(entry.key)) {
            return entry.value;
          }
        }
      }
      return undefined;
    };

    // 1. Phone extraction (primary -> fallback)
    const rawCustomerPhone =
      data.shipping?.address?.phone ||
      data.customer?.phone ||
      findInExtra(phonePatterns) ||
      "";

    // 2. Wilaya extraction
    const rawWilaya =
      data.shipping?.address?.region ||
      data.shipping?.address?.state ||
      findInExtra(wilayaPatterns) ||
      "";

    // 3. Commune extraction
    const rawCommune =
      data.shipping?.address?.city ||
      findInExtra(communePatterns) ||
      "";

    // 4. Customer Name extraction
    const fullName = [data.customer?.first_name, data.customer?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const customerName =
      (fullName.length > 0 ? fullName : undefined) ||
      data.shipping?.address?.first_name ||
      findInExtra(namePatterns) ||
      "Client";

    // 5. Address note extraction
    const shippingLines = [
      data.shipping?.address?.first_line,
      data.shipping?.address?.second_line
    ]
      .filter(Boolean)
      .join(", ")
      .trim();

    const currentAddressNote =
      (shippingLines.length > 0 ? shippingLines : undefined) ||
      findInExtra(addressPatterns) ||
      "";

    // 6. Item Name & Size
    const firstVariant = data.variants?.[0];
    const firstLineItem = data.line_items?.[0];
    const itemName =
      firstVariant?.item?.name || firstLineItem?.title || "Article";
    const currentSize =
      firstVariant?.variation?.size ||
      firstVariant?.title ||
      firstLineItem?.variant_title ||
      "Standard";
    const priceDa = Math.round(Number(data.total || 0));
    const storeName = data.store_name || data.shop_name || "YouCan Store";

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
   * Applies the customer's finalized confirmation decision back to YouCan.
   */
  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    const validDecision = FinalizedOrderDecisionSchema.parse(decision);
    const validCreds = YouCanCredentialsSchema.parse(credentials);
    const client = new YouCanClient(validCreds, this.customFetch);

    if (validDecision.status === "CONFIRMED") {
      const updateRes = await client.updateOrder(orderId, {
        tags: ["akadli-confirmed"],
        notes: "[Akadli-AI] Order CONFIRMED by customer."
      });

      return {
        success: updateRes.success,
        externalStatus: updateRes.success
          ? "CONFIRMED"
          : updateRes.externalStatus,
        rawResponse: updateRes.rawResponse
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

      const addressUpdate: Record<string, unknown> = {};
      if (validDecision.finalWilaya) {
        addressUpdate.region = validDecision.finalWilaya;
      }
      if (validDecision.finalCommune) {
        addressUpdate.city = validDecision.finalCommune;
      }
      if (validDecision.finalAddressNote) {
        addressUpdate.first_line = validDecision.finalAddressNote;
      }

      const updateRes = await client.updateOrder(orderId, {
        tags,
        notes,
        shipping:
          Object.keys(addressUpdate).length > 0
            ? { address: addressUpdate }
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
    const refusalNotes = `[Akadli-AI] Order REFUSED: ${validDecision.reasonOrNotes || "Customer refused order."}`;
    const updateRes = await client.updateOrder(orderId, {
      tags: ["akadli-refused"],
      notes: refusalNotes
    });

    if (!updateRes.success) {
      return {
        success: false,
        externalStatus: updateRes.externalStatus,
        rawResponse: updateRes.rawResponse
      };
    }

    if (validCreds.closeOnRefused !== "false") {
      const closeRes = await client.closeOrder(orderId);
      if (!closeRes.success) {
        return {
          success: false,
          externalStatus: closeRes.externalStatus,
          rawResponse: closeRes.rawResponse
        };
      }
      return {
        success: true,
        externalStatus: "CANCELLED",
        rawResponse: closeRes.rawResponse
      };
    }

    return {
      success: true,
      externalStatus: "CANCELLED",
      rawResponse: updateRes.rawResponse
    };
  }
}
