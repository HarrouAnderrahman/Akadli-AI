import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ShopifyProvider, clearShopifyTokenCache } from "../src/index.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const standardFixturePath = resolve(__dirname, "../fixtures/webhook-order-created.json");
const standardRawBody = readFileSync(standardFixturePath, "utf-8");
const standardPayload = JSON.parse(standardRawBody);

const codFormFixturePath = resolve(__dirname, "../fixtures/webhook-order-cod-form.json");
const codFormRawBody = readFileSync(codFormFixturePath, "utf-8");
const codFormPayload = JSON.parse(codFormRawBody);

const WEBHOOK_SECRET = "shpss_test_secret_key_algeria";
const SHOP_DOMAIN = "dz-fashion.myshopify.com";
const API_VERSION = "2024-04";
const ACCESS_TOKEN = "shpat_test_access_token_dz_123";

const CREDENTIALS = {
  shopDomain: SHOP_DOMAIN,
  accessToken: ACCESS_TOKEN,
  apiVersion: API_VERSION,
  cancelOnRefused: "true"
};

let capturedPutRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedPostRequests: Array<{ url: string; headers: Headers; body: any }> = [];

const server = setupServer(
  http.put(
    `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders/:orderId.json`,
    async ({ request, params }) => {
      const body = await request.json();
      capturedPutRequests.push({
        url: request.url,
        headers: request.headers,
        body
      });
      return HttpResponse.json({
        order: {
          id: Number(params.orderId),
          ...((body as any)?.order ?? {})
        }
      });
    }
  ),
  http.post(
    `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders/:orderId/cancel.json`,
    async ({ request, params }) => {
      const body = await request.json();
      capturedPostRequests.push({
        url: request.url,
        headers: request.headers,
        body
      });
      return HttpResponse.json({
        order: {
          id: Number(params.orderId),
          cancelled_at: new Date().toISOString(),
          cancel_reason: (body as any)?.reason ?? "customer"
        }
      });
    }
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  capturedPutRequests = [];
  capturedPostRequests = [];
  clearShopifyTokenCache();
  server.resetHandlers();
});
afterAll(() => server.close());

