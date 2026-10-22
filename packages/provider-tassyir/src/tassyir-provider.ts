import {
  createHmac,
  timingSafeEqual,
  createPublicKey,
  verify,
  KeyObject,
} from "node:crypto";
import {
  IEcommerceProvider,
  StandardizedDzOrder,
  FinalizedOrderDecision,
  FinalizedOrderDecisionSchema,
  ApplyOrderDecisionResult,
} from "@akadli/adapter-contract";
import { createStandardizedDzOrder } from "@akadli/core";
import { normalizeWilaya } from "@akadli/dz-geo";
import {
  TassyirWebhookPayloadSchema,
  TassyirCredentialsSchema,
  TassyirOrder,
  TassyirItem,
  TassyirProduct,
} from "./schemas.js";
import {
  TassyirClient,
  fetchTassyirWebhookPublicKeys,
  ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY,
} from "./tassyir-client.js";

function safeTimingCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function parseEd25519PublicKey(secret: string): KeyObject | null {
  try {
    if (secret.includes("-----BEGIN")) {
      return createPublicKey(secret);
    }
    let cleaned = secret.trim();
    if (cleaned.startsWith("whpk_")) cleaned = cleaned.slice(5);
    if (cleaned.startsWith("ed25519_")) cleaned = cleaned.slice(8);

    let buf: Buffer;
    if (/^[0-9a-fA-F]+$/.test(cleaned) && cleaned.length === 64) {
      buf = Buffer.from(cleaned, "hex");
    } else {
      buf = Buffer.from(cleaned, "base64");
    }

    if (buf.length === 32) {
      // 12-byte standard Ed25519 SPKI DER prefix
      const spkiDerPrefix = Buffer.from("302a300506032b6570032100", "hex");
      const der = Buffer.concat([spkiDerPrefix, buf]);
      return createPublicKey({ key: der, format: "der", type: "spki" });
    }

    if (buf.length === 44) {
      return createPublicKey({ key: buf, format: "der", type: "spki" });
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Strips product name prefixes, delimiters, and default placeholders from a variant string.
 * Example:
 *   cleanVariantString("nike ensemble - M", "nike ensemble") => "M"
 *   cleanVariantString("nike ensemble - Rouge / XL", "nike ensemble") => "Rouge / XL"
 *   cleanVariantString("M", "nike ensemble") => "M"
 *   cleanVariantString("nike ensemble", "nike ensemble") => "Standard"
 *   cleanVariantString("nike ensemble - Default Title", "nike ensemble") => "Standard"
 */
export function cleanVariantString(
  rawVariant: string | null | undefined,
  productName?: string | null
): string {
  if (!rawVariant || typeof rawVariant !== "string") {
    return "Standard";
  }

  let cleaned = rawVariant.trim();
  if (!cleaned) return "Standard";

  const pName = (productName || "").trim();

  // 1. If raw starts with product name, strip it
  if (pName && cleaned.toLowerCase().startsWith(pName.toLowerCase())) {
    const remainder = cleaned.slice(pName.length).replace(/^[\s\-–—/|:;,]+/, "").trim();
    if (!remainder) {
      return "Standard";
    }
    cleaned = remainder;
  } else if (cleaned.includes(" - ") || cleaned.includes(" – ") || cleaned.includes(" — ")) {
    // 2. If it has a delimiter " - ", check if first part matches or if trailing part is a variant
    const parts = cleaned.split(/\s*[-–—]\s*/);
    if (parts.length > 1) {
      const firstPart = parts[0];
      if (pName && firstPart && firstPart.toLowerCase() === pName.toLowerCase()) {
        cleaned = parts.slice(1).join(" - ").trim();
      } else if (!pName) {
        cleaned = parts.slice(1).join(" - ").trim();
      }
    }
  }

  // 3. Check for standard / default placeholders
  if (
    /^(?:default(?:\s+title)?|standard|valeur\s+par\s+d[eé]faut)$/i.test(
      cleaned
    )
  ) {
    return "Standard";
  }

  return cleaned || "Standard";
}

/**
 * Extracts a normalized variant name (e.g. "M", "42", "Noir / L") from a Tassyir item.
 */
export function extractVariantFromItem(
  item: TassyirItem | undefined,
  fallbackProductName?: string | null
): string {
  if (!item) return "Standard";

  const productName = item.title || item.name || fallbackProductName;

  // 1. Direct candidate fields (variantTitle, variant, size)
  const candidates = [
    item.variantTitle,
    item.variant_title,
    item.variant,
    item.size,
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim()) {
      const cleaned = cleanVariantString(c, productName);
      if (cleaned !== "Standard") return cleaned;
    }
  }

  // 2. Check options array/object
  if (Array.isArray(item.options) && item.options.length > 0) {
    const optStr = item.options.map(String).filter(Boolean).join(" / ");
    const cleaned = cleanVariantString(optStr, productName);
    if (cleaned !== "Standard") return cleaned;
  }

  // 3. Tassyir standard variantName / variant_name (e.g. "nike ensemble - M")
  const variantName = item.variantName || item.variant_name;
  if (variantName && typeof variantName === "string" && variantName.trim()) {
    const cleaned = cleanVariantString(variantName, productName);
    return cleaned;
  }

  return "Standard";
}

/**
 * Extracts allowed sizes/variants from a Tassyir product object.
 */
export function extractAllowedSizesFromProduct(
  product: TassyirProduct | null | undefined
): string[] {
  if (!product) return [];

  const sizes: string[] = [];

  // 1. Inspect options array (e.g. { name: "Taille", values: ["S", "M", "L"] })
  if (Array.isArray(product.options) && product.options.length > 0) {
    const sizeOpt = product.options.find(
      (opt) =>
        opt?.name &&
        /^(?:size|taille|pointure|مقاس)$/i.test(opt.name.trim()) &&
        Array.isArray(opt.values) &&
        opt.values.length > 0
    );

    const targetOpt =
      sizeOpt ||
      product.options.find(
        (opt) => Array.isArray(opt?.values) && opt.values.length > 0
      );

    if (targetOpt?.values) {
      for (const val of targetOpt.values) {
        const cleaned = cleanVariantString(String(val), product.name);
        if (cleaned && cleaned !== "Standard" && !sizes.includes(cleaned)) {
          sizes.push(cleaned);
        }
      }
    }
  }

  // 2. Inspect variants array
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const v of product.variants) {
      if (v?.name) {
        const cleaned = cleanVariantString(v.name, product.name);
        if (cleaned && cleaned !== "Standard" && !sizes.includes(cleaned)) {
          sizes.push(cleaned);
        }
      }
    }
  }

  return sizes;
}

