# Akadli-AI (أكدلي) 🇩🇿

**Akadli-AI** is an autonomous, conversational AI voice confirmation engine specifically engineered for Algerian Cash-on-Delivery (COD) e-commerce. It automates high-churn, call-center outbound confirmation calls using ElevenLabs Conversational AI (ElevenAgents) in Algerian Darja, French, and Modern Standard Arabic.

---

## 🏛️ Architecture & Monorepo Structure

Built as a high-performance **Turborepo + pnpm** monorepo designed for deterministic multi-provider integrations:

```text
akadli-ai/
├── apps/
│   └── akadli-playground/           # Local WebRTC testing harness (/admin and /phone mobile receiver)
├── packages/
│   ├── adapter-contract/             # Canonical Zod schemas & TypeScript interfaces (Zero external dependencies)
│   ├── dz-geo/                       # 69 Wilayas (2026), 1,708 Communes & +213 phone normalizer
│   ├── core/                         # ElevenAgents dynamic prompt variable builder & tool handler
│   └── provider-<name>/              # Pluggable store & ERP adapters (Phase 2: YouCan, Shopify, Tassyir, etc.)
├── .agents/skills/                   # Local workspace automation skills for pairing agents
└── package.json                      # Workspace scripts & tooling
```

---

## 📦 Packages Overview

### 1. `@dz-voice/adapter-contract`
- Strict zero-dependency contract library defining:
  - `StandardizedDzOrder`: Universal normalized order format (`orderId`, `customerPhone`, `currentWilaya`, `constraints`).
  - `FinalizedOrderDecision`: Strict schema for ElevenAgents `finalize_order_decision` tool calls (`CONFIRMED`, `REFUSED`, `MODIFIED`).
  - `IEcommerceProvider`: Standard interface with `verifyWebhook`, `parseWebhookOrder`, and `applyOrderDecision`.
  - `WilayaCodeSchema`: Validates zero-padded 2-digit codes (`"01"` to `"69"`).

### 2. `@dz-voice/dz-geo`
- Comprehensive 2026 Algerian administrative division dataset:
  - **69 Wilayas** (`"01"` to `"69"`) including the 11 delegated Wilayas (*Aflou, Barika, Bou Saada, El Abiodh Sidi Cheikh, etc.*).
  - **1,708 Communes** with cross-script Arabic to French mappings.
  - **`WILAYAS_58`**: Backward-compatibility slice for legacy couriers (Yalidine, Ecotrack, ZR Express) or older store database enums.
  - **4-Stage Wilaya Normalizer**: Numeric extraction -> Script canonicalization -> Alias & Arabizi dictionary -> Levenshtein fuzzy match.
  - **Algerian Phone Normalizer**: Normalizes any input format into local `05/06/07XXXXXXXX` or international E.164 `+213[567]XXXXXXXX`.

### 3. `@dz-voice/core`
- **Dynamic Variable Injection**: Constructs `dynamicVariables` for ElevenAgents (`allowed_sizes_enum`, `allowed_wilayas_enum`, `allowed_communes_enum`, `price_da`) to prevent hallucinations.
- **Server Tool Handler**: Processes `finalize_order_decision` tool invocations, normalizes any customer modifications, validates them against constraints, and dispatches to the store provider.

### 4. `apps/akadli-playground`
- Full-fidelity local WebRTC simulator for development (sandbox testbed):
  - `/admin`: Control dashboard to load sample orders, configure agent credentials, and trigger calls.
  - `/phone`: Simulated mobile phone receiver connecting to ElevenLabs Conversational WebRTC with custom ringtone and Darja audio playback.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation
```bash
pnpm install
```

### Build & Typecheck
```bash
# Build all packages
pnpm build

# Typecheck all packages
pnpm typecheck
```

### Run Tests
```bash
# Run all Vitest suites across packages
pnpm test
```

### Launch Voice Simulator
```bash
cd apps/akadli-playground
cp .env.example .env # Add your ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID
pnpm dev
```
- Open `https://localhost:3000/admin` for the Admin Dashboard.
- Open `https://localhost:3000/phone` for the Mobile Phone Receiver.

---

## 🛡️ License
Private & Proprietary - Akadli-AI.
