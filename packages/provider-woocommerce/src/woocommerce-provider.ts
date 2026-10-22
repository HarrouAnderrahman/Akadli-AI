import { createHmac, timingSafeEqual } from "node:crypto";
import {
  IEcommerceProvider,
  StandardizedDzOrder,
  FinalizedOrderDecision,
  FinalizedOrderDecisionSchema,
  ApplyOrderDecisionResult,
  WilayaCode
} from "@akadli/adapter-contract";
import { createStandardizedDzOrder } from "@akadli/core";
import {
  normalizeWilaya,
  normalizeCommune,
  InvalidWilayaError,
  canonicalizeGeoToken
} from "@akadli/dz-geo";
import {
  WooCommerceOrderWebhookPayloadSchema,
  WooCommerceCredentialsSchema
} from "./schemas.js";
import { WooCommerceClient } from "./woocommerce-client.js";

/**
 * Detects whether an inbound HTTP request is an unsigned WooCommerce webhook handshake ping.
 * WooCommerce sends a lightweight test ping (`WC_Webhook::deliver_ping`) upon webhook creation or activation
 * with body `webhook_id=<id>` (application/x-www-form-urlencoded) and no `x-wc-webhook-signature` header.
 */
export function isWooCommerceWebhookPing(
  headers: Record<string, string | undefined>,
  body?: unknown,
  rawBody?: Buffer | string
): boolean {
  // If a signature is present, it is not an unsigned handshake ping
  const sigKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === "x-wc-webhook-signature"
  );
  if (sigKey && headers[sigKey]) {
    return false;
  }

  // Check explicit ping topic header if provided
  const topicKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === "x-wc-webhook-topic"
  );
  const topic = topicKey ? headers[topicKey] : undefined;
  if (topic === "action.woocommerce_deliver_ping") {
    return true;
  }

  // Check parsed body (e.g. from express.urlencoded or express.json)
  if (body && typeof body === "object") {
    if ("webhook_id" in (body as Record<string, unknown>)) {
      return true;
    }
  } else if (typeof body === "string" && body.includes("webhook_id=")) {
    return true;
  }

  // Check raw body (Buffer or string)
  if (rawBody) {
    const rawStr =
      typeof rawBody === "string"
        ? rawBody
        : Buffer.isBuffer(rawBody)
          ? rawBody.toString("utf8")
          : "";
    if (rawStr.includes("webhook_id=")) {
      return true;
    }
  }

  return false;
}

