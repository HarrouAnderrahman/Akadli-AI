import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { GSheetsProvider } from "../src/index.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const setshopFixturePath = resolve(__dirname, "../fixtures/webhook-row-setshop.json");
const setshopRawBody = readFileSync(setshopFixturePath, "utf-8");
const setshopPayload = JSON.parse(setshopRawBody);

const arabicFixturePath = resolve(__dirname, "../fixtures/webhook-row-arabic.json");
const arabicRawBody = readFileSync(arabicFixturePath, "utf-8");
const arabicPayload = JSON.parse(arabicRawBody);

const SPREADSHEET_ID = "sheet_algeria_cod_test_123";
const ACCESS_TOKEN = "ya29.test_oauth_access_token_dz";
const WEBHOOK_SECRET = "gsheet_webhook_secret_algeria_cod_2026";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_test_algeria/exec";

const MODE_A_CREDENTIALS = {
  spreadsheetId: SPREADSHEET_ID,
  accessToken: ACCESS_TOKEN,
  sheetName: "Sheet1",
  statusColumn: "G",
  sizeColumn: "H",
  wilayaColumn: "I",
  communeColumn: "J",
  addressColumn: "K",
  notesColumn: "L"
};

const MODE_B_CREDENTIALS = {
  appsScriptWebhookUrl: APPS_SCRIPT_URL,
  secret: WEBHOOK_SECRET
};

interface CapturedRequest {
  url: string;
  headers: Headers;
  body: any;
}

let capturedBatchUpdates: CapturedRequest[] = [];
let capturedAppsScriptCallbacks: CapturedRequest[] = [];

