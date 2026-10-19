import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TassyirProvider } from "../src/index.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const standardFixturePath = resolve(
  __dirname,
  "../fixtures/webhook-order-created.json"
);
const standardRawBody = readFileSync(standardFixturePath, "utf-8");
const standardPayload = JSON.parse(standardRawBody);

const stopdeskFixturePath = resolve(
  __dirname,
  "../fixtures/webhook-order-stopdesk.json"
);
const stopdeskRawBody = readFileSync(stopdeskFixturePath, "utf-8");
const stopdeskPayload = JSON.parse(stopdeskRawBody);

const WEBHOOK_SECRET = "tss_webhook_secret_key_algeria_456";
const BASE_URL = "https://api.tassyir.dz/v1";
const API_KEY = "tss_live_api_key_dz_999";

const CREDENTIALS = {
  baseUrl: BASE_URL,
  apiKey: API_KEY,
  dispatchOnConfirm: "true",
  cancelOnRefused: "true",
};

let capturedPatchRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedDispatchRequests: Array<{ url: string; headers: Headers; body: any }> = [];

const server = setupServer(
  http.patch(`${BASE_URL}/orders/:orderId`, async ({ request, params }) => {
    const body = await request.json();
    capturedPatchRequests.push({
      url: request.url,
      headers: request.headers,
      body,
    });
    return HttpResponse.json({
      id: params.orderId,
      ...((body as any) ?? {}),
      updated_at: new Date().toISOString(),
    });
  }),
  http.post(`${BASE_URL}/orders/:orderId/dispatch`, async ({ request, params }) => {
    const body = await request.json();
    capturedDispatchRequests.push({
      url: request.url,
      headers: request.headers,
      body,
    });
    return HttpResponse.json({
      order_id: params.orderId,
      dispatched: true,
      expedition_number: "EXP-TY-2026-001",
      status: "ready_for_pickup",
      dispatched_at: new Date().toISOString(),
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  capturedPatchRequests = [];
  capturedDispatchRequests = [];
  server.resetHandlers();
});
afterAll(() => server.close());

describe("@akadli/provider-tassyir (TassyirProvider Suite)", () => {
  const provider = new TassyirProvider();

  it("1. verifies valid x-tassyir-signature HMAC-SHA256 hex signature and rejects invalid/tampered payloads", async () => {
    const validSignature = createHmac("sha256", WEBHOOK_SECRET)
      .update(Buffer.from(standardRawBody, "utf8"))
      .digest("hex");

    // Valid signature with x-tassyir-signature
    const isValidTassyir = await provider.verifyWebhook(
      { "X-Tassyir-Signature": validSignature },
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isValidTassyir).toBe(true);

    // Valid signature with fallback x-akadli-signature
    const isValidAkadli = await provider.verifyWebhook(
      { "x-akadli-signature": validSignature },
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isValidAkadli).toBe(true);

    // Tampered raw payload
    const isTampered = await provider.verifyWebhook(
      { "x-tassyir-signature": validSignature },
      standardRawBody + "tamper",
      WEBHOOK_SECRET
    );
    expect(isTampered).toBe(false);

    // Wrong secret
    const isWrongSecret = await provider.verifyWebhook(
      { "x-tassyir-signature": validSignature },
      standardRawBody,
      "wrong_secret"
    );
    expect(isWrongSecret).toBe(false);

    // Missing signature header
    const isMissingHeader = await provider.verifyWebhook(
      {},
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isMissingHeader).toBe(false);
  });

  it("2. parses webhook-order-created.json into a canonical StandardizedDzOrder (Wilaya 25 - Constantine)", async () => {
    const order = await provider.parseWebhookOrder(standardPayload);

    expect(order.orderId).toBe("TSS-90421");
    expect(order.storeName).toBe("Dz Mode Constantine");
    expect(order.customerName).toBe("Khadija Benali");
    expect(order.customerPhone).toBe("0550123456");
    expect(order.itemName).toBe("Robe Traditionnelle Constantinoise");
    expect(order.currentSize).toBe("L");
    expect(order.priceDa).toBe(8500);
    expect(order.currentWilaya).toBe("25"); // Constantine
    expect(order.currentCommune).toBe("El Khroub");
    expect(order.currentAddressNote).toBe("Cité 1600 Logements, Bâtiment B3");

    // Constraints derived from Wilaya 25
    expect(order.constraints.allowedWilayas).toContain("25");
    expect(order.constraints.allowedCommunes).toContain("El Khroub");
    expect(order.constraints.allowedCommunes).toContain("Constantine");
    expect(order.constraints.allowedSizes).toEqual(["L"]);
  });

  it("3. parses webhook-order-stopdesk.json (2026 Wilaya 59 - Aflou) into a canonical StandardizedDzOrder", async () => {
    const order = await provider.parseWebhookOrder(stopdeskPayload);

    expect(order.orderId).toBe("TSS-59012");
    expect(order.storeName).toBe("Sahara Tech Store");
    expect(order.customerName).toBe("Walid Sahraoui");
    expect(order.customerPhone).toBe("0661987654");
    expect(order.itemName).toBe("Wireless Gaming Headset");
    expect(order.currentSize).toBe("Black");
    expect(order.priceDa).toBe(6200);
    expect(order.currentWilaya).toBe("59"); // Aflou (2026 division)
    expect(order.currentCommune).toBe("Aflou");
    expect(order.currentAddressNote).toBe("Arrêt Bureau Yalidine Aflou Centre");

    // Constraints derived from Wilaya 59
    expect(order.constraints.allowedWilayas).toContain("59");
    expect(order.constraints.allowedCommunes).toContain("Aflou");
    expect(order.constraints.allowedSizes).toEqual(["Black"]);
  });

  it("4. executes applyOrderDecision for CONFIRMED and verifies both PATCH /orders/{id} and two-phase POST /orders/{id}/dispatch via MSW", async () => {
    const result = await provider.applyOrderDecision(
      "TSS-90421",
      {
        orderId: "TSS-90421",
        status: "CONFIRMED",
        reasonOrNotes: "Client a confirmé la commande par appel vocal.",
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CONFIRMED_AND_DISPATCHED");

    // Phase 1: PATCH verification
    expect(capturedPatchRequests.length).toBe(1);
    const patchReq = capturedPatchRequests[0];
    expect(patchReq.url).toBe(`${BASE_URL}/orders/TSS-90421`);
    expect(patchReq.headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
    expect(patchReq.headers.get("X-Tassyir-Api-Key")).toBe(API_KEY);
    expect(patchReq.headers.get("Content-Type")).toBe("application/json");
    expect(patchReq.body).toEqual({
      confirmation_status: "confirmed",
      tags: ["akadli-confirmed"],
      notes: "[Akadli-AI] Order CONFIRMED by customer.",
    });

    // Phase 2: POST /dispatch verification
    expect(capturedDispatchRequests.length).toBe(1);
    const dispatchReq = capturedDispatchRequests[0];
    expect(dispatchReq.url).toBe(`${BASE_URL}/orders/TSS-90421/dispatch`);
    expect(dispatchReq.headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
    expect(dispatchReq.headers.get("X-Tassyir-Api-Key")).toBe(API_KEY);
    expect(dispatchReq.body).toEqual({
      ready_for_expedition: true,
      trigger_source: "akadli-ai",
    });
  });

  it("5. executes applyOrderDecision for MODIFIED and asserts updated shipping_address, tags, notes, and /dispatch execution", async () => {
    const result = await provider.applyOrderDecision(
      "TSS-90421",
      {
        orderId: "TSS-90421",
        status: "MODIFIED",
        finalSize: "XL",
        finalWilaya: "25",
        finalCommune: "El Khroub",
        finalAddressNote: "Nouvelle adresse près de la mosquée",
        reasonOrNotes: "Taille changée en XL et précision adresse",
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("UPDATED_AND_DISPATCHED");

    // Phase 1: PATCH verification
    expect(capturedPatchRequests.length).toBe(1);
    const patchReq = capturedPatchRequests[0];
    expect(patchReq.body).toEqual({
      confirmation_status: "confirmed",
      variant_size: "XL",
      tags: ["akadli-modified", "akadli-size-XL"],
      shipping_address: {
        wilaya: "25",
        commune: "El Khroub",
        address: "Nouvelle adresse près de la mosquée",
      },
      notes:
        "[Akadli-AI] Order MODIFIED: Size -> XL; Wilaya -> 25; Commune -> El Khroub; Note -> Nouvelle adresse près de la mosquée; Details: Taille changée en XL et précision adresse",
    });

    // Phase 2: POST /dispatch verification with corrected destination
    expect(capturedDispatchRequests.length).toBe(1);
    const dispatchReq = capturedDispatchRequests[0];
    expect(dispatchReq.body).toEqual({
      ready_for_expedition: true,
      trigger_source: "akadli-ai",
      variant_size: "XL",
      shipping_address: {
        wilaya: "25",
        commune: "El Khroub",
        address: "Nouvelle adresse près de la mosquée",
      },
    });
  });

  it("6. executes applyOrderDecision for REFUSED and asserts confirmation_status: 'refused', 'akadli-refused' tag, and ensures /dispatch is NOT called", async () => {
    const result = await provider.applyOrderDecision(
      "TSS-90421",
      {
        orderId: "TSS-90421",
        status: "REFUSED",
        reasonOrNotes: "Client a refusé la commande au téléphone.",
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("REFUSED");

    // Phase 1: PATCH verification
    expect(capturedPatchRequests.length).toBe(1);
    const patchReq = capturedPatchRequests[0];
    expect(patchReq.body).toEqual({
      confirmation_status: "refused",
      status: "cancelled",
      tags: ["akadli-refused"],
      notes: "[Akadli-AI] Order REFUSED: Client a refusé la commande au téléphone.",
    });

    // Dispatch must NOT be called for REFUSED
    expect(capturedDispatchRequests.length).toBe(0);
  });

  it("7. handles HTTP 401 and 422 API errors cleanly", async () => {
    // 401 Unauthorized on PATCH
    server.use(
      http.patch(`${BASE_URL}/orders/:orderId`, () =>
        HttpResponse.json({ message: "Invalid API Key or expired token." }, { status: 401 })
      )
    );

    const result401 = await provider.applyOrderDecision(
      "TSS-90421",
      {
        orderId: "TSS-90421",
        status: "CONFIRMED",
        reasonOrNotes: "Testing 401",
      },
      CREDENTIALS
    );

    expect(result401.success).toBe(false);
    expect(result401.externalStatus).toBe("UNAUTHORIZED");

    // 422 Unprocessable Entity on dispatch
    server.resetHandlers();
    server.use(
      http.post(`${BASE_URL}/orders/:orderId/dispatch`, () =>
        HttpResponse.json(
          { message: "Courier zone not serviceable.", errors: { wilaya: ["Invalid courier zone"] } },
          { status: 422 }
        )
      )
    );

    const result422 = await provider.applyOrderDecision(
      "TSS-90421",
      {
        orderId: "TSS-90421",
        status: "CONFIRMED",
        reasonOrNotes: "Testing 422 on dispatch",
      },
      CREDENTIALS
    );

    expect(result422.success).toBe(false);
    expect(result422.externalStatus).toBe("UNPROCESSABLE_ENTITY");
  });
});