export class TassyirProvider implements IEcommerceProvider {
  private readonly customFetch?: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.customFetch = fetchFn;
  }

  /**
   * Cryptographically verifies Tassyir webhooks supporting:
   * 1. Official Tassyir Standard Webhooks (v1a Ed25519 / webhook-signature) using public keys
   *    (either from GET https://api.tassyir.io/apps/webhook-keys, embedded default fallback, or passed whpk_ key)
   * 2. HMAC-SHA256 fallback ONLY when a custom non-whpk_ secret is explicitly passed in tests/simulators.
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret = ""
  ): Promise<boolean> {
    const getHeader = (name: string): string | undefined => {
      const lower = name.toLowerCase();
      for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === lower) return v;
      }
      return undefined;
    };

    const webhookSignature =
      getHeader("webhook-signature") || getHeader("x-webhook-signature");
    const webhookId =
      getHeader("webhook-id") || getHeader("x-webhook-id");
    const webhookTimestamp =
      getHeader("webhook-timestamp") || getHeader("x-webhook-timestamp");
    const legacySignature =
      getHeader("x-tassyir-signature") || getHeader("x-akadli-signature");

    const rawBodyBuffer =
      typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
    const rawBodyStr =
      typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

    const isExplicitHmacSecret = Boolean(
      secret &&
        secret.trim().length > 0 &&
        !secret.startsWith("whpk_") &&
        !secret.includes("-----BEGIN")
    );

    // Scenario 1: Standard Webhooks v1a / webhook-signature
    if (webhookSignature) {
      if (!webhookId || !webhookTimestamp) {
        // Missing required standard webhook metadata headers
        return false;
      }

      // 5-minute tolerance check
      const tsNum = Number(webhookTimestamp);
      if (isNaN(tsNum)) return false;
      const tsMs = tsNum > 1e11 ? tsNum : tsNum * 1000;
      if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
        return false;
      }

      const messageToVerify = `${webhookId}.${webhookTimestamp}.${rawBodyStr}`;
      const messageBuffer = Buffer.from(messageToVerify, "utf8");

      // Parse candidate signatures from the header (space-separated or comma-separated tokens)
      const candidateSignatures: { scheme: string; value: string }[] = [];
      const entries = webhookSignature.trim().split(/\s+/);
      for (const entry of entries) {
        const commaParts = entry.split(",");
        if (commaParts.length === 2 && commaParts[0] && commaParts[1]) {
          candidateSignatures.push({ scheme: commaParts[0], value: commaParts[1] });
        } else {
          candidateSignatures.push({ scheme: "raw", value: entry });
        }
      }

      // A. Public Key Ed25519 Verification (Default Tassyir flow)
      const candidateKeyStrings: string[] = [];
      if (
        secret &&
        (secret.startsWith("whpk_") ||
          secret.includes("-----BEGIN") ||
          /^[0-9a-fA-F]{64}$/.test(secret.trim()))
      ) {
        candidateKeyStrings.push(secret.trim());
      }

      // If secret is empty or is the default active key, fetch published keys and use active fallback
      if (!secret || secret.trim() === "" || secret === ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY) {
        try {
          const fetchedKeys = await fetchTassyirWebhookPublicKeys(this.customFetch);
          for (const k of fetchedKeys) {
            if (!candidateKeyStrings.includes(k)) {
              candidateKeyStrings.push(k);
            }
          }
        } catch {
          // Graceful fallback
        }

        if (!candidateKeyStrings.includes(ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY)) {
          candidateKeyStrings.push(ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY);
        }
      }

      for (const keyStr of candidateKeyStrings) {
        const edKey = parseEd25519PublicKey(keyStr);
        if (edKey) {
          for (const candidate of candidateSignatures) {
            try {
              const sigBuf = Buffer.from(candidate.value, "base64");
              if (verify(null, messageBuffer, edKey, sigBuf)) {
                return true;
              }
            } catch {
              // continue
            }
          }
        }
      }

      // B. Fallback: Check HMAC ONLY when a custom non-whpk_ secret is explicitly passed
      if (isExplicitHmacSecret) {
        try {
          const hmacMsgB64 = createHmac("sha256", secret).update(messageBuffer).digest("base64");
          const hmacMsgHex = createHmac("sha256", secret).update(messageBuffer).digest("hex");
          const hmacRawB64 = createHmac("sha256", secret).update(rawBodyBuffer).digest("base64");
          const hmacRawHex = createHmac("sha256", secret).update(rawBodyBuffer).digest("hex");

          for (const candidate of candidateSignatures) {
            if (
              safeTimingCompare(candidate.value, hmacMsgB64) ||
              safeTimingCompare(candidate.value, hmacMsgHex) ||
              safeTimingCompare(candidate.value, hmacRawB64) ||
              safeTimingCompare(candidate.value, hmacRawHex)
            ) {
              return true;
            }
          }
        } catch {
          // continue
        }
      }

      return false;
    }

    // Scenario 2: Legacy HMAC verification (x-tassyir-signature / x-akadli-signature)
    // ONLY executed when a custom non-whpk_ secret is explicitly passed
    if (legacySignature && isExplicitHmacSecret) {
      try {
        const hmacHex = createHmac("sha256", secret).update(rawBodyBuffer).digest("hex");
        const hmacB64 = createHmac("sha256", secret).update(rawBodyBuffer).digest("base64");

        if (
          safeTimingCompare(legacySignature, hmacHex) ||
          safeTimingCompare(legacySignature, hmacB64)
        ) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Parses and normalizes an inbound Tassyir orders/created webhook payload into a canonical StandardizedDzOrder.
   * Extracts clean variant from Tassyir items (supporting variantName: "Product - Variant", variantTitle, etc.),
   * and populates allowedSizes from live product variants (if credentials or client provided) or order line items.
   */
  async parseWebhookOrder(
    payload: unknown,
    options?: {
      credentials?: Record<string, string>;
      client?: TassyirClient;
    }
  ): Promise<StandardizedDzOrder> {
    const rawData = TassyirWebhookPayloadSchema.parse(payload);
    const orderData = (rawData.data?.order ?? rawData) as TassyirOrder;

    const orderId = String(
      orderData.id ||
      orderData.order_id ||
      orderData.orderNumber ||
      orderData.order_number ||
      orderData.tracking_id ||
      ""
    );
    const storeName = orderData.store_name || "Tassyir Store";

    const rawPrice = orderData.total ?? orderData.total_price ?? orderData.cod_amount ?? 0;
    const priceDa = Math.round(Number(rawPrice));

    const rawPhone = String(
      orderData.buyer?.phone ||
      orderData.customer?.phone ||
      orderData.client_phone ||
      orderData.phone ||
      orderData.customer_phone ||
      orderData.shipping_address?.phone ||
      ""
    ).trim();

    // Check for masked phone or waiting state past plan allowance / missing read_customer_contact scope
    if (
      orderData.waiting === true ||
      rawPhone === "**********" ||
      rawPhone.includes("*****") ||
      !rawPhone
    ) {
      throw new Error(
        "Tassyir order buyer contact is masked or missing: ensure your Tassyir app has the 'read_customer_contact' scope and the order is not in WAITING state."
      );
    }

    const customerName =
      orderData.buyer?.name ||
      orderData.customer?.full_name ||
      orderData.customer?.name ||
      orderData.client_name ||
      orderData.full_name ||
      "Client";

    const rawWilaya = String(
      orderData.buyer?.provinceCode ||
      orderData.customer?.wilaya ||
      orderData.wilaya ||
      orderData.wilaya_code ||
      orderData.wilaya_id ||
      orderData.shipping_address?.wilaya ||
      orderData.shipping_address?.province ||
      ""
    );

    const rawCommune = String(
      orderData.buyer?.townOns ||
      orderData.customer?.commune ||
      orderData.commune ||
      orderData.commune_name ||
      orderData.shipping_address?.commune ||
      orderData.shipping_address?.city ||
      ""
    );

    const buyerAddress = [orderData.buyer?.address, orderData.buyer?.address2]
      .filter(Boolean)
      .join(" - ");

    const currentAddressNote =
      buyerAddress ||
      orderData.customer?.address ||
      orderData.shipping_address?.address ||
      orderData.address ||
      orderData.delivery_note ||
      (orderData.stop_desk || orderData.delivery?.method === "stop_desk"
        ? "Stop-Desk / Bureau"
        : undefined);

    const items = orderData.items || [];
    const firstItem = items[0];
    const itemName =
      firstItem?.title || firstItem?.name || orderData.product_name || "Article";

    const currentSize = extractVariantFromItem(firstItem, itemName);

    let allowedSizes: string[] = [];

    // Optional: fetch live product variants if credentials or client are provided
    let client = options?.client;
    if (!client && options?.credentials) {
      try {
        const validCreds = TassyirCredentialsSchema.parse(options.credentials);
        client = new TassyirClient(validCreds, this.customFetch);
      } catch {
        // Continue without client
      }
    }

    if (client && firstItem?.productId) {
      try {
        const product = await client.getProduct(firstItem.productId);
        if (product) {
          const productSizes = extractAllowedSizesFromProduct(product);
          if (productSizes.length > 0) {
            allowedSizes.push(...productSizes);
          }
        }
      } catch {
        // Fallback gracefully if product fetch fails
      }
    }

    // Also collect variants from any line items present in the order
    for (const it of items) {
      const v = extractVariantFromItem(it, it.title || it.name || itemName);
      if (v && v !== "Standard" && !allowedSizes.includes(v)) {
        allowedSizes.push(v);
      }
    }

    // Ensure currentSize is included
    if (currentSize && currentSize !== "Standard" && !allowedSizes.includes(currentSize)) {
      allowedSizes.unshift(currentSize);
    }

    if (allowedSizes.length === 0) {
      allowedSizes = [currentSize];
    }

    return createStandardizedDzOrder({
      orderId,
      storeName,
      customerName,
      rawCustomerPhone: rawPhone,
      itemName,
      priceDa,
      currentSize,
      rawWilaya,
      rawCommune,
      currentAddressNote,
      allowedSizes,
    });
  }

  /**
   * Applies the customer's finalized confirmation decision back to Tassyir Admin API (2026-10).
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
      // Step 1: PATCH note with confirmation tag
      const updateRes = await client.updateOrder(orderId, {
        note: "[Akadli-AI] Order CONFIRMED by customer (akadli-confirmed).",
      });

      if (!updateRes.success) {
        return {
          success: false,
          externalStatus: updateRes.externalStatus,
          rawResponse: updateRes.rawResponse,
        };
      }

      // Step 2: POST /confirm with Idempotency-Key
      const confirmRes = await client.confirmOrder(orderId, `akadli-confirm-${orderId}`);

      return {
        success: confirmRes.success,
        externalStatus: confirmRes.success ? "CONFIRMED" : confirmRes.externalStatus,
        rawResponse: {
          update: updateRes.rawResponse,
          confirm: confirmRes.rawResponse,
        },
      };
    }

    if (validDecision.status === "MODIFIED") {
      let provinceCode: number | undefined;
      if (validDecision.finalWilaya) {
        const normalized = normalizeWilaya(validDecision.finalWilaya);
        provinceCode = Number(normalized.code);
      }

      const addressParts = [
        validDecision.finalCommune,
        validDecision.finalAddressNote,
      ].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(" - ") : undefined;

      const tagsStr = validDecision.finalSize
        ? `(akadli-modified, akadli-size-${validDecision.finalSize})`
        : `(akadli-modified)`;

      const detailParts: string[] = [];
      if (validDecision.finalCommune) {
        detailParts.push(`Commune: ${validDecision.finalCommune}`);
      }
      if (validDecision.finalSize) {
        detailParts.push(`Size: ${validDecision.finalSize}`);
      }
      if (validDecision.finalAddressNote) {
        detailParts.push(`Address: ${validDecision.finalAddressNote}`);
      }
      if (validDecision.reasonOrNotes) {
        detailParts.push(`Notes: ${validDecision.reasonOrNotes}`);
      }

      const detailsSuffix =
        detailParts.length > 0 ? ` — ${detailParts.join(" | ")}` : "";
      const note = `[Akadli-AI] Order MODIFIED ${tagsStr}${detailsSuffix}`;

      const buyerUpdate: { provinceCode?: number; address?: string } = {};
      if (provinceCode !== undefined) {
        buyerUpdate.provinceCode = provinceCode;
      }
      if (address !== undefined) {
        buyerUpdate.address = address;
      }

      const updateRes = await client.updateOrder(orderId, {
        buyer: Object.keys(buyerUpdate).length > 0 ? buyerUpdate : undefined,
        note,
      });

      if (!updateRes.success) {
        return {
          success: false,
          externalStatus: updateRes.externalStatus,
          rawResponse: updateRes.rawResponse,
        };
      }

      if (validCreds.confirmOnModified !== "false") {
        const confirmRes = await client.confirmOrder(
          orderId,
          `akadli-confirm-mod-${orderId}`
        );

        return {
          success: confirmRes.success,
          externalStatus: confirmRes.success ? "MODIFIED" : confirmRes.externalStatus,
          rawResponse: {
            update: updateRes.rawResponse,
            confirm: confirmRes.rawResponse,
          },
        };
      }

      return {
        success: true,
        externalStatus: "MODIFIED",
        rawResponse: updateRes.rawResponse,
      };
    }

    // REFUSED
    const refusalReason =
      validDecision.reasonOrNotes || "Customer cancelled during voice call";
    const refusalNote = `[Akadli-AI] Order REFUSED by customer (akadli-refused): ${refusalReason}`;

    if (validCreds.cancelOnRefused !== "false") {
      const cancelRes = await client.cancelOrder(
        orderId,
        { note: refusalNote },
        `akadli-cancel-${orderId}`
      );

      return {
        success: cancelRes.success,
        externalStatus: cancelRes.success ? "REFUSED" : cancelRes.externalStatus,
        rawResponse: cancelRes.rawResponse,
      };
    }

    const updateRes = await client.updateOrder(orderId, {
      note: refusalNote,
    });

    return {
      success: updateRes.success,
      externalStatus: updateRes.success ? "REFUSED" : updateRes.externalStatus,
      rawResponse: updateRes.rawResponse,
    };
  }
}