const server = setupServer(
  http.post(
    "https://sheets.googleapis.com/v4/spreadsheets/:spreadsheetId/values\\:batchUpdate",
    async ({ request, params }) => {
      const auth = request.headers.get("authorization");
      if (auth === "Bearer invalid_token") {
        return HttpResponse.json({ error: { code: 401, message: "Invalid Credentials" } }, { status: 401 });
      }
      if (auth === "Bearer forbidden_token") {
        return HttpResponse.json({ error: { code: 403, message: "Insufficient Permission" } }, { status: 403 });
      }
      if (params.spreadsheetId === "non_existent_sheet") {
        return HttpResponse.json({ error: { code: 404, message: "Spreadsheet Not Found" } }, { status: 404 });
      }

      const body = await request.json();
      capturedBatchUpdates.push({
        url: request.url,
        headers: request.headers,
        body
      });

      return HttpResponse.json({
        spreadsheetId: params.spreadsheetId,
        totalUpdatedRows: 1,
        totalUpdatedColumns: (body as any).data?.length || 1,
        totalUpdatedCells: (body as any).data?.length || 1
      });
    }
  ),
  http.post(
    APPS_SCRIPT_URL,
    async ({ request }) => {
      const secret = request.headers.get("x-akadli-secret");
      if (secret === "unauthorized_secret") {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const body = await request.json();
      capturedAppsScriptCallbacks.push({
        url: request.url,
        headers: request.headers,
        body
      });
      return HttpResponse.json({
        success: true,
        updatedRow: (body as any).rowNumber || 42
      });
    }
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  capturedBatchUpdates = [];
  capturedAppsScriptCallbacks = [];
  server.resetHandlers();
});
afterAll(() => server.close());

describe("@akadli/provider-gsheets (GSheetsProvider Suite)", () => {
  const provider = new GSheetsProvider();

  describe("1. Webhook Signature & Secret Verification (verifyWebhook)", () => {
    it("verifies valid x-akadli-signature HMAC-SHA256 hex signature", async () => {
      const validHmacHex = createHmac("sha256", WEBHOOK_SECRET)
        .update(Buffer.from(setshopRawBody, "utf8"))
        .digest("hex");

      const isValid = await provider.verifyWebhook(
        { "x-akadli-signature": validHmacHex },
        setshopRawBody,
        WEBHOOK_SECRET
      );
      expect(isValid).toBe(true);
    });

    it("verifies valid x-gsheets-signature header (case-insensitive)", async () => {
      const validHmacHex = createHmac("sha256", WEBHOOK_SECRET)
        .update(Buffer.from(arabicRawBody, "utf8"))
        .digest("hex");

      const isValid = await provider.verifyWebhook(
        { "X-GSheets-Signature": validHmacHex.toUpperCase() },
        arabicRawBody,
        WEBHOOK_SECRET
      );
      expect(isValid).toBe(true);
    });

    it("verifies valid shared secret via x-akadli-secret header", async () => {
      const isValid = await provider.verifyWebhook(
        { "X-Akadli-Secret": WEBHOOK_SECRET },
        setshopRawBody,
        WEBHOOK_SECRET
      );
      expect(isValid).toBe(true);
    });

    it("verifies valid bearer token via authorization header", async () => {
      const isValid = await provider.verifyWebhook(
        { Authorization: `Bearer ${WEBHOOK_SECRET}` },
        setshopRawBody,
        WEBHOOK_SECRET
      );
      expect(isValid).toBe(true);
    });

    it("rejects tampered body or wrong secret", async () => {
      const validHmacHex = createHmac("sha256", WEBHOOK_SECRET)
        .update(Buffer.from(setshopRawBody, "utf8"))
        .digest("hex");

      const tampered = await provider.verifyWebhook(
        { "x-akadli-signature": validHmacHex },
        setshopRawBody + " ",
        WEBHOOK_SECRET
      );
      expect(tampered).toBe(false);

      const wrongSecret = await provider.verifyWebhook(
        { "x-akadli-signature": validHmacHex },
        setshopRawBody,
        "wrong_secret"
      );
      expect(wrongSecret).toBe(false);

      const missingHeader = await provider.verifyWebhook(
        {},
        setshopRawBody,
        WEBHOOK_SECRET
      );
      expect(missingHeader).toBe(false);
    });
  });

  describe("2. Order Parsing with SetShop / JustSell Fixture (parseWebhookOrder)", () => {
    it("parses webhook-row-setshop.json into canonical StandardizedDzOrder", async () => {
      const order = await provider.parseWebhookOrder(setshopPayload);

      expect(order.orderId).toBe("SS-1042#ROW-42");
      expect(order.storeName).toBe("SetShop Algerian COD Store");
      expect(order.customerName).toBe("Walid Benali");
      expect(order.customerPhone).toBe("0551234567");
      expect(order.currentWilaya).toBe("16");
      expect(order.currentCommune).toBe("Bab Azzouar");
      expect(order.currentAddressNote).toBe("Cité 8 Mai 1945, Bâtiment C");
      expect(order.itemName).toBe("Sneakers Air Dz Sport");
      expect(order.currentVariant).toBe("42");
      expect(order.priceDa).toBe(5500);

      expect(order.constraints.allowedVariants).toContain("42");
      expect(order.constraints.allowedWilayas).toContain("16");
      expect(order.constraints.allowedCommunes).toContain("Bab Azzouar");
    });
  });

  describe("3. Order Parsing with Arabic Keys & 2026 Wilaya (parseWebhookOrder)", () => {
    it("parses webhook-row-arabic.json with Barika (Wilaya 60)", async () => {
      const order = await provider.parseWebhookOrder(arabicPayload);

      expect(order.orderId).toBe("ROW-55");
      expect(order.storeName).toBe("متجر الأصالة الجزائري");
      expect(order.customerName).toBe("عبد الرحمن بلقاسم");
      expect(order.customerPhone).toBe("0770987654");
      expect(order.currentWilaya).toBe("60"); // Barika (promoted 2026 Wilaya)
      expect(order.currentCommune).toBe("Barika");
      expect(order.currentAddressNote).toBe("حي النصر قرب المسجد العتيق");
      expect(order.itemName).toBe("قندورة عاصمية تقليدية");
      expect(order.currentVariant).toBe("XL");
      expect(order.priceDa).toBe(8900);

      expect(order.constraints.allowedVariants).toContain("XL");
      expect(order.constraints.allowedWilayas).toContain("60");
      expect(order.constraints.allowedCommunes).toContain("Barika");
    });
  });

  describe("4. Order Decision Mutation via Mode A (Google Sheets API v4 batchUpdate)", () => {
    it("executes CONFIRMED mutation and updates status and note cells", async () => {
      const result = await provider.applyOrderDecision(
        "SS-1042#ROW-42",
        {
          orderId: "SS-1042#ROW-42",
          status: "CONFIRMED",
          reasonOrNotes: "Customer answered and confirmed order"
        },
        MODE_A_CREDENTIALS
      );

      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe("CONFIRMED");
      expect(capturedBatchUpdates).toHaveLength(1);

      const req = capturedBatchUpdates[0]!;
      expect(req.headers.get("authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
      expect(req.body.valueInputOption).toBe("USER_ENTERED");

      const data = req.body.data;
      expect(data).toEqual(
        expect.arrayContaining([
          { range: "Sheet1!G42", values: [["akadli-confirmed"]] },
          { range: "Sheet1!L42", values: [["Customer answered and confirmed order"]] }
        ])
      );
    });

    it("executes MODIFIED mutation and updates variant, address, commune, and wilaya cells", async () => {
      const result = await provider.applyOrderDecision(
        "ROW-42",
        {
          orderId: "ROW-42",
          status: "MODIFIED",
          finalVariant: "43",
          finalWilaya: "13",
          finalCommune: "Maghnia",
          finalAddressNote: "Cité El Wafa",
          reasonOrNotes: "Customer changed shoe size to 43 and commune to Maghnia"
        },
        MODE_A_CREDENTIALS
      );

      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe("UPDATED_AND_CONFIRMED");
      expect(capturedBatchUpdates).toHaveLength(1);

      const req = capturedBatchUpdates[0]!;
      const data = req.body.data;
      expect(data).toEqual(
        expect.arrayContaining([
          { range: "Sheet1!G42", values: [["akadli-modified"]] },
          { range: "Sheet1!H42", values: [["43"]] },
          { range: "Sheet1!I42", values: [["13"]] },
          { range: "Sheet1!J42", values: [["Maghnia"]] },
          { range: "Sheet1!K42", values: [["Cité El Wafa"]] },
          { range: "Sheet1!L42", values: [["Customer changed shoe size to 43 and commune to Maghnia"]] }
        ])
      );
    });

    it("executes REFUSED mutation and updates status to akadli-refused", async () => {
      const result = await provider.applyOrderDecision(
        "SS-1042:42",
        {
          orderId: "SS-1042:42",
          status: "REFUSED",
          reasonOrNotes: "Customer refused delivery due to high shipping cost"
        },
        MODE_A_CREDENTIALS
      );

      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe("REFUSED");
      expect(capturedBatchUpdates).toHaveLength(1);

      const req = capturedBatchUpdates[0]!;
      const data = req.body.data;
      expect(data).toEqual(
        expect.arrayContaining([
          { range: "Sheet1!G42", values: [["akadli-refused"]] },
          { range: "Sheet1!L42", values: [["Customer refused delivery due to high shipping cost"]] }
        ])
      );
    });
  });

  describe("5. Order Decision Mutation via Mode B (Apps Script Webhook Callback)", () => {
    it("posts decision to appsScriptWebhookUrl with valid signature", async () => {
      const result = await provider.applyOrderDecision(
        "SS-1042#ROW-42",
        {
          orderId: "SS-1042#ROW-42",
          status: "CONFIRMED",
          reasonOrNotes: "Confirmed through voice call"
        },
        MODE_B_CREDENTIALS
      );

      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe("CONFIRMED");
      expect(capturedAppsScriptCallbacks).toHaveLength(1);

      const req = capturedAppsScriptCallbacks[0]!;
      expect(req.headers.get("x-akadli-secret")).toBe(WEBHOOK_SECRET);

      const sig = req.headers.get("x-akadli-signature");
      expect(sig).toBeTruthy();

      const expectedHmac = createHmac("sha256", WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");
      expect(sig).toBe(expectedHmac);

      expect(req.body.orderId).toBe("SS-1042#ROW-42");
      expect(req.body.rowNumber).toBe(42);
      expect(req.body.status).toBe("CONFIRMED");
      expect(req.body.reasonOrNotes).toBe("Confirmed through voice call");
    });
  });

  describe("6. Error Handling & Edge Cases", () => {
    it("handles 401 Unauthorized cleanly", async () => {
      const result = await provider.applyOrderDecision(
        "ROW-42",
        {
          orderId: "ROW-42",
          status: "CONFIRMED"
        },
        {
          ...MODE_A_CREDENTIALS,
          accessToken: "invalid_token"
        }
      );

      expect(result.success).toBe(false);
      expect(result.externalStatus).toBe("UNAUTHORIZED");
    });

    it("handles 403 Forbidden cleanly", async () => {
      const result = await provider.applyOrderDecision(
        "ROW-42",
        {
          orderId: "ROW-42",
          status: "CONFIRMED"
        },
        {
          ...MODE_A_CREDENTIALS,
          accessToken: "forbidden_token"
        }
      );

      expect(result.success).toBe(false);
      expect(result.externalStatus).toBe("UNAUTHORIZED");
    });

    it("handles 404 Spreadsheet Not Found cleanly", async () => {
      const result = await provider.applyOrderDecision(
        "ROW-42",
        {
          orderId: "ROW-42",
          status: "CONFIRMED"
        },
        {
          ...MODE_A_CREDENTIALS,
          spreadsheetId: "non_existent_sheet"
        }
      );

      expect(result.success).toBe(false);
      expect(result.externalStatus).toBe("NOT_FOUND");
    });

    it("handles invalid row number when target row cannot be determined", async () => {
      const result = await provider.applyOrderDecision(
        "NO_DIGITS_HERE",
        {
          orderId: "NO_DIGITS_HERE",
          status: "CONFIRMED"
        },
        MODE_A_CREDENTIALS
      );

      expect(result.success).toBe(false);
      expect(result.externalStatus).toBe("INVALID_ROW_NUMBER");
    });
  });
});
