**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/provider-tassyir

> Tassyir Algerian COD ERP adapter with HMAC verification, two-phase order mutations, and automated courier expedition dispatch (Yalidine, ZR Express, Ecotrack).

Implements `IEcommerceProvider` from `@akadli/adapter-contract` for merchants and fulfillment centers managing Algerian COD deliveries via Tassyir ERP.

---

## Tassyir ERP Setup & Two-Phase Mutations

1. **Obtain API Key & Webhook Secret:**
   - In your Tassyir ERP Dashboard -> **Settings** -> **API & Integrations**, generate your API Key and copy your Webhook Signing Secret (`x-tassyir-signature` hex digest).
2. **Configure Webhook Endpoint:**
   - Set the webhook delivery URL to `https://your-domain.com/api/webhooks/tassyir` for the `order.created` event.
3. **Two-Phase Post-Call Mutation Protocol:**
   - **Phase 1 (`PATCH /orders/{id}`):** Updates order status (`confirmed` / `refused`), tags (`akadli-confirmed`, `akadli-modified`, `akadli-refused`), address changes, and call notes.
   - **Phase 2 (`POST /orders/{id}/dispatch`):** If status is `CONFIRMED` and `dispatchOnConfirm !== "false"`, dispatches order directly into the connected courier pipeline (Yalidine, ZR Express, or Ecotrack) with `ready_for_expedition: true`.

---

## Credentials Schema (`TassyirCredentialsSchema`)

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `apiKey` | `string` | Yes | — | Tassyir ERP API Key |
| `baseUrl` | `string` | No | `"https://api.tassyir.dz/v1"` | Tassyir REST API endpoint |
| `dispatchOnConfirm` | `string` | No | `"true"` | Triggers Phase 2 courier dispatch when order is confirmed |
| `cancelOnRefused` | `string` | No | `"true"` | Cancels order in ERP if customer refuses delivery |

---

## Usage Example

```typescript
import { TassyirProvider } from "@akadli/provider-tassyir";

const provider = new TassyirProvider();

// 1. Verify Webhook HMAC signature (hex digest from x-tassyir-signature)
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.TASSYIR_WEBHOOK_SECRET!);

// 2. Parse standardized Algerian COD order (normalizes 2026 Wilayas and communes)
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 3. Apply decision (Phase 1 PATCH update + Phase 2 courier dispatch)
const result = await provider.applyOrderDecision(order.orderId, {
  orderId: order.orderId,
  status: "CONFIRMED",
  reasonOrNotes: "Customer confirmed via ElevenAgents call"
}, {
  apiKey: process.env.TASSYIR_API_KEY!,
  dispatchOnConfirm: "true"
});
```
