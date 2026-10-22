import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { WooCommerceProvider, isWooCommerceWebhookPing } from "../src/index.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const standardFixturePath = resolve(
  __dirname,
  "../fixtures/webhook-order-created.json"
);
const standardRawBody = readFileSync(standardFixturePath, "utf-8");
const standardPayload = JSON.parse(standardRawBody);

const metaCodFixturePath = resolve(
  __dirname,
  "../fixtures/webhook-order-meta-cod.json"
);
const metaCodRawBody = readFileSync(metaCodFixturePath, "utf-8");
const metaCodPayload = JSON.parse(metaCodRawBody);

const SITE_URL = "https://dz-boutique.com";
const CONSUMER_KEY = "ck_test_key_woocommerce_dz";
const CONSUMER_SECRET = "cs_test_secret_woocommerce_dz";
const WEBHOOK_SECRET = "wc_test_webhook_secret_algeria_123";
const EXPECTED_AUTH = `Basic ${Buffer.from(
  `${CONSUMER_KEY}:${CONSUMER_SECRET}`
).toString("base64")}`;

const CREDENTIALS = {
  siteUrl: SITE_URL,
  consumerKey: CONSUMER_KEY,
  consumerSecret: CONSUMER_SECRET,
  cancelOnRefused: "true"
};

let capturedPutRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedNoteRequests: Array<{ url: string; headers: Headers; body: any }> = [];

const server = setupServer(
  http.put(
    `${SITE_URL}/wp-json/wc/v3/orders/:orderId`,
    async ({ request, params }) => {
      const body = await request.json();
      capturedPutRequests.push({
        url: request.url,
        headers: request.headers,
        body
      });
      return HttpResponse.json({
        id: Number(params.orderId),
        ...((body as any) ?? {})
      });
    }
  ),
  http.post(
    `${SITE_URL}/wp-json/wc/v3/orders/:orderId/notes`,
    async ({ request, params }) => {
      const body = await request.json();
      capturedNoteRequests.push({
        url: request.url,
        headers: request.headers,
        body
      });
      return HttpResponse.json({
        id: 999,
        ...((body as any) ?? {})
      });
    }
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  capturedPutRequests = [];
  capturedNoteRequests = [];
  server.resetHandlers();
});
afterAll(() => server.close());

