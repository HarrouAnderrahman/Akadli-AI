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
    expect(order.currentSize).toBe("L");
    expect(order.priceDa).toBe(8500);
    expect(order.currentWilaya).toBe("25");
    expect(order.currentCommune).toBe("El Khroub");
    expect(order.currentAddressNote).toBe("Cité 1600 Logements, Bâtiment B3");

    expect(order.constraints.allowedWilayas).toContain("25");
    expect(order.constraints.allowedCommunes).toContain("El Khroub");
    expect(order.constraints.allowedSizes).toEqual(["L"]);

    // Stopdesk fixture: Wilaya 59 (Aflou - 2026 division)
    const stopdeskOrder = await provider.parseWebhookOrder(stopdeskPayload);

    expect(stopdeskOrder.orderId).toBe("741000000000000002");
    expect(stopdeskOrder.storeName).toBe("Sahara Tech Store");
    expect(stopdeskOrder.customerName).toBe("Walid Sahraoui");
    expect(stopdeskOrder.customerPhone).toBe("0661987654");
    expect(stopdeskOrder.itemName).toBe("Wireless Gaming Headset");
    expect(stopdeskOrder.currentSize).toBe("Black");
    expect(stopdeskOrder.priceDa).toBe(6200);
    expect(stopdeskOrder.currentWilaya).toBe("59");
    expect(stopdeskOrder.currentCommune).toBe("Aflou");
    expect(stopdeskOrder.currentAddressNote).toBe("Arrêt Bureau Yalidine Aflou Centre");

    expect(stopdeskOrder.constraints.allowedWilayas).toContain("59");
    expect(stopdeskOrder.constraints.allowedCommunes).toContain("Aflou");
    expect(stopdeskOrder.constraints.allowedSizes).toEqual(["Black"]);
  });

  it("9. throws descriptive error when buyer phone is masked or order is in waiting state", async () => {
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

  it("10. executes applyOrderDecision for CONFIRMED (PATCH /orders/{id} + POST /orders/{id}/confirm with Idempotency-Key)", async () => {
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

  it("11. executes applyOrderDecision for MODIFIED (PATCH with buyer.provinceCode, buyer.address, note + POST /confirm)", async () => {
    const result = await provider.applyOrderDecision(
      "741000000000000001",
      {
        orderId: "741000000000000001",
        status: "MODIFIED",
        finalSize: "L",
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
      note: "[Akadli-AI] Order MODIFIED (akadli-modified, akadli-size-L) — Commune: Maghnia | Size: L | Address: Cite Imama | Notes: Customer changed to size L and Maghnia",
    });

    expect(capturedConfirmRequests.length).toBe(1);
    const confirmReq = capturedConfirmRequests[0];
    expect(confirmReq.url).toBe(`${BASE_URL}/orders/741000000000000001/confirm`);
    expect(confirmReq.headers.get("Idempotency-Key")).toBe("akadli-confirm-mod-741000000000000001");
  });

  it("12. executes applyOrderDecision for REFUSED (POST /orders/{id}/cancel with note and Idempotency-Key)", async () => {
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

  it("13. handles rate limits (429 RATE_LIMITED, BUSINESS_RATE_LIMITED), 503 API_BUSY with Retry-After, and 401 UNAUTHORIZED", async () => {
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
});
