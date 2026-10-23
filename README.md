**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)** • [https://akadli.me](https://akadli.me)

# Akadli-AI (`@akadli/*`)

> Open-source Algerian Cash-on-Delivery (COD) Voice Confirmation Engine & E-Commerce Store Adapters.

Akadli-AI automates post-checkout COD order confirmation calls in Algerian Darja via ElevenAgents (WebRTC / SIP / WhatsApp links), validates addresses against the official **2026 Algerian administrative division (69 Wilayas & 1,708 Communes)**, and mutates orders across Shopify, YouCan, WooCommerce, Google Sheets, and Tassyir.

---

## End-to-End Lifecycle

```text
Store Webhook -> @akadli/provider-* (Verify & Parse) -> @akadli/dz-geo (69 Wilayas) -> @akadli/core (Darja Voice Call) -> applyOrderDecision() (Live Store Update)
```

---

## Monorepo Packages

| Package | Scope | Description |
| :--- | :--- | :--- |
| [`@akadli/adapter-contract`](./packages/adapter-contract) | Contracts | Pure Zod schemas & `IEcommerceProvider` contract |
| [`@akadli/dz-geo`](./packages/dz-geo) | Geo / Phone | 2026 Algerian 69 Wilayas, 1,708 Communes & `+213` phone normalizer |
| [`@akadli/core`](./packages/core) | Core Engine | ElevenAgents dynamic variable builder & `handleFinalizeOrderToolCall` orchestrator |
| [`@akadli/provider-shopify`](./packages/provider-shopify) | Adapter | Shopify HMAC verification, Algeria missing-province fallback, OAuth `client_credentials` & REST mutations |
| [`@akadli/provider-youcan`](./packages/provider-youcan) | Adapter | YouCan `.shop` webhook verification, 1-page COD `extra_fields` parser & order close/update API |
| [`@akadli/provider-woocommerce`](./packages/provider-woocommerce) | Adapter | WooCommerce REST v3 Basic Auth, `DZ-XX` state & COD plugin `meta_data` adapter |
| [`@akadli/provider-gsheets`](./packages/provider-gsheets) | Adapter | Universal Google Sheets v4 & Apps Script bridge for SetShop, JustSell, Foorweb & landing pages |
| [`@akadli/provider-tassyir`](./packages/provider-tassyir) | Adapter / ERP | Tassyir Algerian COD ERP & two-phase courier expedition dispatch for Yalidine/Ecotrack/ZR |

---

## 30-Second Example

```typescript
import { ShopifyProvider } from "@akadli/provider-shopify";
import { handleFinalizeOrderToolCall, buildElevenAgentsDynamicVariables } from "@akadli/core";

const provider = new ShopifyProvider();

// 1. Verify webhook signature & parse standardized Algerian COD order
const isValid = await provider.verifyWebhook(headers, rawBody, process.env.SHOPIFY_WEBHOOK_SECRET!);
const order = await provider.parseWebhookOrder(JSON.parse(rawBody));

// 2. Inject dynamic prompt variables into ElevenAgents for Darja voice confirmation call
const promptVars = buildElevenAgentsDynamicVariables(order);

// 3. Handle ElevenAgents finalize_order_decision tool call & mutate live store
const result = await handleFinalizeOrderToolCall(
  agentToolPayload, // e.g. { orderId: order.orderId, status: "CONFIRMED" }
  provider,
  {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
  },
  order.constraints
);
```

---

## Interactive Sandbox (`@akadli/playground`)

Test live voice calls over local Wi-Fi with WebRTC audio streaming:

```bash
git clone https://github.com/HarrouAnderrahman/Akadli-AI.git
pnpm install
pnpm build
pnpm --filter @akadli/playground dev
```

- Open `https://localhost:3000/admin` to trigger calls, inspect payloads, and test webhook ingestion.
- Open `https://localhost:3000/phone` on your smartphone to receive simulated customer voice calls.
- See [`packages/provider-shopify/README.md`](./packages/provider-shopify/README.md) for live Shopify Dev Dashboard (`dev.shopify.com`) & Cloudflare Tunnel setup.

---

## For AI Coding Agents

Review [`./AGENTS.md`](./AGENTS.md) and [`.agents/skills/`](./.agents/skills/) before modifying code:
- Maintain `@akadli/*` package boundaries and zero-bloat runtime dependencies.
- Preserve 2026 Wilaya mappings (`01`-`69`) and canonical tags (`akadli-confirmed`, `akadli-modified`, `akadli-refused`).
- Enforce the pre-commit verification gate: `pnpm turbo run build typecheck lint test`.

---

## License

[MIT](./LICENSE)
