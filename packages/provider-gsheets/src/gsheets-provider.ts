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
  COLUMN_CANDIDATE_KEYS,
  GSheetsOrderWebhookPayloadSchema,
  GSheetsCredentialsSchema
} from "./schemas.js";
import { GSheetsClient, CellUpdate } from "./gsheets-client.js";

/**
 * Extracts the target Google Sheet row number from a canonical order ID.
 * Supports "ROW-42", "SS-1042#ROW-42", "SS-1042:42", "42", or "SS-1042".
 */
export function parseGSheetsRowNumber(orderId: string): number | undefined {
  const rowMatch = orderId.match(/ROW-(\d+)/i);
  if (rowMatch && rowMatch[1]) {
    return parseInt(rowMatch[1], 10);
  }
  const hashColonMatch = orderId.match(/[:#](\d+)$/);
  if (hashColonMatch && hashColonMatch[1]) {
    return parseInt(hashColonMatch[1], 10);
  }
  if (/^\d+$/.test(orderId)) {
    return parseInt(orderId, 10);
  }
  const trailingDigits = orderId.match(/\D+(\d+)$/);
  if (trailingDigits && trailingDigits[1]) {
    return parseInt(trailingDigits[1], 10);
  }
  return undefined;
}

export class GSheetsProvider implements IEcommerceProvider {
  private readonly client: GSheetsClient;

  constructor(fetchFn?: typeof fetch) {
    this.client = new GSheetsClient(fetchFn);
  }

  /**
   * Cryptographically verifies Google Sheets Apps Script webhooks.
   * Supports:
   * 1. HMAC-SHA256 hex signature header (`x-akadli-signature` or `x-gsheets-signature`).
   * 2. Shared bearer/secret token header (`x-akadli-secret` or `authorization: Bearer <secret>`).
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean> {
    if (!secret || !secret.trim()) {
      return false;
    }

    const cleanSecret = secret.trim();

    const getHeader = (name: string): string | undefined => {
      const found = Object.keys(headers).find(
        (k) => k.toLowerCase() === name.toLowerCase()
      );
      return found ? headers[found] : undefined;
    };

    // 1. Signature Header (HMAC-SHA256 hex)
    const sigHeader =
      getHeader("x-akadli-signature") || getHeader("x-gsheets-signature");
    if (sigHeader) {
      try {
        const bodyBuf =
          typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
        const computedHex = createHmac("sha256", cleanSecret)
          .update(bodyBuf)
          .digest("hex");

        const actualBuf = Buffer.from(sigHeader.trim().toLowerCase(), "utf8");
        const expectedBuf = Buffer.from(computedHex.toLowerCase(), "utf8");

        if (
          actualBuf.length === expectedBuf.length &&
          timingSafeEqual(actualBuf, expectedBuf)
        ) {
          return true;
        }
      } catch {
        // Fall through to secret check
      }
    }

    // 2. Shared Secret Header
    const secretHeader = getHeader("x-akadli-secret");
    if (secretHeader) {
      try {
        const actualBuf = Buffer.from(secretHeader.trim(), "utf8");
        const expectedBuf = Buffer.from(cleanSecret, "utf8");

        if (
          actualBuf.length === expectedBuf.length &&
          timingSafeEqual(actualBuf, expectedBuf)
        ) {
          return true;
        }
      } catch {
        // Continue
      }
    }

    // 3. Authorization Bearer Token
    const authHeader = getHeader("authorization");
    if (authHeader && /^Bearer\s+/i.test(authHeader)) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        const actualBuf = Buffer.from(token, "utf8");
        const expectedBuf = Buffer.from(cleanSecret, "utf8");

        if (
          actualBuf.length === expectedBuf.length &&
          timingSafeEqual(actualBuf, expectedBuf)
        ) {
          return true;
        }
      } catch {
        // Continue
      }
    }

    return false;
  }

  /**
   * Ingests and normalizes an incoming Google Sheet row webhook payload into
   * a canonical StandardizedDzOrder.
   */
  async parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder> {
    const rawObj = GSheetsOrderWebhookPayloadSchema.parse(payload);

    // Collect candidate object sources (inner row/data objects plus top-level)
    const sources: Array<Record<string, unknown>> = [];
    if (typeof rawObj.data === "object" && rawObj.data !== null) {
      sources.push(rawObj.data as Record<string, unknown>);
    }
    if (typeof rawObj.row === "object" && rawObj.row !== null) {
      sources.push(rawObj.row as Record<string, unknown>);
    }
    sources.push(rawObj);

    // Extraction helper
    const extract = (candidates: readonly string[]): string | undefined => {
      for (const src of sources) {
        for (const [k, v] of Object.entries(src)) {
          const cleanedKey = k.trim().toLowerCase();
          for (const cand of candidates) {
            if (cleanedKey === cand.toLowerCase() && v !== undefined && v !== null) {
              const strVal = String(v).trim();
              if (strVal.length > 0) {
                return strVal;
              }
            }
          }
        }
      }
      return undefined;
    };

    // 1. Identify Row Number and Order ID
    const rowCandidate =
      extract(["rowNumber", "rownumber", "row_number", "row", "السطر", "رقم_السطر", "رقم السطر"]);
    const orderIdCandidate =
      extract(["orderId", "order_id", "id", "order_number", "رقم_الطلب", "رقم الطلب"]);

    let orderId: string;
    if (rowCandidate) {
      if (orderIdCandidate) {
        if (orderIdCandidate.includes(`ROW-${rowCandidate}`) || orderIdCandidate === rowCandidate) {
          orderId = orderIdCandidate;
        } else {
          orderId = `${orderIdCandidate}#ROW-${rowCandidate}`;
        }
      } else {
        orderId = `ROW-${rowCandidate}`;
      }
    } else if (orderIdCandidate) {
      orderId = orderIdCandidate;
    } else {
      orderId = "ROW-1";
    }

    // 2. Customer Name
    const customerName =
      extract(COLUMN_CANDIDATE_KEYS.customerName) || "Client";

    // 3. Customer Phone
    const rawCustomerPhone =
      extract(COLUMN_CANDIDATE_KEYS.phone) || "";

    // 4. Wilaya & Commune
    const rawWilaya =
      extract(COLUMN_CANDIDATE_KEYS.wilaya) || "";
    const rawCommune =
      extract(COLUMN_CANDIDATE_KEYS.commune) || "";

    // 5. Address Note
    const currentAddressNote =
      extract(COLUMN_CANDIDATE_KEYS.address) || "";

    // 6. Product, Size, Price
    const itemName =
      extract(COLUMN_CANDIDATE_KEYS.product) || "Article";
    const currentSize =
      extract(COLUMN_CANDIDATE_KEYS.size) || "Standard";

    const rawPrice = extract(COLUMN_CANDIDATE_KEYS.price);
    const numPrice = rawPrice ? Number(rawPrice.replace(/[^\d.]/g, "")) : 0;
    const priceDa = isNaN(numPrice) ? 0 : Math.round(numPrice);

    // 7. Store Name
    const storeNameCandidate = extract(["storeName", "store_name", "store", "متجر", "المتجر"]);
    const storeName = storeNameCandidate || "Google Sheets Algerian Store";

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
      currentAddressNote
    });
  }

  /**
   * Mutates the Google Sheet row upon ElevenAgents call finalization.
   * Supports:
   * - Mode A: Google Sheets REST API v4 batchUpdate
   * - Mode B: Apps Script Webhook callback URL
   */
  async applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult> {
    FinalizedOrderDecisionSchema.parse(decision);
    GSheetsCredentialsSchema.parse(credentials);

    const rowNumber = parseGSheetsRowNumber(orderId);

    // Mode A: Direct Google Sheets REST API v4
    if (credentials.spreadsheetId && credentials.accessToken) {
      if (!rowNumber || rowNumber < 1) {
        return {
          success: false,
          externalStatus: "INVALID_ROW_NUMBER",
          rawResponse: {
            error: `Target Google Sheet row number could not be determined from orderId: "${orderId}".`
          }
        };
      }

      const statusVal =
        decision.status === "CONFIRMED"
          ? "akadli-confirmed"
          : decision.status === "MODIFIED"
            ? "akadli-modified"
            : "akadli-refused";

      const statusCol = credentials.statusColumn || "G";
      const notesCol = credentials.notesColumn || "L";

      const updates: CellUpdate[] = [
        { column: statusCol, value: statusVal },
        { column: notesCol, value: decision.reasonOrNotes || `AI decision: ${decision.status}` }
      ];

      if (decision.status === "MODIFIED") {
        if (decision.finalSize) {
          const sizeCol = credentials.sizeColumn || "H";
          updates.push({ column: sizeCol, value: decision.finalSize });
        }
        if (decision.finalWilaya) {
          const wilayaCol = credentials.wilayaColumn || "I";
          updates.push({ column: wilayaCol, value: decision.finalWilaya });
        }
        if (decision.finalCommune) {
          const communeCol = credentials.communeColumn || "J";
          updates.push({ column: communeCol, value: decision.finalCommune });
        }
        if (decision.finalAddressNote) {
          const addressCol = credentials.addressColumn || "K";
          updates.push({ column: addressCol, value: decision.finalAddressNote });
        }
      }

      const res = await this.client.updateRowValues(
        credentials.spreadsheetId,
        credentials.accessToken,
        updates,
        {
          sheetName: credentials.sheetName || "Sheet1",
          rowNumber,
          baseUrl: credentials.baseUrl
        }
      );

      if (!res.success) {
        return res;
      }

      return {
        success: true,
        externalStatus: decision.status === "MODIFIED" ? "UPDATED_AND_CONFIRMED" : decision.status,
        rawResponse: res.rawResponse
      };
    }

    // Mode B: Apps Script Webhook Callback URL
    if (credentials.appsScriptWebhookUrl) {
      const callbackPayload = {
        orderId,
        rowNumber: rowNumber ?? null,
        status: decision.status,
        externalStatus: decision.status,
        finalSize: decision.finalSize ?? null,
        finalWilaya: decision.finalWilaya ?? null,
        finalCommune: decision.finalCommune ?? null,
        finalAddressNote: decision.finalAddressNote ?? null,
        reasonOrNotes: decision.reasonOrNotes || "",
        updatedAt: new Date().toISOString()
      };

      const res = await this.client.sendAppsScriptCallback(
        credentials.appsScriptWebhookUrl,
        callbackPayload,
        credentials.secret
      );

      if (!res.success) {
        return res;
      }

      return {
        success: true,
        externalStatus: decision.status === "MODIFIED" ? "UPDATED_AND_CONFIRMED" : decision.status,
        rawResponse: res.rawResponse
      };
    }

    return {
      success: false,
      externalStatus: "CONFIG_ERROR",
      rawResponse: { error: "No valid Google Sheets mutation credentials provided." }
    };
  }
}
