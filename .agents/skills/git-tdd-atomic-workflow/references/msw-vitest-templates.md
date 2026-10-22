# Vitest + MSW Provider Test Suite Template (`references/msw-vitest-templates.md`)

Use this canonical template when authoring `packages/provider-<name>/test/provider.test.ts`. It covers all 5 mandatory test cases required by the `git-tdd-atomic-workflow` verification gate.

---

## Complete `test/provider.test.ts` Blueprint

```typescript
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { YouCanProvider } from "../src/index.js";

const fixturePath = resolve(__dirname, "../fixtures/webhook-order-created.json");
const rawFixtureBody = readFileSync(fixturePath, "utf-8");
const parsedFixture = JSON.parse(rawFixtureBody);

const WEBHOOK_SECRET = "test_youcan_webhook_secret_key";
const BASE_URL = "https://api.youcan.shop/v1";
const CREDENTIALS = {
  baseUrl: BASE_URL,
  accessToken: "yc_test_token_123"
};

let lastCapturedBody: Record<string, unknown> | null = null;

const server = setupServer(
  http.put(`${BASE_URL}/orders/:orderId`, async ({ params, request }) => {
    lastCapturedBody = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.orderId,
      status: lastCapturedBody.status ?? "confirmed",
      updated: true
    });
  }),
  http.post(`${BASE_URL}/orders/:orderId/cancel`, async ({ params, request }) => {
    lastCapturedBody = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: params.orderId,
      status: "cancelled",
      reason: lastCapturedBody.reason
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  lastCapturedBody = null;
  server.resetHandlers();
});
afterAll(() => server.close());

describe("Provider Integration Suite (5 Mandatory Scenarios)", () => {
  const provider = new YouCanProvider();

  it("1. verifies valid webhook signatures and rejects invalid signatures", async () => {
    const validSignature = createHmac("sha256", WEBHOOK_SECRET)
      .update(rawFixtureBody)
      .digest("hex");

    const isValid = await provider.verifyWebhook(
      { "x-youcan-signature": validSignature },
      rawFixtureBody,
      WEBHOOK_SECRET
    );
    expect(isValid).toBe(true);

    const isInvalid = await provider.verifyWebhook(
      { "x-youcan-signature": "deadbeef0000" },
      rawFixtureBody,
      WEBHOOK_SECRET
    );
    expect(isInvalid).toBe(false);
  });

  it("2. normalizes order payload from fixtures/webhook-order-created.json", async () => {
    const standardized = await provider.parseWebhookOrder(parsedFixture);

    expect(standardized.orderId).toBeDefined();
    expect(standardized.customerPhone).toMatch(/^(?:0[567]\d{8}|\+213[567]\d{8})$/);
    expect(standardized.currentWilaya).toMatch(/^(?:0[1-9]|[1-4]\d|5[0-8])$/);
    expect(standardized.constraints.allowedWilayas.length).toBeGreaterThan(0);
    expect(standardized.constraints.allowedCommunes.length).toBeGreaterThan(0);
  });

  it("3. executes CONFIRMED decision API call", async () => {
    const result = await provider.applyOrderDecision(
      "ORD-1001",
      {
        orderId: "ORD-1001",
        status: "CONFIRMED",
        reasonOrNotes: "Customer confirmed order in Darja without changes."
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CONFIRMED");
    expect(lastCapturedBody).toMatchObject({
      status: "confirmed"
    });
  });

  it("4. executes MODIFIED (size + commune update) decision API call", async () => {
    const result = await provider.applyOrderDecision(
      "ORD-1001",
      {
        orderId: "ORD-1001",
        status: "MODIFIED",
        finalVariant: "XL",
        finalWilaya: "13",
        finalCommune: "Mansourah",
        finalAddressNote: "Near Pharmacie Centrale",
        reasonOrNotes: "Customer requested size XL and commune Mansourah."
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("UPDATED_AND_CONFIRMED");
    expect(lastCapturedBody).toMatchObject({
      shipping_address: {
        province_code: "13",
        city: "Mansourah",
        address2: "Near Pharmacie Centrale"
      }
    });
  });

  it("5. executes REFUSED (cancellation) decision API call", async () => {
    const result = await provider.applyOrderDecision(
      "ORD-1001",
      {
        orderId: "ORD-1001",
        status: "REFUSED",
        reasonOrNotes: "Customer ordered by mistake and asked to cancel."
      },
      CREDENTIALS
    );

    expect(result.success).toBe(true);
    expect(result.externalStatus).toBe("CANCELLED");
  });
});
```
