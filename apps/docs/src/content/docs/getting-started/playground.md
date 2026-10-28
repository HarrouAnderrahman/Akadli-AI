---
title: Playground
description: Testing live WebRTC Darja phone calls over LAN Wi-Fi and real store webhooks with Cloudflare Tunnel.
---

`@akadli/playground` is an end-to-end interactive sandbox located in `apps/akadli-playground`. It enables you to simulate customer phone calls, test WebRTC bidirectional voice streaming in Algerian Darja, and test store webhook ingestions locally without deploying cloud servers.

## Key Features

- **Desktop Admin Console (`/admin`):** Load test order fixtures for all providers, dispatch simulated orders, inspect payloads, and monitor real-time conversation transcripts.
- **Mobile Phone Simulator (`/phone`):** Open this URL on your smartphone over the same local Wi-Fi. It simulates an incoming phone call complete with ringtone, answer/reject buttons, and low-latency audio via LiveKit WebRTC.
- **Provider Registry Integration:** Ingest live store webhooks or simulated payloads for Shopify, YouCan, WooCommerce, Google Sheets, and Tassyir ERP.
- **Call Transcript (STT) & MP3 Audio Archiving (`/api/logs`):** When `SAVE_CALL_LOGS=true` (default), completed calls are automatically archived into `CALL_LOGS_DIR` (`./logs/calls`) as `.json` STT transcripts and `.mp3` audio recordings via `@akadli/core`, with inline `<audio controls>` playback and JSON download in `/admin`.

---

## 1. Quick Start

Clone the repository and launch the playground:

```bash
# 1. Clone & install dependencies
git clone https://github.com/HarrouAnderrahman/Akadli-AI.git
cd Akadli-AI
pnpm install
pnpm build

# 2. Configure environment credentials
cp apps/akadli-playground/.env.example apps/akadli-playground/.env
# Edit apps/akadli-playground/.env to add your ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID

# 3. Start development server
pnpm --filter @akadli/playground dev
```

The playground boots on:
- Frontend Client: `https://localhost:3000`
- Backend API Server: `https://localhost:3001` (or HTTP `http://localhost:3001`)

---

## 2. Testing Over LAN Wi-Fi on Your Smartphone

1. Find your machine's local IP address:
   ```bash
   # On Linux/macOS:
   ip -br a || ifconfig
   ```
2. On your smartphone (connected to the same Wi-Fi router), open:
   ```text
   https://<YOUR-LAN-IP>:3000/phone
   ```
3. Accept the self-signed SSL certificate warning in your mobile browser.
4. On your desktop browser, navigate to `https://localhost:3000/admin`.
5. Select a provider fixture (e.g. `Shopify Sneaker Order`), enter your phone number, and click **Simulate Order & Call**.
6. Your smartphone will ring! Tap **Answer** to start speaking in Algerian Darja with the AI agent.

---

## 3. Testing Real Store Webhooks via Cloudflare Tunnel

To receive real webhooks from a live Shopify, YouCan, or WooCommerce store without deploying a public server:

1. Install and start `cloudflared`:
   ```bash
   cloudflared tunnel --url http://127.0.0.1:3001
   ```
2. Copy the generated public URL (e.g. `https://random-subdomain.trycloudflare.com`).
3. Set your store webhook URL to:
   - **Shopify:** `https://<tunnel>/api/webhooks/shopify`
   - **YouCan:** `https://<tunnel>/api/webhooks/youcan`
   - **WooCommerce:** `https://<tunnel>/api/webhooks/woocommerce`
   - **Google Sheets:** `https://<tunnel>/api/webhooks/gsheets`
   - **Tassyir ERP:** `https://<tunnel>/api/webhooks/tassyir`
4. Place a test checkout in your store. The playground will automatically intercept the webhook, normalize the 2026 Wilaya address, and launch the voice confirmation workflow!
