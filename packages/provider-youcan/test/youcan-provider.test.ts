import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { YouCanProvider } from "../src/index.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const standardFixturePath = resolve(
  __dirname,
  "../fixtures/webhook-order-created.json"
);
const standardRawBody = readFileSync(standardFixturePath, "utf-8");
const standardPayload = JSON.parse(standardRawBody);

const extraFieldsFixturePath = resolve(
  __dirname,
  "../fixtures/webhook-order-extra-fields.json"
);
const extraFieldsRawBody = readFileSync(extraFieldsFixturePath, "utf-8");
const extraFieldsPayload = JSON.parse(extraFieldsRawBody);

const WEBHOOK_SECRET = "youcan_webhook_secret_key_algeria_123";
const BASE_URL = "https://api.youcan.shop";
const ACCESS_TOKEN = "yc_test_access_token_dz_789";

const CREDENTIALS = {
  baseUrl: BASE_URL,
  accessToken: ACCESS_TOKEN,
  closeOnRefused: "true"
};

let capturedPutRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedCloseRequests: Array<{ url: string; headers: Headers }> = [];

const server = setupServer(
  http.put(`${BASE_URL}/orders/:orderId`, async ({ request, params }) => {
    const body = await request.json();
    capturedPutRequests.push({
      url: request.url,
      headers: request.headers,
      body
    });
    return HttpResponse.json({
      id: params.orderId,
      ...((body as any) ?? {}),
      updated_at: new Date().toISOString()
    });
  }),
  http.put(`${BASE_URL}/orders/:orderId/close`, async ({ request, params }) => {
    capturedCloseRequests.push({
      url: request.url,
      headers: request.headers
    });
    return HttpResponse.json({
      id: params.orderId,
      closed: true,
      closed_at: new Date().toISOString()
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  capturedPutRequests = [];
  capturedCloseRequests = [];
  server.resetHandlers();
});
afterAll(() => server.close());

describe("@akadli/provider-youcan (YouCanProvider Suite)", () => {
  const provider = new YouCanProvider();

  it("1. verifies valid x-youcan-signature HMAC-SHA256 hex signature and rejects invalid/tampered payloads", async () => {
    const validSignature = createHmac("sha256", WEBHOOK_SECRET)
      .update(Buffer.from(standardRawBody, "utf8"))
      .digest("hex");

    // Valid signature with mixed case header name
    const isValid = await provider.verifyWebhook(
      { "X-YouCan-Signature": validSignature },
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isValid).toBe(true);

    // Tampered raw payload
    const isTampered = await provider.verifyWebhook(
      { "x-youcan-signature": validSignature },
      standardRawBody + "tamper",
      WEBHOOK_SECRET
    );
    expect(isTampered).toBe(false);

    // Wrong secret
    const isWrongSecret = await provider.verifyWebhook(
      { "x-youcan-signature": validSignature },
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

  it("2. parses standard shipping.address webhook fixture into canonical StandardizedDzOrder (Wilaya 31)", async () => {
    const order = await provider.parseWebhookOrder(standardPayload);

    expect(order.orderId).toBe("ord_yc_882910");
    expect(order.storeName).toBe("DzMode YouCan Shop");
    expect(order.customerName).toBe("Yasmine Hadji");
    expect(order.customerPhone).toBe("0770987654");
    expect(order.itemName).toBe("Karakou Algérois Velours");
    expect(order.currentSize).toBe("38");
    expect(order.priceDa).toBe(6400);
    expect(order.currentWilaya).toBe("31"); // Oran
    expect(order.currentCommune).toBe("Bir El Djir");
    expect(order.currentAddressNote).toContain("Résidence El Bahia");

    // Constraints derived from Wilaya 31
    expect(order.constraints.allowedWilayas).toContain("31");
    expect(order.constraints.allowedCommunes).toContain("Bir El Djir");
    expect(order.constraints.allowedCommunes).toContain("Oran");
    expect(order.constraints.allowedSizes).toEqual(["38"]);
  });

  it("3. parses Algerian 1-page COD form (extra_fields) fixture into canonical StandardizedDzOrder (2026 Wilaya 68 - Bou Saada)", async () => {
    const order = await provider.parseWebhookOrder(extraFieldsPayload);

    expect(order.orderId).toBe("ord_yc_991823");
    expect(order.storeName).toBe("El Bahdja Express");
    expect(order.customerName).toBe("Lydia Saidi");
    expect(order.customerPhone).toBe("0661234567");
    expect(order.itemName).toBe("Robe Kabyle Moderne");
    expect(order.currentSize).toBe("M");
    expect(order.priceDa).toBe(4800);
    expect(order.currentWilaya).toBe("68"); // Bou Saada (2026 division)
    expect(order.currentCommune).toBe("Bou Saada");
    expect(order.currentAddressNote).toBe(
      "Centre Ville, Près de l'Hôtel Caïd"
    );

    // Constraints derived from Wilaya 68
    expect(order.constraints.allowedWilayas).toContain("68");
    expect(order.constraints.allowedCommunes).toContain("Bou Saada");
    expect(order.constraints.allowedSizes).toEqual(["M"]);
  });

  it("4. executes applyOrderDecision for CONFIRMED and verifies Authorization: Bearer header and request body via MSW", async () => {
    const result = await provider.applyOrderDecision(
      "ord_yc_882910",
      {
        orderId: "ord_yc_882910",
        status: "CONFIRMED",
        reasonOrNotes: "Customer confirmed order in Algerian Darja."
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CONFIRMED");

    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.headers.get("Authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`
    );
    expect(putReq.headers.get("Content-Type")).toBe("application/json");
    expect(putReq.body).toEqual({
      tags: ["akadli-confirmed"],
      notes: "[Akadli-AI] Order CONFIRMED by customer."
    });
  });

  it("5. executes applyOrderDecision for MODIFIED and asserts shipping.address, tags, and notes are updated", async () => {
    const result = await provider.applyOrderDecision(
      "ord_yc_882910",
      {
        orderId: "ord_yc_882910",
        status: "MODIFIED",
        finalSize: "40",
        finalWilaya: "31",
        finalCommune: "Bir El Djir",
        finalAddressNote: "Nouvelle adresse près du rond-point",
        reasonOrNotes: "Taille changée de 38 à 40"
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("UPDATED_AND_CONFIRMED");

    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.headers.get("Authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`
    );
    expect(putReq.body).toEqual({
      tags: ["akadli-modified", "akadli-size-40"],
      notes:
        "[Akadli-AI] Order MODIFIED: Size -> 40; Wilaya -> 31; Commune -> Bir El Djir; Note -> Nouvelle adresse près du rond-point; Details: Taille changée de 38 à 40",
      shipping: {
        address: {
          region: "31",
          city: "Bir El Djir",
          first_line: "Nouvelle adresse près du rond-point"
        }
      }
    });
  });

  it("6. executes applyOrderDecision for REFUSED and asserts tag update + PUT /orders/{id}/close execution", async () => {
    const result = await provider.applyOrderDecision(
      "ord_yc_882910",
      {
        orderId: "ord_yc_882910",
        status: "REFUSED",
        reasonOrNotes: "Client annulé par téléphone"
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CANCELLED");

    // 1. Tag and note update
    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.body.tags).toEqual(["akadli-refused"]);
    expect(putReq.body.notes).toContain("Client annulé par téléphone");

    // 2. Order close call
    expect(capturedCloseRequests.length).toBe(1);
    const closeReq = capturedCloseRequests[0];
    expect(closeReq.url).toBe(`${BASE_URL}/orders/ord_yc_882910/close`);
    expect(closeReq.headers.get("Authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`
    );
  });

  it("7. handles HTTP 401 and 422 API errors gracefully", async () => {
    // 401 Unauthorized
    server.use(
      http.put(`${BASE_URL}/orders/:orderId`, () =>
        HttpResponse.json({ message: "Unauthenticated." }, { status: 401 })
      )
    );

    const result401 = await provider.applyOrderDecision(
      "ord_yc_882910",
      {
        orderId: "ord_yc_882910",
        status: "CONFIRMED",
        reasonOrNotes: "Testing 401"
      },
      CREDENTIALS
    );

    expect(result401.success).toBe(false);
    expect(result401.externalStatus).toBe("UNAUTHORIZED");

    // 422 Unprocessable Entity
    server.use(
      http.put(`${BASE_URL}/orders/:orderId`, () =>
        HttpResponse.json(
          { message: "The given data was invalid.", errors: { tags: ["Invalid tag"] } },
          { status: 422 }
        )
      )
    );

    const result422 = await provider.applyOrderDecision(
      "ord_yc_882910",
      {
        orderId: "ord_yc_882910",
        status: "CONFIRMED",
        reasonOrNotes: "Testing 422"
      },
      CREDENTIALS
    );

    expect(result422.success).toBe(false);
    expect(result422.externalStatus).toBe("UNPROCESSABLE_ENTITY");
  });
});
