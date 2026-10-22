import { readFileSync } from "node:fs";
import { createHmac, generateKeyPairSync, sign } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  TassyirProvider,
  TassyirClient,
  fetchTassyirWebhookPublicKeys,
  clearWebhookKeysCache,
  ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY,
  parseEd25519PublicKey,
  cleanVariantString,
  extractVariantFromItem,
  extractAllowedSizesFromProduct,
} from "../src/index.js";

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

const BASE_URL = "https://api.tassyir.io/apps/2026-10";
const ACCESS_TOKEN = "tss_live_access_token_dz_2026";
const HMAC_SECRET = "tss_webhook_secret_key_algeria_456";

const CREDENTIALS = {
  baseUrl: BASE_URL,
  accessToken: ACCESS_TOKEN,
  confirmOnModified: "true",
  cancelOnRefused: "true",
};

// Generate Ed25519 keypair for testing official v1a Standard Webhooks
const { publicKey: edPublicKey, privateKey: edPrivateKey } =
  generateKeyPairSync("ed25519");
const edPublicDer = edPublicKey.export({ type: "spki", format: "der" });
const edPublicRawBase64 = edPublicDer.subarray(12).toString("base64");
const edPublicSpkiPem = edPublicKey.export({ type: "spki", format: "pem" }).toString();
const edPublicWhpk = `whpk_${edPublicRawBase64}`;

let capturedPatchRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedConfirmRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedCancelRequests: Array<{ url: string; headers: Headers; body: any }> = [];
let capturedOAuthRequests: Array<{ url: string; headers: Headers; body: string }> = [];

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
  http.post(`${BASE_URL}/orders/:orderId/confirm`, async ({ request, params }) => {
    const body = await request.json().catch(() => ({}));
    capturedConfirmRequests.push({
      url: request.url,
      headers: request.headers,
      body,
    });
    return HttpResponse.json({
      id: params.orderId,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    });
  }),
  http.post(`${BASE_URL}/orders/:orderId/cancel`, async ({ request, params }) => {
    const body = await request.json();
    capturedCancelRequests.push({
      url: request.url,
      headers: request.headers,
      body,
    });
    return HttpResponse.json({
      id: params.orderId,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    });
  }),
  http.get("https://api.tassyir.io/apps/webhook-keys", async () => {
    return HttpResponse.json({
      keys: [
        {
          kid: "whk-test-mock-key-1",
          scheme: "v1a",
          publicKey: edPublicWhpk,
        },
      ],
    });
  }),
  http.post("https://api.tassyir.io/apps/oauth/token", async ({ request }) => {
    const rawText = await request.text();
    capturedOAuthRequests.push({
      url: request.url,
      headers: request.headers,
      body: rawText,
    });
    const params = new URLSearchParams(rawText);
    const grantType = params.get("grant_type");
    if (grantType === "authorization_code") {
      return HttpResponse.json({
        access_token: "tsy_at_mock_token_code_123",
        refresh_token: "tsy_rt_mock_token_code_456",
        token_type: "Bearer",
        expires_in: 3600,
        installation_id: "inst_mock_001",
      });
    } else if (grantType === "refresh_token") {
      return HttpResponse.json({
        access_token: "tsy_at_mock_refreshed_789",
        refresh_token: "tsy_rt_mock_refreshed_999",
        token_type: "Bearer",
        expires_in: 3600,
      });
    }
    return HttpResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  capturedPatchRequests = [];
  capturedConfirmRequests = [];
  capturedCancelRequests = [];
  capturedOAuthRequests = [];
  clearWebhookKeysCache();
  server.resetHandlers();
});
afterAll(() => server.close());