export class WooCommerceProvider implements IEcommerceProvider {
  private readonly customFetch?: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.customFetch = fetchFn;
  }

  /**
   * Detects whether an inbound HTTP request is an unsigned WooCommerce webhook handshake ping.
   */
  isWebhookPing(
    headers: Record<string, string | undefined>,
    body?: unknown,
    rawBody?: Buffer | string
  ): boolean {
    return isWooCommerceWebhookPing(headers, body, rawBody);
  }

  /**
   * Alias matching the standalone function name for flexibility.
   */
  isWooCommerceWebhookPing(
    headers: Record<string, string | undefined>,
    body?: unknown,
    rawBody?: Buffer | string
  ): boolean {
    return isWooCommerceWebhookPing(headers, body, rawBody);
  }

  /**
   * Cryptographically verifies WooCommerce's HMAC-SHA256 Base64 webhook signature.
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    const headerKey = Object.keys(headers).find(
      (k) => k.toLowerCase() === "x-wc-webhook-signature"
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
   * Parses and normalizes an inbound WooCommerce order webhook payload into
   * a canonical StandardizedDzOrder supporting standard addresses and COD plugin meta_data.
   */
  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    const data = WooCommerceOrderWebhookPayloadSchema.parse(payload);
    const shipping = data.shipping;
    const billing = data.billing;

    // Helpers to scan meta_data for Algerian COD form plugins (WooCommerce Dz, Yalidine, EasyCOD, etc.)
    const phonePatterns = [/(?:phone|téléphone|telephone|tel|هاتف|تلفون)/i];
    const wilayaPatterns = [/(?:wilaya|province|state|ولاية)/i];
    const communePatterns = [/(?:commune|city|بلدية|baladiya)/i];
    const addressPatterns = [/(?:address|adresse|عنوان)/i];
    const namePatterns = [/(?:^nom$|^name$|^full[_\s]?name$|اسم)/i];

    const findInMeta = (patterns: RegExp[]): string | undefined => {
      for (const item of data.meta_data) {
        if (item.value === null || item.value === undefined) continue;
        const val = String(item.value).trim();
        if (!val) continue;
        for (const pattern of patterns) {
          if (pattern.test(item.key)) {
            return val;
          }
        }
      }
      return undefined;
    };

    // 1. Phone extraction
    const rawCustomerPhone =
      billing?.phone ||
      shipping?.phone ||
      findInMeta(phonePatterns) ||
      "";

    // 2. Multi-Candidate Wilaya Resolution:
    // Order: meta_data -> shipping/billing state (clean DZ- prefix) -> city -> postcode -> address_1/2
    let zipCandidate: string | undefined;
    const rawPostcode = shipping?.postcode || billing?.postcode;
    if (rawPostcode) {
      const cleanZip = String(rawPostcode).trim();
      if (/^\d{5}$/.test(cleanZip)) {
        zipCandidate = cleanZip.slice(0, 2);
      } else if (/^\d{1,2}$/.test(cleanZip)) {
        zipCandidate = cleanZip;
      } else {
        zipCandidate = cleanZip;
      }
    }

    const cleanState = (val?: string | null): string | undefined => {
      if (!val || !val.trim()) return undefined;
      return val.trim().replace(/^dz[-_]/i, "");
    };

    const wilayaCandidates: Array<string | undefined> = [
      findInMeta(wilayaPatterns),
      cleanState(shipping?.state),
      cleanState(billing?.state),
      shipping?.city ?? undefined,
      billing?.city ?? undefined,
      zipCandidate,
      shipping?.address_1 ?? undefined,
      shipping?.address_2 ?? undefined,
      billing?.address_1 ?? undefined,
      billing?.address_2 ?? undefined
    ];

    let resolvedWilaya: ReturnType<typeof normalizeWilaya> | undefined;
    for (const candidate of wilayaCandidates) {
      if (!candidate || !candidate.trim()) continue;
      try {
        resolvedWilaya = normalizeWilaya(candidate);
        break;
      } catch (err) {
        if (err instanceof InvalidWilayaError) {
          continue;
        }
        throw err;
      }
    }

    // 3. Smart Commune Resolution:
    const tryMatchCommune = (
      candidate: string | null | undefined,
      wilayaCode: WilayaCode
    ): string | undefined => {
      if (!candidate || !candidate.trim()) return undefined;
      const direct = normalizeCommune(candidate, wilayaCode);
      if (direct.matched) {
        return direct.canonicalCommune;
      }
      const parts = candidate
        .split(/[,;\/|\-]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const part of parts) {
        const seg = normalizeCommune(part, wilayaCode);
        if (seg.matched) {
          return seg.canonicalCommune;
        }
      }
      return undefined;
    };

    let resolvedCommune: string | undefined;
    if (resolvedWilaya) {
      const wilayaCode = resolvedWilaya.code;
      const wilayaCapitalClean = canonicalizeGeoToken(resolvedWilaya.nameFr);

      // Check explicit commune in meta_data first
      const metaCommuneVal = findInMeta(communePatterns);
      if (metaCommuneVal) {
        const metaMatch = tryMatchCommune(metaCommuneVal, wilayaCode);
        if (metaMatch) {
          resolvedCommune = metaMatch;
        }
      }

      // If not yet resolved, test address_1, address_2, city
      if (!resolvedCommune) {
        const addr1Match =
          tryMatchCommune(shipping?.address_1, wilayaCode) ||
          tryMatchCommune(billing?.address_1, wilayaCode);
        const addr2Match =
          tryMatchCommune(shipping?.address_2, wilayaCode) ||
          tryMatchCommune(billing?.address_2, wilayaCode);
        const cityMatch =
          tryMatchCommune(shipping?.city, wilayaCode) ||
          tryMatchCommune(billing?.city, wilayaCode);

        // Prefer specific non-capital commune
        if (addr1Match && canonicalizeGeoToken(addr1Match) !== wilayaCapitalClean) {
          resolvedCommune = addr1Match;
        } else if (addr2Match && canonicalizeGeoToken(addr2Match) !== wilayaCapitalClean) {
          resolvedCommune = addr2Match;
        } else if (cityMatch && canonicalizeGeoToken(cityMatch) !== wilayaCapitalClean) {
          resolvedCommune = cityMatch;
        } else if (addr1Match) {
          resolvedCommune = addr1Match;
        } else if (addr2Match) {
          resolvedCommune = addr2Match;
        } else if (cityMatch) {
          resolvedCommune = cityMatch;
        } else {
          // Fall back to Wilaya's capital
          resolvedCommune = resolvedWilaya.nameFr;
        }
      }
    }

    // 4. Customer Name extraction
    const rawFullName = [
      billing?.first_name || shipping?.first_name,
      billing?.last_name || shipping?.last_name
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const metaName = findInMeta(namePatterns);
    const customerName =
      (rawFullName.length > 0 ? rawFullName : undefined) ||
      metaName ||
      "Client";

    // 5. Address note extraction
    const shippingAddressLines = [
      shipping?.address_1 || billing?.address_1,
      shipping?.address_2 || billing?.address_2
    ]
      .filter(Boolean)
      .join(", ")
      .trim();

    const currentAddressNote =
      (shippingAddressLines.length > 0 ? shippingAddressLines : undefined) ||
      findInMeta(addressPatterns);

    // 6. Items, Variant & Pricing
    const firstItem = data.line_items[0];
    const itemName = firstItem?.name || "Article";

    // Extract variant from item meta_data (e.g. pa_size, size, taille, pointure, variant)
    let currentVariant = "Standard";
    if (firstItem?.meta_data) {
      const variantPatterns = [/(?:pa_size|size|taille|pointure|variant|pa_variant)/i];
      for (const m of firstItem.meta_data) {
        if (m.value === null || m.value === undefined) continue;
        const val = String(m.value).trim();
        if (!val) continue;
        for (const pat of variantPatterns) {
          if (pat.test(m.key)) {
            currentVariant = val;
            break;
          }
        }
        if (currentVariant !== "Standard") break;
      }
    }

    const priceDa = Math.round(Number(data.total || 0));
    const storeName = data.store_name || "WooCommerce Store";

    const rawWilaya = resolvedWilaya
      ? resolvedWilaya.code
      : findInMeta(wilayaPatterns) || cleanState(shipping?.state) || cleanState(billing?.state) || "";

    const rawCommune =
      resolvedCommune ||
      shipping?.city ||
      billing?.city ||
      findInMeta(communePatterns) ||
      "";

    return createStandardizedDzOrder({
      orderId: String(data.id),
      storeName,
      customerName,
      rawCustomerPhone,
      itemName,
      priceDa,
      currentVariant,
      rawWilaya,
      rawCommune,
      currentAddressNote
    });
  }

  /**
   * Applies the customer's finalized confirmation decision back to WooCommerce.
   */
  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    const validDecision = FinalizedOrderDecisionSchema.parse(decision);
    const validCreds = WooCommerceCredentialsSchema.parse(credentials);
    const client = new WooCommerceClient(validCreds, this.customFetch);

    if (validDecision.status === "CONFIRMED") {
      const updateRes = await client.updateOrder(orderId, {
        meta_data: [{ key: "_akadli_status", value: "akadli-confirmed" }]
      });

      if (!updateRes.success) {
        return {
          success: false,
          externalStatus: updateRes.externalStatus,
          rawResponse: updateRes.rawResponse
        };
      }

      await client.createOrderNote(orderId, {
        note: "[Akadli-AI] Order CONFIRMED by customer (akadli-confirmed).",
        customer_note: false
      });

      return {
        success: true,
        externalStatus: "CONFIRMED",
        rawResponse: updateRes.rawResponse
      };
    }

    if (validDecision.status === "MODIFIED") {
      const metaDataUpdates: Array<{ key: string; value: unknown }> = [
        { key: "_akadli_status", value: "akadli-modified" }
      ];
      if (validDecision.finalVariant) {
        metaDataUpdates.push({
          key: "_akadli_variant",
          value: validDecision.finalVariant
        });
      }

      const addressUpdate: Record<string, unknown> = {};
      if (validDecision.finalWilaya) {
        addressUpdate.state = validDecision.finalWilaya;
      }
      if (validDecision.finalCommune) {
        addressUpdate.city = validDecision.finalCommune;
      }
      if (validDecision.finalAddressNote || validDecision.finalCommune) {
        addressUpdate.address_1 =
          validDecision.finalAddressNote || validDecision.finalCommune;
      }

      const updatePayload: Record<string, unknown> = {
        meta_data: metaDataUpdates
      };

      if (Object.keys(addressUpdate).length > 0) {
        updatePayload.shipping = addressUpdate;
        updatePayload.billing = addressUpdate;
      }

      const updateRes = await client.updateOrder(orderId, updatePayload);

      if (!updateRes.success) {
        return {
          success: false,
          externalStatus: updateRes.externalStatus,
          rawResponse: updateRes.rawResponse
        };
      }

      const noteParts: string[] = [];
      if (validDecision.finalVariant) {
        noteParts.push(`Variant -> ${validDecision.finalVariant}`);
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

      await client.createOrderNote(orderId, {
        note,
        customer_note: false
      });

      return {
        success: true,
        externalStatus: "UPDATED_AND_CONFIRMED",
        rawResponse: updateRes.rawResponse
      };
    }

    // REFUSED
    const updatePayload: Record<string, unknown> = {
      meta_data: [{ key: "_akadli_status", value: "akadli-refused" }]
    };

    if (validCreds.cancelOnRefused !== "false") {
      updatePayload.status = "cancelled";
    }

    const updateRes = await client.updateOrder(orderId, updatePayload);

    if (!updateRes.success) {
      return {
        success: false,
        externalStatus: updateRes.externalStatus,
        rawResponse: updateRes.rawResponse
      };
    }

    const refusalNote = `[Akadli-AI] Order REFUSED: ${validDecision.reasonOrNotes || "Customer refused order."}`;
    await client.createOrderNote(orderId, {
      note: refusalNote,
      customer_note: false
    });

    return {
      success: true,
      externalStatus:
        validCreds.cancelOnRefused !== "false" ? "CANCELLED" : "REFUSED_TAGGED",
      rawResponse: updateRes.rawResponse
    };
  }
}
