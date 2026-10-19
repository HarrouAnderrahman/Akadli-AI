**[English](./README.md) | [🇩🇿 العربية](./README.ar.md)**

# @akadli/playground

> Local HTTPS WebRTC phone simulator (/phone) and desktop admin dispatch center (/admin) for end-to-end testing of Algerian COD voice calls and webhook integrations over LAN Wi-Fi.

`@akadli/playground` provides an isolated testbed to simulate inbound store orders, test live Darja speech-to-speech calls via ElevenAgents, and inspect order decisions without deploying external servers.

---

## Quick Start

```bash
# 1. Install & build from root
pnpm install && pnpm build

# 2. Configure credentials in apps/akadli-playground/.env
cp apps/akadli-playground/.env.example apps/akadli-playground/.env

# 3. Launch the playground server
pnpm --filter @akadli/playground dev
```

- **Admin Dashboard (`/admin`):** Open `https://localhost:3000/admin` to trigger calls, load sample fixtures, and monitor transcripts.
- **Mobile Phone Receiver (`/phone`):** Open `https://<YOUR-LAN-IP>:3000/phone` on your smartphone (connected to same Wi-Fi) to receive the simulated customer call with custom ringtone.

---

## Environment Variables (`server/src/config.ts`)

| Category | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| **Server** | `PORT` / `SERVER_PORT` | `3000` / `3001` | Frontend Vite and backend Express ports |
| **ElevenLabs** | `ELEVENLABS_API_KEY` / `_AGENT_ID` | — | ElevenAgents voice synthesis credentials |
| **Shopify** | `SHOPIFY_SHOP_DOMAIN` / `_ACCESS_TOKEN` | — | Store domain & permanent access token |
| **Shopify** | `SHOPIFY_CLIENT_ID` / `_CLIENT_SECRET` | — | OAuth client credentials (auto token exchange) |
| **Shopify** | `SHOPIFY_WEBHOOK_SECRET` / `_API_VERSION` | `"2025-01"` | HMAC verification secret & API version |
| **YouCan** | `YOUCAN_ACCESS_TOKEN` / `_WEBHOOK_SECRET` | — | YouCan API token & webhook signing secret |
| **YouCan** | `YOUCAN_API_BASE_URL` | `"https://api.youcan.shop"` | YouCan REST API base URL |
| **WooCommerce** | `WOOCOMMERCE_SITE_URL` | — | WordPress site URL |
| **WooCommerce** | `WOOCOMMERCE_CONSUMER_KEY` / `_SECRET` | — | REST API v3 credentials (`ck_...`, `cs_...`) |
| **WooCommerce** | `WOOCOMMERCE_WEBHOOK_SECRET` | — | HMAC signing secret (`x-wc-webhook-signature`) |
| **GSheets** | `GSHEETS_SPREADSHEET_ID` / `_ACCESS_TOKEN`| — | Mode A Google Sheets API credentials |
| **GSheets** | `GSHEETS_APPS_SCRIPT_URL` / `_SECRET` | — | Mode B Apps Script Web App callback URL |
| **Tassyir** | `TASSYIR_API_KEY` / `_WEBHOOK_SECRET` | — | Tassyir COD ERP API key & signing secret |
| **Tassyir** | `TASSYIR_API_BASE_URL` | `"https://api.tassyir.dz/v1"` | Tassyir REST API base URL |

---

## Webhook & Simulation Endpoints

All store adapters register live ingestion and fixture simulation routes in `providerRegistry`:

| Provider | Live Ingestion Route | Local Fixture Simulation Route |
| :--- | :--- | :--- |
| **Shopify** | `POST /api/webhooks/shopify` | `POST /api/webhooks/shopify/simulate` |
| **YouCan** | `POST /api/webhooks/youcan` | `POST /api/webhooks/youcan/simulate` |
| **WooCommerce** | `POST /api/webhooks/woocommerce` | `POST /api/webhooks/woocommerce/simulate` |
| **Google Sheets** | `POST /api/webhooks/gsheets` | `POST /api/webhooks/gsheets/simulate` |
| **Tassyir ERP** | `POST /api/webhooks/tassyir` | `POST /api/webhooks/tassyir/simulate` |

---

## Live Webhook Testing with Cloudflare Tunnel

To test live webhooks from real stores without deploying to cloud:

```bash
cloudflared tunnel --url http://127.0.0.1:3001
```

Set your store webhook URL to `https://<tunnel-subdomain>.trycloudflare.com/api/webhooks/<provider>`.