describe("@akadli/provider-tassyir (Official 2026-10 Admin API & Webhook Suite)", () => {
  const provider = new TassyirProvider();

  it("1. verifies official Tassyir Standard Webhooks (v1a Ed25519) with whpk_ keys and zero-secret fetching", async () => {
    const webhookId = "msg_741000000000000001";
    const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
    const messageToSign = `${webhookId}.${webhookTimestamp}.${standardRawBody}`;
    const sigBase64 = sign(null, Buffer.from(messageToSign, "utf8"), edPrivateKey).toString("base64");

    // A. Valid with whpk_<base64> raw 32-byte Ed25519 public key passed as secret
    const isValidWhpk = await provider.verifyWebhook(
      {
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": `v1a,${sigBase64}`,
      },
      standardRawBody,
      edPublicWhpk
    );
    expect(isValidWhpk).toBe(true);

    // B. Valid with empty secret using zero-secret public key fetching from GET /apps/webhook-keys
    const isValidZeroSecret = await provider.verifyWebhook(
      {
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": `v1a,${sigBase64}`,
      },
      standardRawBody,
      ""
    );
    expect(isValidZeroSecret).toBe(true);

    // C. Valid with SPKI PEM public key
    const isValidPemKey = await provider.verifyWebhook(
      {
        "Webhook-Id": webhookId,
        "Webhook-Timestamp": webhookTimestamp,
        "Webhook-Signature": `v1a,${sigBase64}`,
      },
      standardRawBody,
      edPublicSpkiPem
    );
    expect(isValidPemKey).toBe(true);

    // D. Rejects expired timestamp (> 5 minutes old)
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 301).toString();
    const oldMessage = `${webhookId}.${oldTimestamp}.${standardRawBody}`;
    const oldSig = sign(null, Buffer.from(oldMessage, "utf8"), edPrivateKey).toString("base64");
    const isExpired = await provider.verifyWebhook(
      {
        "webhook-id": webhookId,
        "webhook-timestamp": oldTimestamp,
        "webhook-signature": `v1a,${oldSig}`,
      },
      standardRawBody,
      edPublicWhpk
    );
    expect(isExpired).toBe(false);

    // E. Rejects tampered rawBody
    const isTampered = await provider.verifyWebhook(
      {
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": `v1a,${sigBase64}`,
      },
      standardRawBody + "tamper",
      edPublicWhpk
    );
    expect(isTampered).toBe(false);

    // F. Rejects wrong public key
    const { publicKey: otherPub } = generateKeyPairSync("ed25519");
    const otherPubRawB64 = otherPub.export({ type: "spki", format: "der" }).subarray(12).toString("base64");
    const isWrongKey = await provider.verifyWebhook(
      {
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": `v1a,${sigBase64}`,
      },
      standardRawBody,
      `whpk_${otherPubRawB64}`
    );
    expect(isWrongKey).toBe(false);
  });

  it("2. decodes raw 32-byte Ed25519 whpk_ public key into crypto.KeyObject using native ASN.1 SPKI prefix", () => {
    const keyObject = parseEd25519PublicKey(edPublicWhpk);
    expect(keyObject).not.toBeNull();
    expect(keyObject?.asymmetricKeyType).toBe("ed25519");

    // Also decodes active live fallback public key
    const activeKeyObject = parseEd25519PublicKey(ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY);
    expect(activeKeyObject).not.toBeNull();
    expect(activeKeyObject?.asymmetricKeyType).toBe("ed25519");
  });

  it("3. caches webhook public keys from GET /apps/webhook-keys and falls back gracefully", async () => {
    clearWebhookKeysCache();
    const keys = await fetchTassyirWebhookPublicKeys();
    expect(keys).toContain(edPublicWhpk);

    // Verify cache hit (does not re-request when cached)
    server.use(
      http.get("https://api.tassyir.io/apps/webhook-keys", () =>
        HttpResponse.json({ error: "server_down" }, { status: 500 })
      )
    );
    const cached = await fetchTassyirWebhookPublicKeys();
    expect(cached).toContain(edPublicWhpk);

    // Clear cache, server fails -> returns default fallback key
    clearWebhookKeysCache();
    const fallbackKeys = await fetchTassyirWebhookPublicKeys();
    expect(fallbackKeys).toContain(ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY);
  });

  it("4. redeems install code via POST /apps/oauth/token using HTTP Basic Auth", async () => {
    const client = new TassyirClient({
      clientId: "app_test_client_id",
      clientSecret: "tsy_cs_test_client_secret",
      baseUrl: BASE_URL,
    });

    const tokens = await client.redeemInstallCode(
      "app_test_client_id",
      "tsy_cs_test_client_secret",
      "tsy_ic_order_auth_code_123"
    );

    expect(tokens.access_token).toBe("tsy_at_mock_token_code_123");
    expect(tokens.refresh_token).toBe("tsy_rt_mock_token_code_456");
    expect(tokens.expires_in).toBe(3600);

    expect(capturedOAuthRequests.length).toBe(1);
    const req = capturedOAuthRequests[0];
    expect(req.url).toBe("https://api.tassyir.io/apps/oauth/token");

    // HTTP Basic Auth header check
    const expectedBasic = Buffer.from("app_test_client_id:tsy_cs_test_client_secret").toString("base64");
    expect(req.headers.get("Authorization")).toBe(`Basic ${expectedBasic}`);
    expect(req.headers.get("Content-Type")).toBe("application/x-www-form-urlencoded");

    // Body check: grant_type=authorization_code & code (and NO client_secret in body)
    const bodyParams = new URLSearchParams(req.body);
    expect(bodyParams.get("grant_type")).toBe("authorization_code");
    expect(bodyParams.get("code")).toBe("tsy_ic_order_auth_code_123");
    expect(bodyParams.get("client_secret")).toBeNull();

    // Client credentials updated
    expect(client.getCredentials().accessToken).toBe("tsy_at_mock_token_code_123");
    expect(client.getCredentials().refreshToken).toBe("tsy_rt_mock_token_code_456");
  });

  it("5. refreshes access token via POST /apps/oauth/token using HTTP Basic Auth", async () => {
    const client = new TassyirClient({
      clientId: "app_test_client_id",
      clientSecret: "tsy_cs_test_client_secret",
      refreshToken: "tsy_rt_mock_token_code_456",
      baseUrl: BASE_URL,
    });

    const tokens = await client.refreshAccessToken(
      "app_test_client_id",
      "tsy_cs_test_client_secret",
      "tsy_rt_mock_token_code_456"
    );

    expect(tokens.access_token).toBe("tsy_at_mock_refreshed_789");
    expect(tokens.refresh_token).toBe("tsy_rt_mock_refreshed_999");

    expect(capturedOAuthRequests.length).toBe(1);
    const req = capturedOAuthRequests[0];
    expect(req.url).toBe("https://api.tassyir.io/apps/oauth/token");

    const expectedBasic = Buffer.from("app_test_client_id:tsy_cs_test_client_secret").toString("base64");
    expect(req.headers.get("Authorization")).toBe(`Basic ${expectedBasic}`);

    const bodyParams = new URLSearchParams(req.body);
    expect(bodyParams.get("grant_type")).toBe("refresh_token");
    expect(bodyParams.get("refresh_token")).toBe("tsy_rt_mock_token_code_456");
    expect(bodyParams.get("client_secret")).toBeNull();

    expect(client.getCredentials().accessToken).toBe("tsy_at_mock_refreshed_789");
  });

  it("6. auto-refreshes token on request when only clientId, clientSecret, and refreshToken are provided", async () => {
    const client = new TassyirClient({
      clientId: "app_test_client_id",
      clientSecret: "tsy_cs_test_client_secret",
      refreshToken: "tsy_rt_initial_refresh",
      baseUrl: BASE_URL,
    });

    // updateOrder has no accessToken initially -> auto-refreshes before PATCH
    const result = await client.updateOrder("741000000000000001", {
      note: "Auto-refresh test note",
    });

    expect(result.success).toBe(true);
    expect(capturedOAuthRequests.length).toBe(1);
    expect(capturedPatchRequests.length).toBe(1);
    expect(capturedPatchRequests[0].headers.get("Authorization")).toBe(
      "Bearer tsy_at_mock_refreshed_789"
    );
  });

  it("7. verifies HMAC-SHA256 signatures (x-tassyir-signature and webhook-signature simulations)", async () => {
    const validHmacHex = createHmac("sha256", HMAC_SECRET)
      .update(Buffer.from(standardRawBody, "utf8"))
      .digest("hex");

    // Valid x-tassyir-signature
    const isValidTassyir = await provider.verifyWebhook(
      { "X-Tassyir-Signature": validHmacHex },
      standardRawBody,
      HMAC_SECRET
    );
    expect(isValidTassyir).toBe(true);

    // Valid fallback x-akadli-signature
    const isValidAkadli = await provider.verifyWebhook(
      { "x-akadli-signature": validHmacHex },
      standardRawBody,
      HMAC_SECRET
    );
    expect(isValidAkadli).toBe(true);

    // Missing header
    const isMissingHeader = await provider.verifyWebhook({}, standardRawBody, HMAC_SECRET);
    expect(isMissingHeader).toBe(false);

    // Wrong secret
    const isWrongSecret = await provider.verifyWebhook(
      { "x-tassyir-signature": validHmacHex },
      standardRawBody,
      "wrong_secret"
    );
    expect(isWrongSecret).toBe(false);
  });

  it("8. parses real 2026-10 orders/created webhook envelope into a canonical StandardizedDzOrder", async () => {
    // Standard fixture: Wilaya 25 (Constantine)
    const order = await provider.parseWebhookOrder(standardPayload);

    expect(order.orderId).toBe("741000000000000001");
    expect(order.storeName).toBe("Dz Mode Constantine");
    expect(order.customerName).toBe("Khadija Benali");
    expect(order.customerPhone).toBe("0550123456");
    expect(order.itemName).toBe("Robe Traditionnelle Constantinoise");
    expect(order.currentVariant).toBe("L");
    expect(order.priceDa).toBe(8500);
    expect(order.currentWilaya).toBe("25");
    expect(order.currentCommune).toBe("El Khroub");
    expect(order.currentAddressNote).toBe("Cité 1600 Logements, Bâtiment B3");

    expect(order.constraints.allowedWilayas).toContain("25");
    expect(order.constraints.allowedCommunes).toContain("El Khroub");
    expect(order.constraints.allowedVariants).toEqual(["L"]);

    // Stopdesk fixture: Wilaya 59 (Aflou - 2026 division)
    const stopdeskOrder = await provider.parseWebhookOrder(stopdeskPayload);

    expect(stopdeskOrder.orderId).toBe("741000000000000002");
    expect(stopdeskOrder.storeName).toBe("Sahara Tech Store");
    expect(stopdeskOrder.customerName).toBe("Walid Sahraoui");
    expect(stopdeskOrder.customerPhone).toBe("0661987654");
    expect(stopdeskOrder.itemName).toBe("Wireless Gaming Headset");
    expect(stopdeskOrder.currentVariant).toBe("Black");
    expect(stopdeskOrder.priceDa).toBe(6200);
    expect(stopdeskOrder.currentWilaya).toBe("59");
    expect(stopdeskOrder.currentCommune).toBe("Aflou");
    expect(stopdeskOrder.currentAddressNote).toBe("Arrêt Bureau Yalidine Aflou Centre");

    expect(stopdeskOrder.constraints.allowedWilayas).toContain("59");
    expect(stopdeskOrder.constraints.allowedCommunes).toContain("Aflou");
    expect(stopdeskOrder.constraints.allowedVariants).toEqual(["Black"]);
  });

  it("9. parses Tassyir orders/created with numeric townOns, null address2, and orderNumber successfully", async () => {
    const tassyirLivePayload = {
      id: "evt_0",
      type: "orders/created",
      apiVersion: "2026-10",
      createdAt: "2026-10-22T15:46:53.133Z",
      businessId: "768261938617522044",
      storeId: "1000000000000000100",
      appId: "768498309554771615",
      installationId: "768500224288102645",
      changed: [],
      data: {
        order: {
          id: "1000000000000000001",
          orderNumber: "TEST-1001",
          storeId: "1000000000000000100",
          status: "pending",
          waiting: false,
          archived: false,
          dispatched: false,
          delivered: false,
          returned: false,
          currency: "DZD",
          total: "4600.00",
          shippingPrice: "600.00",
          subtotal: "5000.00",
          discountTotal: "1000.00",
          discounts: [
            {
              title: "Sample 2-piece offer",
              code: null,
              class: "product",
              source: "offer",
              amount: "1000.00",
              offerId: null,
            },
          ],
          buyer: {
            provinceCode: 16,
            townOns: 1601,
            address: "12 Rue Didouche Mourad",
            address2: null,
            name: "Sofiane Mansouri",
            phone: "0550112233",
          },
          items: [
            {
              id: "item_123",
              title: "T-Shirt Algerie",
              variantTitle: "L",
              quantity: 1,
              price: "4600.00",
            },
          ],
        },
      },
    };

    const order = await provider.parseWebhookOrder(tassyirLivePayload);
    expect(order.orderId).toBe("1000000000000000001");
    expect(order.customerPhone).toBe("0550112233");
    expect(order.currentWilaya).toBe("16");
    expect(order.priceDa).toBe(4600);
    expect(order.currentAddressNote).toBe("12 Rue Didouche Mourad");
    expect(order.itemName).toBe("T-Shirt Algerie");
    expect(order.currentVariant).toBe("L");
  });

  it("10. throws descriptive error when buyer phone is masked or order is in waiting state", async () => {
    const maskedPayload = {
      apiVersion: "2026-10",
      data: {
        order: {
          id: "741000000000000003",
          total: "5000.00",
          buyer: {
            name: "Amine Belkacem",
            phone: "**********",
            provinceCode: 16,
          },
          items: [{ title: "T-Shirt", variantTitle: "M" }],
        },
      },
    };

    await expect(provider.parseWebhookOrder(maskedPayload)).rejects.toThrow(
      "Tassyir order buyer contact is masked or missing: ensure your Tassyir app has the 'read_customer_contact' scope and the order is not in WAITING state."
    );

    const waitingPayload = {
      apiVersion: "2026-10",
      data: {
        order: {
          id: "741000000000000004",
          waiting: true,
          total: "5000.00",
          buyer: {
            name: "Amine Belkacem",
            phone: "0555112233",
            provinceCode: 16,
          },
          items: [{ title: "T-Shirt", variantTitle: "M" }],
        },
      },
    };

    await expect(provider.parseWebhookOrder(waitingPayload)).rejects.toThrow(
      "Tassyir order buyer contact is masked or missing: ensure your Tassyir app has the 'read_customer_contact' scope and the order is not in WAITING state."
    );
  });

  it("11. executes applyOrderDecision for CONFIRMED (PATCH /orders/{id} + POST /orders/{id}/confirm with Idempotency-Key)", async () => {
    const result = await provider.applyOrderDecision(
      "741000000000000001",
      {
        orderId: "741000000000000001",
        status: "CONFIRMED",
        reasonOrNotes: "Customer confirmed via voice agent",
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CONFIRMED");

    expect(capturedPatchRequests.length).toBe(1);
    const patchReq = capturedPatchRequests[0];
    expect(patchReq.url).toBe(`${BASE_URL}/orders/741000000000000001`);
    expect(patchReq.headers.get("Authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(patchReq.headers.get("Content-Type")).toBe("application/json");
    expect(patchReq.body).toEqual({
      note: "[Akadli-AI] Order CONFIRMED by customer (akadli-confirmed).",
    });

    expect(capturedConfirmRequests.length).toBe(1);
    const confirmReq = capturedConfirmRequests[0];
    expect(confirmReq.url).toBe(`${BASE_URL}/orders/741000000000000001/confirm`);
    expect(confirmReq.headers.get("Authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(confirmReq.headers.get("Idempotency-Key")).toBe("akadli-confirm-741000000000000001");
  });

  it("12. executes applyOrderDecision for MODIFIED (PATCH with buyer.provinceCode, buyer.address, note + POST /confirm)", async () => {
    const result = await provider.applyOrderDecision(
      "741000000000000001",
      {
        orderId: "741000000000000001",
        status: "MODIFIED",
        finalVariant: "L",
        finalWilaya: "13",
        finalCommune: "Maghnia",
        finalAddressNote: "Cite Imama",
        reasonOrNotes: "Customer changed to size L and Maghnia",
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("MODIFIED");

    expect(capturedPatchRequests.length).toBe(1);
    const patchReq = capturedPatchRequests[0];
    expect(patchReq.url).toBe(`${BASE_URL}/orders/741000000000000001`);
    expect(patchReq.body).toEqual({
      buyer: {
        provinceCode: 13,
        address: "Maghnia - Cite Imama",
      },
      note: "[Akadli-AI] Order MODIFIED (akadli-modified, akadli-variant-L) — Commune: Maghnia | Variant: L | Address: Cite Imama | Notes: Customer changed to size L and Maghnia",
    });

    expect(capturedConfirmRequests.length).toBe(1);
    const confirmReq = capturedConfirmRequests[0];
    expect(confirmReq.url).toBe(`${BASE_URL}/orders/741000000000000001/confirm`);
    expect(confirmReq.headers.get("Idempotency-Key")).toBe("akadli-confirm-mod-741000000000000001");
  });

  it("13. executes applyOrderDecision for REFUSED (POST /orders/{id}/cancel with note and Idempotency-Key)", async () => {
    const result = await provider.applyOrderDecision(
      "741000000000000001",
      {
        orderId: "741000000000000001",
        status: "REFUSED",
        reasonOrNotes: "Customer cancelled during voice call",
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("REFUSED");

    expect(capturedCancelRequests.length).toBe(1);
    const cancelReq = capturedCancelRequests[0];
    expect(cancelReq.url).toBe(`${BASE_URL}/orders/741000000000000001/cancel`);
    expect(cancelReq.headers.get("Authorization")).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(cancelReq.headers.get("Idempotency-Key")).toBe("akadli-cancel-741000000000000001");
    expect(cancelReq.body).toEqual({
      note: "[Akadli-AI] Order REFUSED by customer (akadli-refused): Customer cancelled during voice call",
    });

    expect(capturedConfirmRequests.length).toBe(0);
  });

  it("14. handles rate limits (429 RATE_LIMITED, BUSINESS_RATE_LIMITED), 503 API_BUSY with Retry-After, and 401 UNAUTHORIZED", async () => {
    // 401 Unauthorized
    server.use(
      http.patch(`${BASE_URL}/orders/:orderId`, () =>
        HttpResponse.json({ message: "Invalid access token." }, { status: 401 })
      )
    );

    const result401 = await provider.applyOrderDecision(
      "741000000000000001",
      { orderId: "741000000000000001", status: "CONFIRMED" },
      CREDENTIALS
    );
    expect(result401.success).toBe(false);
    expect(result401.externalStatus).toBe("UNAUTHORIZED");

    // 429 BUSINESS_RATE_LIMITED
    server.resetHandlers();
    server.use(
      http.patch(`${BASE_URL}/orders/:orderId`, () =>
        HttpResponse.json(
          { code: "BUSINESS_RATE_LIMITED", message: "Merchant monthly API call quota exceeded." },
          { status: 429, headers: { "Retry-After": "0" } }
        )
      )
    );

    const result429Business = await provider.applyOrderDecision(
      "741000000000000001",
      { orderId: "741000000000000001", status: "CONFIRMED" },
      CREDENTIALS
    );
    expect(result429Business.success).toBe(false);
    expect(result429Business.externalStatus).toBe("BUSINESS_RATE_LIMITED");

    // 503 API_BUSY
    server.resetHandlers();
    server.use(
      http.patch(`${BASE_URL}/orders/:orderId`, () =>
        HttpResponse.json(
          { message: "Tassyir database is currently undergoing maintenance." },
          { status: 503, headers: { "Retry-After": "0" } }
        )
      )
    );

    const result503 = await provider.applyOrderDecision(
      "741000000000000001",
      { orderId: "741000000000000001", status: "CONFIRMED" },
      CREDENTIALS
    );
    expect(result503.success).toBe(false);
    expect(result503.externalStatus).toBe("API_BUSY");
  });

  it("15. parses live Tassyir payload with variantName: 'nike ensemble - M' and extracts clean variant 'M'", async () => {
    const liveOrderPayload = {
      id: "evt_768511938354222522",
      type: "orders/created",
      apiVersion: "2026-10",
      createdAt: "2026-10-22T16:32:04.365Z",
      businessId: "768261938617522044",
      storeId: "768261943948481595",
      appId: "768498309554771615",
      installationId: "768500224288102645",
      changed: [],
      data: {
        order: {
          id: "768511937683136113",
          orderNumber: "#00000201",
          storeId: "768261943948481595",
          status: "pending",
          waiting: false,
          archived: false,
          dispatched: false,
          delivered: false,
          returned: false,
          currency: "DZD",
          total: "4000.00",
          shippingPrice: "0.00",
          subtotal: "4000.00",
          discountTotal: "0.00",
          discounts: [],
          buyer: {
            provinceCode: 13,
            townOns: 1316,
            name: "harrou amine",
            phone: "+213550000000",
            phone2: null,
            email: null,
            address: "أولاد أحمد",
            address2: null,
          },
          delivery: {
            method: "home",
            speed: "standard",
            deliveryAgentId: null,
            trackingNumber: null,
            carrierStatus: null,
          },
          items: [
            {
              id: "768511937829934974",
              productId: "768511690433109782",
              variantId: "768511691032893383",
              packParentItemId: null,
              name: "nike ensemble",
              variantName: "nike ensemble - M",
              sku: null,
              quantity: 1,
              unitPrice: "4000.00",
              totalPrice: "4000.00",
            },
          ],
        },
      },
    };

    const order = await provider.parseWebhookOrder(liveOrderPayload);
    expect(order.orderId).toBe("768511937683136113");
    expect(order.itemName).toBe("nike ensemble");
    expect(order.currentVariant).toBe("M");
    expect(order.constraints.allowedVariants).toEqual(["M"]);
    expect(order.currentWilaya).toBe("13");
    expect(order.currentAddressNote).toBe("أولاد أحمد");
    expect(order.priceDa).toBe(4000);
  });

  it("16. fetches live product variants via GET /products/:id when credentials are provided to parseWebhookOrder", async () => {
    server.use(
      http.get(`${BASE_URL}/products/768511690433109782`, () =>
        HttpResponse.json({
          id: "768511690433109782",
          name: "nike ensemble",
          options: [
            {
              name: "Taille",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            { id: "v1", name: "nike ensemble - S" },
            { id: "v2", name: "nike ensemble - M" },
            { id: "v3", name: "nike ensemble - L" },
            { id: "v4", name: "nike ensemble - XL" },
          ],
        })
      )
    );

    const liveOrderPayload = {
      id: "evt_768511938354222522",
      type: "orders/created",
      apiVersion: "2026-10",
      data: {
        order: {
          id: "768511937683136113",
          total: "4000.00",
          buyer: {
            provinceCode: 13,
            townOns: 1316,
            name: "harrou amine",
            phone: "+213550000000",
            address: "أولاد أحمد",
          },
          items: [
            {
              id: "item_1",
              productId: "768511690433109782",
              variantId: "v2",
              name: "nike ensemble",
              variantName: "nike ensemble - M",
            },
          ],
        },
      },
    };

    const order = await provider.parseWebhookOrder(liveOrderPayload, {
      credentials: CREDENTIALS,
    });

    expect(order.currentVariant).toBe("M");
    expect(order.constraints.allowedVariants).toEqual(["S", "M", "L", "XL"]);
  });

  it("17. unit tests variant parsing helpers for multiple delimiters and edge cases", () => {
    // cleanVariantString
    expect(cleanVariantString("nike ensemble - M", "nike ensemble")).toBe("M");
    expect(cleanVariantString("nike ensemble - Rouge / XL", "nike ensemble")).toBe("Rouge / XL");
    expect(cleanVariantString("nike ensemble", "nike ensemble")).toBe("Standard");
    expect(cleanVariantString("nike ensemble - Default Title", "nike ensemble")).toBe("Standard");
    expect(cleanVariantString("nike ensemble - Standard", "nike ensemble")).toBe("Standard");
    expect(cleanVariantString("42", "Chaussure")).toBe("42");
    expect(cleanVariantString("L", "Robe")).toBe("L");
    expect(cleanVariantString("", "Product")).toBe("Standard");
    expect(cleanVariantString(null, "Product")).toBe("Standard");

    // extractVariantFromItem
    expect(extractVariantFromItem({ name: "T-Shirt", variantName: "T-Shirt - XL" })).toBe("XL");
    expect(extractVariantFromItem({ name: "T-Shirt", variantTitle: "L" })).toBe("L");
    expect(extractVariantFromItem({ name: "T-Shirt", size: "38" })).toBe("38");
    expect(extractVariantFromItem({ name: "T-Shirt", options: ["Rouge", "M"] })).toBe("Rouge / M");
    expect(extractVariantFromItem({ name: "T-Shirt", variantName: "T-Shirt" })).toBe("Standard");
    expect(extractVariantFromItem(undefined)).toBe("Standard");

    // extractAllowedSizesFromProduct
    const product = {
      id: "prod_1",
      name: "Ensemble Sport",
      options: [
        { name: "Taille", values: ["M", "L", "XL"] },
      ],
      variants: [
        { id: "1", name: "Ensemble Sport - M" },
        { id: "2", name: "Ensemble Sport - L" },
        { id: "3", name: "Ensemble Sport - XL" },
      ],
    };
    expect(extractAllowedSizesFromProduct(product)).toEqual(["M", "L", "XL"]);
  });
});
