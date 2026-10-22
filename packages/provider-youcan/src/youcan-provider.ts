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
   * using envelope unwrapping and resilient multi-candidate Algerian address extraction.
   */
  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    const data = YouCanOrderWebhookPayloadSchema.parse(payload);
    const shippingAddr = data.shipping?.address;

    // Helpers to scan extra_fields and custom_fields (used heavily in Algerian 1-page COD checkouts)
    const phonePatterns = [
      /(?:phone|téléphone|telephone|tel|mobile|هاتف|تلفون|موبايل|جوال)/i
    ];
    const wilayaPatterns = [/(?:wilaya|province|state|ولاية)/i];
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

    const extractNotesPairs = (): Array<{ key: string; value: string }> => {
      const allNotes = [
        data.notes,
        data.note,
        data.customer_notes,
        data.comment
      ]
        .filter(Boolean)
        .join("\n");

      if (!allNotes.trim()) return [];

      const pairs: Array<{ key: string; value: string }> = [];
      const lines = allNotes.split(/\r?\n/);
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const k = line.slice(0, colonIdx).trim();
          const v = line.slice(colonIdx + 1).trim();
          if (k && v) {
            pairs.push({ key: k, value: v });
          }
        }
      }
      return pairs;
    };

    const combinedNotesPairs = extractNotesPairs();

    const findInNotes = (patterns: RegExp[]): string | undefined => {
      for (const entry of combinedNotesPairs) {
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
      shippingAddr?.phone ||
      data.shipping?.phone ||
      data.customer?.phone ||
      findInExtra(phonePatterns) ||
      findInNotes(phonePatterns) ||
      "";

    // 2. Multi-Candidate Wilaya Resolution:
    // Try resolving in order: extra_fields -> notes -> shipping region/state -> city -> zip -> address lines
    let zipCandidate: string | undefined;
    const rawZip = shippingAddr?.zip ?? shippingAddr?.postal_code;
    if (rawZip) {
      const cleanZip = String(rawZip).trim();
      if (/^\d{5}$/.test(cleanZip)) {
        zipCandidate = cleanZip.slice(0, 2);
      } else if (/^\d{1,2}$/.test(cleanZip)) {
        zipCandidate = cleanZip;
      } else {
        zipCandidate = cleanZip;
      }
    }

    const wilayaCandidates: Array<string | undefined> = [
      findInExtra(wilayaPatterns),
      findInNotes(wilayaPatterns),
      shippingAddr?.region ?? undefined,
      shippingAddr?.state ?? undefined,
      shippingAddr?.city ?? undefined,
      zipCandidate,
      shippingAddr?.first_line ?? shippingAddr?.address1 ?? undefined,
      shippingAddr?.second_line ?? shippingAddr?.address2 ?? undefined
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

    const rawWilaya =
      resolvedWilaya?.code ||
      findInExtra(wilayaPatterns) ||
      findInNotes(wilayaPatterns) ||
      shippingAddr?.region ||
      shippingAddr?.state ||
      "";

    // 3. Smart Commune Resolution
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
      const wilayaCode = resolvedWilaya.code as WilayaCode;
      const wilayaCapitalClean = canonicalizeGeoToken(resolvedWilaya.nameFr);

      // Check explicit commune in extra_fields/custom_fields first
      const extraCommuneVal = findInExtra(communePatterns);
      if (extraCommuneVal) {
        const extraMatch = tryMatchCommune(extraCommuneVal, wilayaCode);
        if (extraMatch) {
          resolvedCommune = extraMatch;
        }
      }

      // Check explicit commune in customer notes
      if (!resolvedCommune) {
        const noteCommuneVal = findInNotes(communePatterns);
        if (noteCommuneVal) {
          const noteMatch = tryMatchCommune(noteCommuneVal, wilayaCode);
          if (noteMatch) {
            resolvedCommune = noteMatch;
          }
        }
      }

      // If not yet resolved, test city, first_line, second_line against normalizeCommune
      if (!resolvedCommune) {
        const cityMatch = tryMatchCommune(shippingAddr?.city, wilayaCode);
        const addr1Match = tryMatchCommune(
          shippingAddr?.first_line || shippingAddr?.address1,
          wilayaCode
        );
        const addr2Match = tryMatchCommune(
          shippingAddr?.second_line || shippingAddr?.address2,
          wilayaCode
        );
        const extraCityVal = findInExtra([/(?:city)/i]);
        const extraCityMatch = tryMatchCommune(extraCityVal, wilayaCode);

        // Prefer specific non-capital commune
        if (addr1Match && canonicalizeGeoToken(addr1Match) !== wilayaCapitalClean) {
          resolvedCommune = addr1Match;
        } else if (addr2Match && canonicalizeGeoToken(addr2Match) !== wilayaCapitalClean) {
          resolvedCommune = addr2Match;
        } else if (cityMatch && canonicalizeGeoToken(cityMatch) !== wilayaCapitalClean) {
          resolvedCommune = cityMatch;
        } else if (extraCityMatch && canonicalizeGeoToken(extraCityMatch) !== wilayaCapitalClean) {
          resolvedCommune = extraCityMatch;
        } else if (cityMatch) {
          resolvedCommune = cityMatch;
        } else if (extraCityMatch) {
          resolvedCommune = extraCityMatch;
        } else if (addr1Match) {
          resolvedCommune = addr1Match;
        } else if (addr2Match) {
          resolvedCommune = addr2Match;
        }
      }
    }

    const rawCommune =
      resolvedCommune ||
      shippingAddr?.city ||
      findInExtra(communePatterns) ||
      findInNotes(communePatterns) ||
      "";

    // 4. Customer Name extraction
    const fullName = [
      data.customer?.first_name || shippingAddr?.first_name,
      data.customer?.last_name || shippingAddr?.last_name
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const customerName =
      (fullName.length > 0 ? fullName : undefined) ||
      data.customer?.name ||
      shippingAddr?.name ||
      findInExtra(namePatterns) ||
      findInNotes(namePatterns) ||
      "Client";

    // 5. Address note extraction
    const shippingLines = [
      shippingAddr?.first_line || shippingAddr?.address1,
      shippingAddr?.second_line || shippingAddr?.address2
    ]
      .filter(Boolean)
      .join(", ")
      .trim();

    const currentAddressNote =
      (shippingLines.length > 0 ? shippingLines : undefined) ||
      findInExtra(addressPatterns) ||
      findInNotes(addressPatterns) ||
      "";

    // 6. Item Name Resolution
    const firstVariant = data.variants?.[0];
    const firstLineItem = data.line_items?.[0];

    const itemName =
      firstVariant?.variant?.product?.name?.trim() ||
      firstVariant?.variant?.product?.meta?.title?.trim() ||
      firstVariant?.item?.name?.trim() ||
      firstVariant?.name?.trim() ||
      firstVariant?.title?.trim() ||
      firstLineItem?.title?.trim() ||
      firstLineItem?.name?.trim() ||
      "Article";

    // 7. Selected Variant (currentVariant) Resolution
    const isNonDefault = (val: unknown): val is string => {
      if (typeof val !== "string") return false;
      const trimmed = val.trim();
      return Boolean(trimmed && trimmed.toLowerCase() !== "default");
    };

    const variantKeyRegex = /(?:size|taille|pointure|مقاس|variant)/i;

    const extractVariantFromMap = (
      map: Record<string, unknown> | null | undefined
    ): string | undefined => {
      if (!map || typeof map !== "object") return undefined;
      const entries = Object.entries(map);

      // Check for explicit variant/size key
      for (const [key, val] of entries) {
        if (variantKeyRegex.test(key) && isNonDefault(val)) {
          return val.trim();
        }
      }

      // Fallback: first non-default string value in variations map
      for (const [, val] of entries) {
        if (isNonDefault(val)) {
          return val.trim();
        }
      }

      return undefined;
    };

    let currentVariant: string | undefined;

    // Priority 1: variant.variations
    if (firstVariant?.variant?.variations) {
      currentVariant = extractVariantFromMap(firstVariant.variant.variations);
    }

    // Priority 2: variant.values[0]
    if (!currentVariant && firstVariant?.variant?.values?.length) {
      const firstVal = firstVariant.variant.values[0];
      if (isNonDefault(firstVal)) {
        currentVariant = firstVal.trim();
      }
    }

    // Priority 3: variation object (legacy or standard)
    if (!currentVariant && firstVariant?.variation) {
      currentVariant = extractVariantFromMap(
        firstVariant.variation as Record<string, unknown>
      );
    }

    // Priority 4: title / variant.title / line_item variant_title
    if (!currentVariant) {
      const candidateTitles = [
        firstVariant?.title,
        firstVariant?.variant?.title,
        firstLineItem?.variant_title
      ];
      for (const title of candidateTitles) {
        if (isNonDefault(title)) {
          currentVariant = title.trim();
          break;
        }
      }
    }

    if (!currentVariant) {
      currentVariant = "Standard";
    }

    // 8. Allowed Variants (allowedVariants) Extraction from variant_options
    let allowedVariants: string[] | undefined;
    const variantOptions = firstVariant?.variant?.product?.variant_options;

    if (Array.isArray(variantOptions) && variantOptions.length > 0) {
      const variantOption = variantOptions.find(
        (opt) =>
          opt?.name &&
          /^(?:size|taille|pointure|مقاس|variant)$/i.test(opt.name.trim()) &&
          Array.isArray(opt.values) &&
          opt.values.length > 0
      );

      const targetOption =
        variantOption ||
        variantOptions.find(
          (opt) => Array.isArray(opt?.values) && opt.values.length > 0
        );

      if (targetOption?.values) {
        const cleanedValues = targetOption.values
          .map((v) => String(v).trim())
          .filter(Boolean);

        if (cleanedValues.length > 0) {
          if (currentVariant && !cleanedValues.includes(currentVariant)) {
            cleanedValues.push(currentVariant);
          }
          allowedVariants = Array.from(new Set(cleanedValues));
        }
      }
    }

    if (!allowedVariants || allowedVariants.length === 0) {
      allowedVariants = [currentVariant];
    }

    const priceDa = Math.round(Number(data.total || 0));
    const storeName = data.store_name || data.shop_name || "YouCan Store";

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
      currentAddressNote,
      allowedVariants
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
      if (validDecision.finalVariant) {
        tags.push(`akadli-variant-${validDecision.finalVariant}`);
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
