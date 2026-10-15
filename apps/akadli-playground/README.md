# Akadli-Playground: Local Voice & Webhook Sandbox

> [!IMPORTANT]
> **Optional Local Testing Sandbox Only**: `akadli-playground` is a local development and evaluation testbed. It is **not** required for production server deployments, which consume the core library packages in `packages/*` (`@akadli/core`, `@akadli/dz-geo`, `@akadli/adapter-contract`, and `@akadli/provider-*`).

---

## What is Akadli-Playground?

`akadli-playground` provides an end-to-end local simulation environment for pairing developers and contributors to test:
- Inbound mock Algerian COD orders from e-commerce providers.
- Real-time **ElevenLabs Conversational AI (ElevenAgents)** voice synthesis and speech-to-speech WebRTC streaming in authentic **Algerian Darja (عربية دارجة + French code-switching)**.
- Anti-hallucination validation against the **2026 Algerian Administrative Division (69 Wilayas, 1,708 Communes)**.
- Real-time client & server tool invocations (`finalize_order_decision` and `validate_delivery_location`).
- Visual inspection of the resulting canonical [`FinalizedOrderDecision`](file:///home/har/Documents/Programming/Akadli-AI/packages/adapter-contract/src/index.ts#L80) JSON (`CONFIRMED`, `REFUSED`, or `MODIFIED`).

---

## Sandbox Architecture

```text
apps/akadli-playground/
├── client/                     # Vite + Vanilla TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── audio/              # Web Audio Ringtone & visualizer
│   │   ├── pages/
│   │   │   ├── AdminPage.ts    # Desktop Control Center (/admin) with 69-wilaya cascade selector
│   │   │   └── PhonePage.ts    # Mobile Phone Call Simulator (/phone) with OLED dark UI & WebRTC
│   │   ├── ui/
│   │   │   └── icons.ts        # Accessible inline SVG icon system
│   │   └── main.ts             # Route Switcher (/admin vs /phone)
│   └── vite.config.ts          # Basic-SSL plugin for Wi-Fi HTTPS
│
├── server/                     # Node.js + Express + WebSocket Signaling Server
│   ├── src/
│   │   ├── config.ts           # Environment variables & LAN IP resolution
│   │   ├── index.ts            # REST endpoints, WS Hub, and call lifecycle
│   │   └── engines/
│   │       ├── VoiceEngineAdapter.ts      # Shared Engine Interface
│   │       └── ElevenAgentsAdapter.ts     # ElevenLabs Conversational WebRTC Adapter
│   └── tsconfig.json
│
├── shared/
│   ├── algeria2026.ts          # 2026 Wilaya/Commune validation helpers
│   ├── algeria2026Data.ts      # 69 Wilayas & 1,708 Communes inlined dataset
│   └── types.ts                # WebSocket protocol and simulator state
├── .env.example                # API credentials template
├── .env                        # Local untracked credentials (ignored by git)
└── package.json                # Workspace package "@akadli/playground"
```

---

## Step-by-Step Contributor Guide

### 1. Configure Environment Credentials

From the repository root (or within `apps/akadli-playground`):
```bash
cp apps/akadli-playground/.env.example apps/akadli-playground/.env
```

Open `apps/akadli-playground/.env` and insert your ElevenLabs API credentials:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
PORT=3000
SERVER_PORT=3001
```

### 2. Start the Sandbox Server

From the repository root:
```bash
pnpm --filter @akadli/playground dev
```

Or from inside `apps/akadli-playground`:
```bash
pnpm dev
```

The terminal will log your local and Wi-Fi LAN IP addresses:
```text
=======================================================
Akadli-Playground Sandbox Server Running!
Local LAN IP:    192.168.1.50
Backend API/WS:  http://192.168.1.50:3001
Admin Dashboard: https://192.168.1.50:3000/admin
Mobile Receiver: https://192.168.1.50:3000/phone
=======================================================
```

---

## Testing Outbound Confirmation Calls

Mobile browsers require **HTTPS** (or `localhost`) to grant microphone permissions for WebRTC audio streaming. `akadli-playground` automatically generates self-signed SSL certificates via `@vitejs/plugin-basic-ssl` so you can connect your actual mobile smartphone over Wi-Fi!

### Screen 1: Desktop Admin Control Center (`/admin`)
1. Open `https://localhost:3000/admin` on your desktop browser.
2. Accept the self-signed SSL warning (click *Advanced* -> *Proceed to localhost*).
3. Use the order configuration card to set customer details:
   - Select Wilaya (`01` to `69`) and target Commune (`1,708` total).
   - Set product title, size, and price in DZD (e.g. `4,500 DA`).
   - Define allowed size and wilaya constraints.

### Screen 2: Mobile Smartphone Receiver (`/phone`)
1. Connect your smartphone to the **same Wi-Fi network** as your PC.
2. Open `https://<YOUR-LAN-IP>:3000/phone` on your mobile browser (e.g., Safari or Chrome).
3. Accept the self-signed certificate warning on your phone.
4. The receiver will connect to the local WebSocket hub and display `Standby (Connected)`.

### Screen 3: Trigger Call & Verify Decision
1. Click **"Trigger Confirmation Call"** on your desktop `/admin` dashboard.
2. Your phone will instantly ring with an authentic ringtone and vibration!
3. Tap **Answer**: Speak in Algerian Darja or French with the AI agent:
   - Confirm order: *"Oui, n'akdi la commande"* (Agent triggers `finalize_order_decision` with status `CONFIRMED`).
   - Modify size/address: *"Badelha taille L w b3athha l Bou Saada"* (Agent validates `Bou Saada` in Wilaya `68`, triggers `MODIFIED`).
   - Refuse: *"Batalat, ma bghitch"* (Agent logs cancellation reason, triggers `REFUSED`).
4. Watch the real-time transcript stream on your desktop `/admin` screen and view the formatted `FinalizedOrderDecision` payload upon hangup.
