# Project Specification: Algerian E-Commerce Order Confirmation Voice Agent MVP

## 1. Overview & Core Objective
Build a complete, locally hosted Proof-of-Concept (PoC) web application in **TypeScript** that simulates an automated AI phone call for Algerian e-commerce Cash-on-Delivery (COD) order confirmation.

The system consists of:
1. **An Admin Dashboard (`/admin` on Desktop):** Triggers an outbound call with a specific order & store JSON payload, allows switching between Voice AI engines/models, displays real-time conversation transcripts, and displays the final structured JSON output returned when the call ends.
2. **A Mobile WebRTC/Audio Phone Receiver (`/phone` on Mobile Browser over Local Wi-Fi):** Stays on standby via WebSocket. When an order call is triggered from `/admin` (or via `POST /api/trigger-call`), the mobile screen rings like a real phone call. When the user taps "Answer", it establishes a bidirectional voice session with the selected AI Engine in **Algerian Darja (Arabic/French code-switching)**, processes order confirmation/refusal/modification within strict enum boundaries, executes a final tool call to output a strict JSON decision, and automatically hangs up.

---

## 2. Tech Stack & Local LAN Constraints
- **Runtime & Backend:** Node.js + TypeScript (Express or Fastify) + `ws` (WebSockets) for real-time signaling between `/admin`, `/phone`, and the backend voice pipelines.
- **Frontend:** Lightweight, fast setup (either Svelte + Vite or Vanilla TypeScript + Tailwind CSS served by Vite/Node) with two routes: `/admin` and `/phone`.
- **HTTPS Local LAN Requirement:** Mobile browsers block `navigator.mediaDevices.getUserMedia()` over insecure `http://192.168.x.x`. Configure Vite/Node with `@vitejs/plugin-basic-ssl` or automatic self-signed certificate generation so I can open `https://<LOCAL_IP>:3000/phone` on my phone over Wi-Fi and grant microphone permissions immediately.
- **Environment Variables (`.env.example`):**
- `ELEVENLABS_API_KEY=`
- `ELEVENLABS_AGENT_ID=`
- `GEMINI_API_KEY=`
- `OPENAI_API_KEY=`
- `PORT=3000`

---

## 3. Pluggable Voice Engine Architecture (Model Switcher)
Design a clean **Adapter/Strategy Pattern** so I can test and benchmark different voice models from the `/admin` UI dropdown before triggering a call:

### Mode A: ElevenAgents Managed WebRTC/WebSocket (`elevenagents`)
- Uses `@elevenlabs/client` (`Conversation.startSession`) on the `/phone` client (or proxied via backend signed URL).
- Dynamically injects the order context using `dynamicVariables` (`store_name`, `customer_name`, `item_name`, `current_size`, `current_wilaya`, `current_commune`, `price_da`, `allowed_sizes`, `allowed_communes`).
- Registers a client tool (`finalize_order_decision`) that captures the structured JSON parameters, sends them to the backend via WebSocket, speaks a closing remark, and terminates the call.

### Mode B: Gemini Live Native Audio (`gemini-live`)
- Streams raw PCM audio (16kHz in / 24kHz out) from the `/phone` browser microphone over WebSocket to the backend, which bridges to the **Google Gemini Multimodal Live API** (`gemini-2.5-flash` native audio).
- Injects the Algerian Darja system prompt and the dynamic `finalize_order_decision` function declaration with strict enum constraints based on the order payload.

### Mode C: Modular STT -> LLM -> TTS Pipeline (`modular-pipeline`)
- Allows selecting individual providers in the `/admin` UI:
- **STT:** ElevenLabs Scribe (`scribe_v1`) or OpenAI Whisper / GPT-4o-transcribe.
- **LLM:** Gemini 2.5 Flash or OpenAI GPT-4o-mini (with structured tool calling).
- **TTS:** ElevenLabs Streaming TTS (`eleven_flash_v2_5` or `eleven_multilingual_v2`).
- Uses browser-side or server-side Voice Activity Detection (VAD) to detect end-of-speech, sends audio buffer to STT, passes transcript to LLM with conversation history, streams LLM text response to ElevenLabs TTS, and plays audio back on `/phone`.

---

## 4. Data Contracts & Anti-Hallucination Guardrails

### A. Input Payload (`POST /api/trigger-call`)
Pre-populate the `/admin` UI with an editable JSON editor containing this default test payload:
```json
{
"order_id": "DZ-1049",
"store_name": "Atlas Streetwear",
"customer_name": "Abderrahman",
"customer_phone": "0550123456",
"item_name": "Oversized Hoodie Black",
"price_da": 4500,
"current_size": "M",
"current_wilaya": "13 - Tlemcen",
"current_commune": "Mansourah",
"current_address_note": "Cite Imama",
"constraints": {
"allowed_sizes": ["S", "M", "L", "XL"],
"allowed_wilayas": ["13 - Tlemcen", "16 - Alger", "31 - Oran"],
"allowed_communes": ["Mansourah", "Chetouane", "Tlemcen", "Beni Mester", "Remchi"]
}
}

```

### B. Dynamic Tool Schema (`finalize_order_decision`)

To prevent hallucinations, dynamically construct the tool's JSON Schema per call using the `constraints` array from the input payload:

