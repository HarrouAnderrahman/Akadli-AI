# 🇩🇿 Algerian E-Commerce Order Confirmation Voice Agent MVP

A high-performance, lightweight Proof-of-Concept (PoC) web application in **TypeScript** simulating an automated AI phone call for Algerian e-commerce Cash-on-Delivery (COD) order confirmation in authentic **Algerian Darja (عربية دارجة + French code-switching)**.

Powered by **ElevenLabs Conversational AI** (Mode A with native V4 Turbo TTS) and fortified with the **official 2026 Algerian administrative division dataset (69 Wilayas, 1,708 Communes)** for real-time, zero-latency location validation.

---

## 🎯 Architecture & Components

```
├── client/                     # Vite + Vanilla TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── audio/              # Web Audio Ringtone & visualizer
│   │   ├── pages/
│   │   │   ├── AdminPage.ts    # Desktop Control Center (/admin) with 69-wilaya cascade selector
│   │   │   └── PhonePage.ts    # Mobile Phone Call Simulator (/phone) with OLED dark UI & client tools
│   │   ├── ui/
│   │   │   └── icons.ts        # Accessible inline SVG icon system
│   │   └── main.ts             # Route Switcher
│   └── vite.config.ts          # Configured with @vitejs/plugin-basic-ssl for LAN HTTPS
│
├── server/                     # Node.js + Express + WebSocket Signaling Server
│   ├── src/
│   │   ├── config.ts           # Environment variables & LAN IP resolution
│   │   ├── index.ts            # REST endpoints, WS Hub, and call lifecycle
│   │   └── engines/
│   │       ├── VoiceEngineAdapter.ts      # Shared Interface
│   │       └── ElevenAgentsAdapter.ts     # ElevenLabs Conversational AI Adapter
│   └── tsconfig.json
│
├── shared/
│   ├── algeria2026.ts          # Anti-hallucination validation, normalization & search
│   ├── algeria2026Data.ts      # Official 2026 69 Wilayas & 1,708 Communes dataset
│   └── types.ts                # Shared TypeScript contracts & WebSocket events
├── .env.example                # API credentials template
└── package.json                # Root workspace configuration
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your ElevenLabs credentials:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
PORT=3000
SERVER_PORT=3001
```

---

## 📱 Running over Local LAN / Wi-Fi (HTTPS)

Mobile browsers strictly require **HTTPS** (or `localhost`) to grant microphone permissions. This project integrates `@vitejs/plugin-basic-ssl` to automatically generate self-signed certificates over your local Wi-Fi IP.

### Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

The terminal will display your exact LAN IP address:
```
  ➜  Local:   https://localhost:3000/
  ➜  Network: https://192.168.1.50:3000/
```

### Opening the Two Screens:
1. **Desktop Admin Control Center:**  
   Open `https://localhost:3000/admin` on your PC.
2. **Mobile Smartphone Receiver:**  
   Open `https://<YOUR-LAN-IP>:3000/phone` on your smartphone connected to the same Wi-Fi.

---

## 🇩🇿 2026 Algerian Administrative Divisions (Anti-Hallucination)

- Integrated dataset based on [algeria-wilayas-communes-2026](https://github.com/Kenandarabeh/algeria-wilayas-communes-2026).
- **69 Wilayas** (including newly promoted wilayas like Aflou, Barika, El Kantara, Bir El Ater, El Aricha, Ksar Chellala, Ain Oussera, Messad, Ksar El Boukhari, Bou Saada, El Abiodh Sidi Cheikh).
- **1,708 Communes** linked to their respective wilaya IDs.
- **Client Tool (`validate_delivery_location`):** ElevenLabs Conversational AI can call this tool during the call to verify if any commune/wilaya mentioned by the customer actually exists in Algeria.
- **Order Decision Contract (`finalize_order_decision`):** Verifies the finalized delivery address against official 2026 records.