describe("@akadli/provider-shopify (ShopifyProvider Suite)", () => {
  const provider = new ShopifyProvider();

  it("1. verifies valid HMAC-SHA256 signature and rejects tampered payloads or wrong secrets", async () => {
    const validSignature = createHmac("sha256", WEBHOOK_SECRET)
      .update(Buffer.from(standardRawBody, "utf8"))
      .digest("base64");

    // Case-insensitive header check
    const isValid = await provider.verifyWebhook(
      { "X-Shopify-Hmac-Sha256": validSignature },
      standardRawBody,
      WEBHOOK_SECRET
    );
    expect(isValid).toBe(true);

    // Tampered body
    const isTampered = await provider.verifyWebhook(
      { "x-shopify-hmac-sha256": validSignature },
      standardRawBody + "tamper",
      WEBHOOK_SECRET
    );
    expect(isTampered).toBe(false);

    // Wrong secret
    const isWrongSecret = await provider.verifyWebhook(
      { "x-shopify-hmac-sha256": validSignature },
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

  it("2. parses standard shipping_address webhook fixture into a valid StandardizedDzOrder", async () => {
    const order = await provider.parseWebhookOrder(standardPayload);

    expect(order.orderId).toBe("1029384756");
    expect(order.storeName).toBe("DzFashion Store");
    expect(order.customerName).toBe("Karim Mansouri");
    expect(order.customerPhone).toBe("0550123456");
    expect(order.itemName).toBe("Chaussures de Sport Orthopédiques");
    expect(order.currentSize).toBe("42");
    expect(order.priceDa).toBe(4500);
    expect(order.currentWilaya).toBe("13"); // Tlemcen
    expect(order.currentCommune).toBe("Maghnia");
    expect(order.currentAddressNote).toContain("Rue de la paix");

    // Constraints derived from Wilaya 13
    expect(order.constraints.allowedWilayas).toContain("13");
    expect(order.constraints.allowedCommunes).toContain("Maghnia");
    expect(order.constraints.allowedCommunes).toContain("Tlemcen");
    expect(order.constraints.allowedSizes).toEqual(["42"]);
  });

  it("3. parses Algerian COD form (note_attributes) fixture into a valid StandardizedDzOrder (Wilaya 60 - Barika)", async () => {
    const order = await provider.parseWebhookOrder(codFormPayload);

    expect(order.orderId).toBe("2049583721");
    expect(order.customerName).toBe("Karim Benali");
    expect(order.customerPhone).toBe("0550123456");
    expect(order.itemName).toBe("Robe Traditionnelle Kabyle");
    expect(order.currentSize).toBe("L");
    expect(order.priceDa).toBe(6800);
    expect(order.currentWilaya).toBe("60"); // Barika (2026 delegated wilaya)
    expect(order.currentCommune).toBe("Barika");
    expect(order.currentAddressNote).toBe("Centre ville en face de la mosquée");

    // Constraints derived from Wilaya 60
    expect(order.constraints.allowedWilayas).toContain("60");
    expect(order.constraints.allowedCommunes).toContain("Barika");
    expect(order.constraints.allowedSizes).toEqual(["L"]);
  });

  it("4. executes applyOrderDecision for CONFIRMED and verifies outbound PUT request headers and body", async () => {
    const result = await provider.applyOrderDecision(
      "1029384756",
      {
        orderId: "1029384756",
        status: "CONFIRMED",
        reasonOrNotes: "Client confirmed order in Algerian Darja."
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CONFIRMED");

    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.headers.get("X-Shopify-Access-Token")).toBe(ACCESS_TOKEN);
    expect(putReq.body).toEqual({
      order: {
        id: 1029384756,
        tags: "akadli-confirmed",
        note: "[Akadli-AI] Order CONFIRMED by customer."
      }
    });
  });

  it("5. executes applyOrderDecision for MODIFIED and asserts shipping_address, tags, and notes are updated", async () => {
    const result = await provider.applyOrderDecision(
      "1029384756",
      {
        orderId: "1029384756",
        status: "MODIFIED",
        finalSize: "43",
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
    expect(putReq.headers.get("X-Shopify-Access-Token")).toBe(ACCESS_TOKEN);
    expect(putReq.body).toEqual({
      order: {
        id: 1029384756,
        tags: "akadli-modified, akadli-size-43",
        note: "[Akadli-AI] Order MODIFIED: Size -> 43; Wilaya -> 13; Commune -> Maghnia; Note -> Nouvelle adresse près du stade; Details: Taille changée de 42 à 43",
        shipping_address: {
          city: "Maghnia (13)",
          address1: "Nouvelle adresse près du stade",
          address2: "Wilaya: 13 | Commune: Maghnia"
        }
      }
    });
  });

  it("6. executes applyOrderDecision for REFUSED and asserts both tag update and /cancel.json execution", async () => {
    const result = await provider.applyOrderDecision(
      "1029384756",
      {
        orderId: "1029384756",
        status: "REFUSED",
        reasonOrNotes: "Le client a commandé par erreur"
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CANCELLED");

    // Assert PUT request tagged the order as refused
    expect(capturedPutRequests.length).toBe(1);
    const putReq = capturedPutRequests[0];
    expect(putReq.body.order.tags).toBe("akadli-refused");
    expect(putReq.body.order.note).toContain("Le client a commandé par erreur");

    // Assert POST request called /cancel.json
    expect(capturedPostRequests.length).toBe(1);
    const postReq = capturedPostRequests[0];
    expect(postReq.url).toBe(
      `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders/1029384756/cancel.json`
    );
    expect(postReq.headers.get("X-Shopify-Access-Token")).toBe(ACCESS_TOKEN);
    expect(postReq.body).toEqual({
      reason: "customer",
      email: false,
      restock: true
    });
  });

  it("7. handles HTTP 401 Unauthorized gracefully", async () => {
    server.use(
      http.put(
        `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/orders/:orderId.json`,
        () => HttpResponse.json({ errors: "[API] Invalid API key or access token" }, { status: 401 })
      )
    );

    const result = await provider.applyOrderDecision(
      "1029384756",
      {
        orderId: "1029384756",
        status: "CONFIRMED",
        reasonOrNotes: "Test unauthorized"
      },
      CREDENTIALS
    );

    expect(result.success).toBe(false);
    expect(result.externalStatus).toBe("UNAUTHORIZED");
  });

  it("8. parses real-world Algerian live Shopify order with missing province (null) into Wilaya 13 - Tlemcen and Commune Maghnia", async () => {
    const liveAlgeriaPayload = {
      id: 9988776655,
      name: "#1002",
      shop_name: "DzShop Live",
      currency: "DZD",
      total_price: "5000",
      line_items: [
        {
          id: 11223344,
          title: "Pack Chaussures",
          variant_title: "42",
          quantity: 1,
          price: "5000"
        }
      ],
      shipping_address: {
        first_name: "Walid",
        last_name: "Benslimane",
        name: "Walid Benslimane",
        phone: "0770987654",
        province: null,
        province_code: null,
        city: "Tlemcen",
        zip: "13000",
        address1: "Maghnia",
        address2: null,
        country: "Algeria",
        country_code: "DZ"
      },
      billing_address: null,
      customer: {
        first_name: "Walid",
        last_name: "Benslimane",
        phone: "0770987654"
      },
      note_attributes: []
    };

    const order = await provider.parseWebhookOrder(liveAlgeriaPayload);

    expect(order.orderId).toBe("9988776655");
    expect(order.customerPhone).toBe("0770987654");
    expect(order.currentWilaya).toBe("13"); // 13 - Tlemcen
    expect(order.currentCommune).toBe("Maghnia");
    expect(order.constraints.allowedWilayas).toContain("13");
    expect(order.constraints.allowedCommunes).toContain("Maghnia");
    expect(order.constraints.allowedCommunes).toContain("Tlemcen");
  });

  it("9. supports OAuth client_credentials token exchange and caches token in memory", async () => {
    let tokenExchangeCount = 0;
    server.use(
      http.post(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, async ({ request }) => {
        tokenExchangeCount++;
        const text = await request.text();
        const params = new URLSearchParams(text);

        if (
          params.get("grant_type") === "client_credentials" &&
          params.get("client_id") === "test_client_id_dz" &&
          params.get("client_secret") === "test_client_secret_dz"
        ) {
          return HttpResponse.json({
            access_token: "shpat_exchanged_oauth_token_789",
            scope: "write_orders,read_orders",
            expires_in: 3600
          });
        }
        return HttpResponse.json({ error: "invalid_client" }, { status: 401 });
      })
    );

    const oauthCreds = {
      shopDomain: SHOP_DOMAIN,
      clientId: "test_client_id_dz",
      clientSecret: "test_client_secret_dz",
      apiVersion: API_VERSION,
      cancelOnRefused: "true"
    };

    // First call: should trigger OAuth token exchange POST
    const firstResult = await provider.applyOrderDecision(
      "1029384756",
      {
        orderId: "1029384756",
        status: "CONFIRMED"
      },
      oauthCreds
    );

    expect(firstResult.success).toBe(true);
    expect(tokenExchangeCount).toBe(1);
    expect(capturedPutRequests.length).toBe(1);
    expect(capturedPutRequests[0].headers.get("X-Shopify-Access-Token")).toBe(
      "shpat_exchanged_oauth_token_789"
    );

    // Second call: should reuse token from in-memory cache without repeating exchange
    const secondResult = await provider.applyOrderDecision(
      "1029384756",
      {
        orderId: "1029384756",
        status: "CONFIRMED"
      },
      oauthCreds
    );

    expect(secondResult.success).toBe(true);
    expect(tokenExchangeCount).toBe(1); // Cached in memory!
    expect(capturedPutRequests.length).toBe(2);
    expect(capturedPutRequests[1].headers.get("X-Shopify-Access-Token")).toBe(
      "shpat_exchanged_oauth_token_789"
    );
  });
});