describe("@akadli/provider-woocommerce (WooCommerceProvider Suite)", () => {
  const provider = new WooCommerceProvider();

  it("1. verifies valid x-wc-webhook-signature HMAC-SHA256 Base64 signature and rejects invalid/tampered payloads", async () => {
    const validSignature = createHmac("sha256", WEBHOOK_SECRET)
      .update(Buffer.from(standardRawBody, "utf8"))
      .digest("base64");

    // Case-insensitive header check
    const isValid = await provider.verifyWebhook(
      { "X-WC-Webhook-Signature": validSignature },
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isValid).toBe(true);

    // Lowercase header check
    const isValidLower = await provider.verifyWebhook(
      { "x-wc-webhook-signature": validSignature },
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isValidLower).toBe(true);

    // Tampered body
    const isTampered = await provider.verifyWebhook(
      { "x-wc-webhook-signature": validSignature },
      standardRawBody + "tamper",
      WEBHOOK_SECRET
    );
    expect(isTampered).toBe(false);

    // Wrong secret
    const isWrongSecret = await provider.verifyWebhook(
      { "x-wc-webhook-signature": validSignature },
      standardRawBody,
      "wrong_secret"
    );
    expect(isWrongSecret).toBe(false);

    // Missing header
    const isMissingHeader = await provider.verifyWebhook(
      {},
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isMissingHeader).toBe(false);
  });

  it("2. parses standard WooCommerce Algerian COD order fixture (state: DZ-13) into canonical StandardizedDzOrder", async () => {
    const order = await provider.parseWebhookOrder(standardPayload);

    expect(order.orderId).toBe("54321");
    expect(order.storeName).toBe("WooCommerce DZ Store");
    expect(order.customerName).toBe("Karim Mansouri");
    expect(order.customerPhone).toBe("0550123456");
    expect(order.itemName).toBe("Chaussures de Sport Orthopédiques");
    expect(order.currentVariant).toBe("42");
    expect(order.priceDa).toBe(6500);
    expect(order.currentWilaya).toBe("13"); // Tlemcen
    expect(order.currentCommune).toBe("Maghnia");
    expect(order.currentAddressNote).toContain("Rue de la paix");

    // Constraints derived from Wilaya 13
    expect(order.constraints.allowedWilayas).toContain("13");
    expect(order.constraints.allowedCommunes).toContain("Maghnia");
    expect(order.constraints.allowedCommunes).toContain("Tlemcen");
    expect(order.constraints.allowedVariants).toEqual(["42"]);
  });

  it("3. parses Algerian COD plugin meta_data fixture (Wilaya 60 - Barika) into canonical StandardizedDzOrder", async () => {
    const order = await provider.parseWebhookOrder(metaCodPayload);

    expect(order.orderId).toBe("87654");
    expect(order.storeName).toBe("Boutique Kabyle COD");
    expect(order.customerName).toBe("Amine Benali");
    expect(order.customerPhone).toBe("0660987654");
    expect(order.itemName).toBe("Robe Traditionnelle Chaouie");
    expect(order.currentVariant).toBe("L");
    expect(order.priceDa).toBe(8900);
    expect(order.currentWilaya).toBe("60"); // 60 - Barika
    expect(order.currentCommune).toBe("Barika");
    expect(order.currentAddressNote).toBe("Centre ville en face de la mosquée");

    // Constraints derived from Wilaya 60
    expect(order.constraints.allowedWilayas).toContain("60");
    expect(order.constraints.allowedCommunes).toContain("Barika");
    expect(order.constraints.allowedVariants).toEqual(["L"]);
  });

  it("4. executes applyOrderDecision for CONFIRMED and verifies Basic Auth, PUT order meta, and POST order note", async () => {
    const result = await provider.applyOrderDecision(
      "54321",
      {
        orderId: "54321",
        status: "CONFIRMED",
        reasonOrNotes: "Client confirmed order in Algerian Darja."
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CONFIRMED");

    // Verify PUT request updating meta_data
    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.headers.get("Authorization")).toBe(EXPECTED_AUTH);
    expect(putReq.body).toEqual({
      meta_data: [{ key: "_akadli_status", value: "akadli-confirmed" }]
    });

    // Verify POST request appending internal note
    expect(capturedNoteRequests.length).toBe(1);
    const noteReq = capturedNoteRequests[0];
    expect(noteReq.headers.get("Authorization")).toBe(EXPECTED_AUTH);
    expect(noteReq.body).toEqual({
      customer_note: false,
      note: "[Akadli-AI] Order CONFIRMED by customer (akadli-confirmed)."
    });
  });

  it("5. executes applyOrderDecision for MODIFIED and asserts updated shipping/billing address, variant meta, and order note", async () => {
    const result = await provider.applyOrderDecision(
      "54321",
      {
        orderId: "54321",
        status: "MODIFIED",
        finalVariant: "43",
        finalWilaya: "13",
        finalCommune: "Maghnia",
        finalAddressNote: "Nouvelle adresse près du stade",
        reasonOrNotes: "Taille changée de 42 à 43"
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("UPDATED_AND_CONFIRMED");

    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.headers.get("Authorization")).toBe(EXPECTED_AUTH);
    expect(putReq.body).toEqual({
      shipping: {
        state: "13",
        city: "Maghnia",
        address_1: "Nouvelle adresse près du stade"
      },
      billing: {
        state: "13",
        city: "Maghnia",
        address_1: "Nouvelle adresse près du stade"
      },
      meta_data: [
        { key: "_akadli_status", value: "akadli-modified" },
        { key: "_akadli_variant", value: "43" }
      ]
    });

    expect(capturedNoteRequests.length).toBe(1);
    const noteReq = capturedNoteRequests[0];
    expect(noteReq.body.note).toContain("Variant -> 43");
    expect(noteReq.body.note).toContain("Wilaya -> 13");
    expect(noteReq.body.note).toContain("Commune -> Maghnia");
    expect(noteReq.body.note).toContain("Details: Taille changée de 42 à 43");
  });

  it("6. executes applyOrderDecision for REFUSED and asserts status: cancelled and refusal note", async () => {
    const result = await provider.applyOrderDecision(
      "54321",
      {
        orderId: "54321",
        status: "REFUSED",
        reasonOrNotes: "Client refuse: délai trop long"
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CANCELLED");

    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.headers.get("Authorization")).toBe(EXPECTED_AUTH);
    expect(putReq.body).toEqual({
      status: "cancelled",
      meta_data: [{ key: "_akadli_status", value: "akadli-refused" }]
    });

    expect(capturedNoteRequests.length).toBe(1);
    const noteReq = capturedNoteRequests[0];
    expect(noteReq.body.note).toContain("Client refuse: délai trop long");
  });

  it("7. handles HTTP 401 and 404 API errors gracefully", async () => {
    server.use(
      http.put(`${SITE_URL}/wp-json/wc/v3/orders/:orderId`, () =>
        HttpResponse.json(
          { code: "woocommerce_rest_cannot_edit", message: "Sorry, you cannot edit this resource." },
          { status: 401 }
        )
      )
    );

    const unauthorizedRes = await provider.applyOrderDecision(
      "54321",
      {
        orderId: "54321",
        status: "CONFIRMED",
        reasonOrNotes: "Test unauthorized"
      },
      CREDENTIALS
    );

    expect(unauthorizedRes.success).toBe(false);
    expect(unauthorizedRes.externalStatus).toBe("UNAUTHORIZED");

    server.use(
      http.put(`${SITE_URL}/wp-json/wc/v3/orders/:orderId`, () =>
        HttpResponse.json(
          { code: "woocommerce_rest_order_invalid_id", message: "Invalid order ID." },
          { status: 404 }
        )
      )
    );

    const notFoundRes = await provider.applyOrderDecision(
      "999999",
      {
        orderId: "999999",
        status: "CONFIRMED",
        reasonOrNotes: "Test not found"
      },
      CREDENTIALS
    );

    expect(notFoundRes.success).toBe(false);
    expect(notFoundRes.externalStatus).toBe("NOT_FOUND");
  });

  it("8. detects unsigned WooCommerce deliver_ping handshake and distinguishes from normal orders", () => {
    // 1. Form-urlencoded raw body string (WC deliver_ping default)
    expect(
      isWooCommerceWebhookPing(
        { "content-type": "application/x-www-form-urlencoded" },
        undefined,
        "webhook_id=1"
      )
    ).toBe(true);

    // 2. Parsed body object
    expect(isWooCommerceWebhookPing({}, { webhook_id: 1 })).toBe(true);
    expect(isWooCommerceWebhookPing({}, { webhook_id: "42" })).toBe(true);

    // 3. Raw Buffer
    expect(
      isWooCommerceWebhookPing({}, undefined, Buffer.from("webhook_id=99"))
    ).toBe(true);

    // 4. Topic header fallback
    expect(
      isWooCommerceWebhookPing({
        "x-wc-webhook-topic": "action.woocommerce_deliver_ping"
      })
    ).toBe(true);

    // 5. Provider instance methods
    expect(provider.isWebhookPing({}, { webhook_id: 1 })).toBe(true);
    expect(provider.isWooCommerceWebhookPing({}, { webhook_id: 1 })).toBe(true);

    // 6. Signed request is NEVER treated as a ping handshake
    expect(
      isWooCommerceWebhookPing(
        { "x-wc-webhook-signature": "valid_sig" },
        { webhook_id: 1 }
      )
    ).toBe(false);

    // 7. Case-insensitive signature check prevents false positives
    expect(
      isWooCommerceWebhookPing(
        { "X-WC-Webhook-Signature": "valid_sig" },
        undefined,
        "webhook_id=1"
      )
    ).toBe(false);

    // 8. Normal order fixture is NOT treated as a ping
    expect(
      isWooCommerceWebhookPing({}, standardPayload, standardRawBody)
    ).toBe(false);

    // 9. Empty payload is NOT a ping
    expect(isWooCommerceWebhookPing({}, {})).toBe(false);
  });
});