```json
{
"name": "finalize_order_decision",
"description": "Call this tool ONLY after the customer explicitly confirms the order, refuses/cancels it, or confirms their requested modifications to size or address.",
"parameters": {
"type": "object",
"properties": {
"order_id": { "type": "string" },
"status": {
"type": "string",
"enum": ["CONFIRMED", "REFUSED", "MODIFIED"]
},
"final_size": {
"type": "string",
"enum": ["<DYNAMICALLY_INJECT_ALLOWED_SIZES>"]
},
"final_wilaya": {
"type": "string",
"enum": ["<DYNAMICALLY_INJECT_ALLOWED_WILAYAS>"]
},
"final_commune": {
"type": "string",
"enum": ["<DYNAMICALLY_INJECT_ALLOWED_COMMUNES>"]
},
"final_address_note": {
"type": "string",
"description": "Updated street, neighborhood, or delivery note if modified, otherwise original."
},
"modification_fields": {
"type": "array",
"items": {
"type": "string",
"enum": ["size", "wilaya", "commune", "address_note"]
}
},
"reason_or_notes": {
"type": "string",
"description": "Brief summary in English/French of what the customer decided."
}
},
"required": [
"order_id",
"status",
"final_size",
"final_wilaya",
"final_commune",
"final_address_note",
"modification_fields",
"reason_or_notes"
]
}
}

```

## 5. System Prompt & Algerian Darja Persona

Create a dedicated prompt builder (`src/prompts/darjaOrderPrompt.ts`) that injects the order data and enforces these strict behavioral rules:

1. **Language & Tone:** Speak natural, polite, concise Algerian Darja (mixing Arabic script with natural French loanwords like *la commande, la taille, la livraison, l'adresse* as spoken in Algeria). Keep sentences short (1-2 sentences per turn) suitable for a phone call.
2. **Greeting & Verification:** Start immediately when the call connects: *"Salam khouya/khti {{customer_name}}, m3ak service confirmation ta3 {{store_name}}. 3andek commande ta3 {{item_name}}, la taille {{current_size}}, l'adresse {{current_commune}} f {{current_wilaya}} ({{current_address_note}}), b {{price_da}} dinar. Hada houwa, n'confirmiw?"*
3. **Strict Modification Boundaries:**
- The customer can ONLY: a) Confirm the order as-is (`CONFIRMED`). b) Cancel/refuse the order (`REFUSED`). c) Change the **size** (must be within `allowed_sizes`) or **address** (`allowed_wilayas`, `allowed_communes`, or `address_note`) (`MODIFIED`).
- If the customer asks for a size not in `allowed_sizes`, inform them in Darja that it is out of stock and list only the available sizes.
- If the customer asks to change the price, negotiate discounts, or swap to a completely different product, politely decline (*"Smahli khouya, n9der nbeddel ghir la taille wela l'adresse, السومة fixe"*).
4. **Confirmation Before Tool Execution:** Whenever the customer modifies the size or address, repeat the new detail back to them once for confirmation, then call `finalize_order_decision` and say a brief polite goodbye (*"C'est bon rani sejjelt, baraka Allahu fik w nharek mabrouk"*).

## 6. UI/UX Specifications

### Screen 1: `/admin` (Desktop Control Center)

- **Left Panel:**
- Engine/Model Selector Dropdown (`ElevenAgents SDK`, `Gemini 2.5 Live Native Audio`, `Modular: Scribe + Gemini + ElevenLabs TTS`, etc.) with sub-selectors for Voice ID and TTS model (`eleven_flash_v2_5` vs `eleven_multilingual_v2`).
- Editable JSON payload box for the Order & Store details.
- Connection status badge showing whether a mobile `/phone` client is currently online and listening on the LAN.
- **"Trigger Outbound Call"** button + **"Force Hangup"** button.
- **Right Panel:**
- Live Real-Time Transcript feed (User vs. Agent turns with latency timestamps in ms).
- **Final JSON Output Card:** Highlights in green (`CONFIRMED`), yellow (`MODIFIED`), or red (`REFUSED`) the exact JSON payload emitted by `finalize_order_decision` when the call finishes, with a visual diff showing which fields changed from the original order.

### Screen 2: `/phone` (Mobile Call Simulator)

- Designed specifically for a vertical mobile viewport (dark mode, native smartphone dialer aesthetic).
- **State 1 - Standby:** Shows `"Connected to LAN Server - Waiting for incoming order call..."` plus an "Enable Audio/Mic Permissions" warmup button so iOS/Android autoplay and mic permissions are unlocked ahead of time.
- **State 2 - Ringing:** Triggered when `/admin` initiates a call. Plays a looping ringtone via Web Audio API, vibrates (`navigator.vibrate`), displays the incoming caller name (`{{store_name}} Confirmation`), and presents green **Answer** and red **Decline** buttons.
- **State 3 - Active Call:** Shows call duration timer, an animated audio waveform visualizer responding to the AI's voice and the user's mic, a Mute button, and a red Hangup button.
- **State 4 - Call Ended:** Automatically transitions here 2 seconds after `finalize_order_decision` executes, displaying a summary badge (`Order Confirmed / Modified / Refused`) before returning to Standby.

## 7. Implementation Deliverables

1. Scaffold the entire project with clean folder structure (`server/`, `client/`, `shared/types.ts`).
2. Implement all WebSocket events (`CALL_RINGING`, `CALL_ANSWERED`, `AUDIO_CHUNK`, `TRANSCRIPT_UPDATE`, `ORDER_FINALIZED`, `CALL_ENDED`).
3. Implement the ElevenAgents integration and Modular/Gemini Live adapters with clear comments showing where to plug API keys.
4. Provide exact startup commands in `README.md` showing how to start the HTTPS LAN server and open both `/admin` on PC and `/phone` on mobile over Wi-Fi.

