import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShopifyProvider } from '@akadli/provider-shopify';
import { normalizeWilaya, normalizeCommune } from '@akadli/dz-geo';
import { config, getLocalIpAddress } from './config.js';
import {
  CallState,
  FinalizeOrderDecision,
  OrderPayload,
  TranscriptTurn,
  VoiceConfig,
  WSMessage,
  StandardizedFinalizedOrderDecision,
  WilayaCode,
  ShopifyMutationData,
  standardizedDzOrderToOrderPayload,
} from '../../shared/types.js';
import { VoiceEngineAdapter } from './engines/VoiceEngineAdapter.js';
import { ElevenAgentsAdapter } from './engines/ElevenAgentsAdapter.js';
import {
  getAllWilayas,
  getCommunesByWilayaId,
  validateLocation,
} from '../../shared/algeria2026.js';

const app = express();
app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getShopifyFixture(filename: string): string {
  const candidatePaths = [
    path.resolve(__dirname, '../../../../packages/provider-shopify/fixtures', filename),
    path.resolve(__dirname, '../../../../../packages/provider-shopify/fixtures', filename),
    path.resolve(process.cwd(), 'packages/provider-shopify/fixtures', filename),
    path.resolve(process.cwd(), '../../packages/provider-shopify/fixtures', filename),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  throw new Error(`Shopify fixture "${filename}" not found in candidate paths.`);
}

const shopifyProvider = new ShopifyProvider();

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Global State
let adminSockets = new Set<WebSocket>();
let phoneSocket: WebSocket | null = null;
let currentCallState: CallState = 'standby';
let currentOrder: OrderPayload | null = null;
let currentConfig: VoiceConfig | null = null;
let activeAdapter: VoiceEngineAdapter | null = null;
let isInitiatingSession = false;

// Helper to broadcast WS messages
function broadcastToAdmins(msg: WSMessage) {
  const data = JSON.stringify({ ...msg, timestamp: Date.now() });
  for (const client of adminSockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function sendToPhone(msg: WSMessage) {
  if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
    phoneSocket.send(JSON.stringify({ ...msg, timestamp: Date.now() }));
  }
}

function broadcastPhoneStatus() {
  const isOnline = phoneSocket !== null && phoneSocket.readyState === WebSocket.OPEN;
  const statusMsg: WSMessage = {
    type: 'PHONE_STATUS',
    data: {
      online: isOnline,
      callState: currentCallState,
      lastSeen: Date.now(),
    },
  };
  broadcastToAdmins(statusMsg);
}

function setCallState(newState: CallState) {
  currentCallState = newState;
  broadcastPhoneStatus();
}

// REST Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    localIp: getLocalIpAddress(),
    serverPort: config.serverPort,
    clientPort: config.port,
    phoneConnected: phoneSocket !== null && phoneSocket.readyState === WebSocket.OPEN,
    callState: currentCallState,
    defaultAgentId: config.elevenLabsAgentId,
    shopifyConfigured: Boolean(config.shopifyShopDomain && config.shopifyAccessToken),
    shopifyDomain: config.shopifyShopDomain || null,
    shopifyApiVersion: config.shopifyApiVersion,
  });
});

app.get('/api/lan-ip', (req, res) => {
  const ip = getLocalIpAddress();
  res.json({
    localIp: ip,
    adminUrl: `https://${ip}:${config.port}/admin`,
    phoneUrl: `https://${ip}:${config.port}/phone`,
  });
});

// Real Shopify Webhook Ingress (orders/create)
app.post('/api/webhooks/shopify', async (req, res) => {
  try {
    const rawBody: Buffer | string = (req as any).rawBody || JSON.stringify(req.body);
    const headers = req.headers as Record<string, string>;

    // 1. Cryptographically verify HMAC-SHA256 signature if secret is configured
    if (config.shopifyWebhookSecret) {
      const isValid = await shopifyProvider.verifyWebhook(
        headers,
        rawBody,
        config.shopifyWebhookSecret
      );
      if (!isValid) {
        console.warn('[Shopify Webhook] Rejected request: Invalid HMAC-SHA256 signature.');
        return res.status(401).json({
          error: 'Invalid Shopify HMAC-SHA256 signature',
        });
      }
    } else {
      console.log(
        '[Shopify Webhook] SHOPIFY_WEBHOOK_SECRET not set in .env; skipping HMAC check for testing.'
      );
    }

    // 2. Parse payload into canonical StandardizedDzOrder
    const standardizedOrder = await shopifyProvider.parseWebhookOrder(req.body);
    console.log(
      `[Shopify Webhook] Ingested live order #${standardizedOrder.orderId} for customer "${standardizedOrder.customerName}" (${standardizedOrder.currentWilaya} - ${standardizedOrder.currentCommune})`
    );

    const orderPayload = standardizedDzOrderToOrderPayload(standardizedOrder, 'shopify');
    orderPayload.raw_order = req.body;

    // 3. Broadcast webhook receipt to admin dashboard
    broadcastToAdmins({
      type: 'SHOPIFY_WEBHOOK_RECEIVED',
      data: {
        order: orderPayload,
        standardizedOrder,
        rawOrder: req.body,
      },
    });

    // 4. Trigger incoming call on connected phone receiver
    if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
      initiateCall(orderPayload);
      res.json({
        success: true,
        orderId: standardizedOrder.orderId,
        ringing: true,
        message: 'Shopify order ingested and mobile receiver is ringing',
      });
    } else {
      currentOrder = orderPayload;
      res.json({
        success: true,
        orderId: standardizedOrder.orderId,
        ringing: false,
        warning: 'Shopify order ingested into state, but no mobile phone client is connected',
      });
    }
  } catch (err: any) {
    console.error('[Shopify Webhook Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to process Shopify webhook' });
  }
});

// Local Fixture Simulation Endpoint
app.post('/api/webhooks/shopify/simulate', async (req, res) => {
  try {
    const fixtureType =
      req.body?.fixture === 'cod-form'
        ? 'webhook-order-cod-form.json'
        : 'webhook-order-created.json';
    const rawFixtureBody = getShopifyFixture(fixtureType);
    const parsedPayload = JSON.parse(rawFixtureBody);

    const secret = config.shopifyWebhookSecret || 'simulated_secret_key';
    const computedHmac = createHmac('sha256', secret)
      .update(Buffer.from(rawFixtureBody, 'utf8'))
      .digest('base64');

    const headers: Record<string, string> = {
      'x-shopify-hmac-sha256': computedHmac,
      'x-shopify-topic': 'orders/create',
      'x-shopify-shop-domain': config.shopifyShopDomain || 'dz-fashion.myshopify.com',
      'content-type': 'application/json',
    };

    // Verify signature through provider
    const isSignatureValid = await shopifyProvider.verifyWebhook(
      headers,
      rawFixtureBody,
      secret
    );

    // Parse into canonical order
    const standardizedOrder = await shopifyProvider.parseWebhookOrder(parsedPayload);
    const orderPayload = standardizedDzOrderToOrderPayload(standardizedOrder, 'shopify');
    orderPayload.raw_order = parsedPayload;

    console.log(
      `[Shopify Simulate] Simulated webhook for order #${standardizedOrder.orderId} (signature valid: ${isSignatureValid})`
    );

    broadcastToAdmins({
      type: 'SHOPIFY_WEBHOOK_RECEIVED',
      data: {
        order: orderPayload,
        standardizedOrder,
        rawOrder: parsedPayload,
        simulated: true,
        fixture: fixtureType,
      },
    });

    if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
      initiateCall(orderPayload);
      res.json({
        success: true,
        orderId: standardizedOrder.orderId,
        ringing: true,
        order: orderPayload,
        signatureValid: isSignatureValid,
      });
    } else {
      currentOrder = orderPayload;
      res.json({
        success: true,
        orderId: standardizedOrder.orderId,
        ringing: false,
        warning: 'Shopify order simulated and loaded, but phone client is offline',
        order: orderPayload,
        signatureValid: isSignatureValid,
      });
    }
  } catch (err: any) {
    console.error('[Shopify Simulate Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trigger-call', (req, res) => {
  const { payload, config: vConfig } = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Missing order payload' });
  }

  if (!phoneSocket || phoneSocket.readyState !== WebSocket.OPEN) {
    return res.status(409).json({
      error: 'No mobile phone receiver is currently connected to the LAN server.',
    });
  }

  initiateCall(payload, vConfig);
  res.json({ success: true, message: 'Call initiated' });
});

app.post('/api/hangup', async (req, res) => {
  await terminateCall('Force hangup by Admin');
  res.json({ success: true });
});

app.get('/api/elevenlabs/signed-url', async (req, res) => {
  if (!config.elevenLabsApiKey || !config.elevenLabsAgentId) {
    return res.status(400).json({ error: 'ElevenLabs credentials not configured' });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${config.elevenLabsAgentId}`,
      {
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
        },
      }
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to get signed url' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Algeria 2026 Administrative Locations API (69 Wilayas & 1,708 Communes)
app.get('/api/locations/wilayas', (req, res) => {
  res.json(getAllWilayas());
});

app.get('/api/locations/communes', (req, res) => {
  const wilayaId = req.query.wilaya_id as string;
  if (!wilayaId) {
    return res.status(400).json({ error: 'Missing wilaya_id query parameter' });
  }
  res.json(getCommunesByWilayaId(wilayaId));
});

app.get('/api/locations/validate', (req, res) => {
  const commune = req.query.commune as string;
  const wilaya = req.query.wilaya as string | undefined;
  if (!commune) {
    return res.status(400).json({ error: 'Missing commune parameter' });
  }
  res.json(validateLocation(commune, wilaya));
});

// Call Lifecycle Management
function initiateCall(payload: OrderPayload, vConfig?: VoiceConfig) {
  currentOrder = payload;
  currentConfig = vConfig || {
    engine: 'elevenagents',
    useAgentDefaults: true,
  };

  setCallState('ringing');

  const ringingMsg: WSMessage = {
    type: 'CALL_RINGING',
    data: {
      payload: currentOrder,
      config: currentConfig,
    },
  };

  sendToPhone(ringingMsg);
  broadcastToAdmins(ringingMsg);
}

async function handleCallAnswered() {
  if (!currentOrder || !currentConfig) return;

  // Prevent multiple instances if user presses answer repeatedly or session is already initiating
  if (currentCallState !== 'ringing' || isInitiatingSession) {
    console.warn(
      `[Server] Call is not in ringing state (${currentCallState}) or session is already initiating (${isInitiatingSession}), ignoring duplicate ANSWER_CALL.`
    );
    return;
  }

  isInitiatingSession = true;
  setCallState('active');

  // Terminate any previous adapter instance if still around
  if (activeAdapter) {
    try {
      await activeAdapter.endSession();
    } catch (e) {}
    activeAdapter = null;
  }

  // Pure Mode A: ElevenAgents Conversational AI
  activeAdapter = new ElevenAgentsAdapter();

  try {
    const sessionResult = await activeAdapter.initiateSession(
      currentOrder,
      currentConfig,
      {
        onTranscript: (turn: TranscriptTurn) => {
          const msg: WSMessage = { type: 'TRANSCRIPT_UPDATE', data: { turn } };
          broadcastToAdmins(msg);
          sendToPhone(msg);
        },
        onAudioOutput: (audioData, sampleRate, format) => {
          const base64 =
            typeof audioData === 'string'
              ? audioData
              : audioData.toString('base64');
          sendToPhone({
            type: 'AUDIO_CHUNK',
            data: { audio: base64, sampleRate, format },
          });
        },
        onOrderFinalized: (decision: FinalizeOrderDecision) => {
          handleOrderFinalized(decision);
        },
        onError: (error: Error) => {
          console.error('[Engine Error]:', error);
          broadcastToAdmins({ type: 'ERROR', data: { message: error.message } });
        },
        onCallEnd: (reason?: string) => {
          terminateCall(reason);
        },
      }
    );

    const answeredMsg: WSMessage = {
      type: 'CALL_ANSWERED',
      data: {
        payload: currentOrder,
        config: currentConfig,
        sessionInfo: sessionResult,
      },
    };

    sendToPhone(answeredMsg);
    broadcastToAdmins(answeredMsg);
  } catch (err: any) {
    console.error('[Server] Failed to initiate voice session:', err);
    broadcastToAdmins({
      type: 'ERROR',
      data: { message: `Session initiation failed: ${err.message}` },
    });
    terminateCall('Initialization error');
  } finally {
    isInitiatingSession = false;
  }
}

async function handleOrderFinalized(decision: FinalizeOrderDecision) {
  setCallState('finalizing');

  const finalizedMsg: WSMessage = {
    type: 'ORDER_FINALIZED',
    data: {
      decision,
      originalOrder: currentOrder,
    },
  };

  broadcastToAdmins(finalizedMsg);
  sendToPhone(finalizedMsg);

  // Normalize final wilaya and commune via @akadli/dz-geo
  let finalWilayaCode: WilayaCode | undefined = undefined;
  let finalCommuneClean: string | undefined = undefined;

  if (decision.final_wilaya) {
    try {
      const normW = normalizeWilaya(decision.final_wilaya);
      finalWilayaCode = normW.code as WilayaCode;
      if (decision.final_commune) {
        const normC = normalizeCommune(decision.final_commune, normW.code);
        finalCommuneClean = normC.canonicalCommune;
      }
    } catch {
      finalWilayaCode = decision.final_wilaya as WilayaCode;
      finalCommuneClean = decision.final_commune;
    }
  }

  const standardizedDecision: StandardizedFinalizedOrderDecision = {
    orderId: currentOrder?.order_id || decision.order_id,
    status: decision.status,
    finalSize: decision.final_size || undefined,
    finalWilaya: finalWilayaCode,
    finalCommune: finalCommuneClean || decision.final_commune || undefined,
    finalAddressNote: decision.final_address_note || undefined,
    reasonOrNotes: decision.reason_or_notes || '',
  };

  // Live Outbound Shopify Admin API Mutation
  const isShopifyOrder =
    currentOrder?.source === 'shopify' ||
    Boolean(config.shopifyShopDomain && config.shopifyAccessToken);

  if (isShopifyOrder && config.shopifyShopDomain && config.shopifyAccessToken && currentOrder) {
    console.log(
      `[Shopify Live Mutation] Applying decision "${decision.status}" to order #${currentOrder.order_id} on store "${config.shopifyShopDomain}"...`
    );
    try {
      const credentials = {
        shopDomain: config.shopifyShopDomain,
        accessToken: config.shopifyAccessToken,
        apiVersion: config.shopifyApiVersion || '2025-01',
        cancelOnRefused: 'true',
      };

      const mutationResult = await shopifyProvider.applyOrderDecision(
        currentOrder.order_id,
        standardizedDecision,
        credentials
      );

      console.log(`[Shopify Live Mutation Result]:`, mutationResult);

      const shopifyMutationMsg: WSMessage<ShopifyMutationData> = {
        type: 'SHOPIFY_MUTATION_RESULT',
        data: {
          orderId: currentOrder.order_id,
          decision: standardizedDecision,
          mutationResult,
          liveStore: config.shopifyShopDomain,
          timestamp: Date.now(),
        },
      };

      broadcastToAdmins(shopifyMutationMsg);
      sendToPhone(shopifyMutationMsg);
    } catch (err: any) {
      console.error('[Shopify Mutation Error]:', err);
      const failureMsg: WSMessage<ShopifyMutationData> = {
        type: 'SHOPIFY_MUTATION_RESULT',
        data: {
          orderId: currentOrder.order_id,
          decision: standardizedDecision,
          mutationResult: {
            success: false,
            externalStatus: 'MUTATION_EXCEPTION',
            rawResponse: { error: err.message },
          },
          liveStore: config.shopifyShopDomain,
          timestamp: Date.now(),
        },
      };
      broadcastToAdmins(failureMsg);
    }
  }

  // Auto hangup after 2.5 seconds per spec
  setTimeout(() => {
    terminateCall('Order finalized successfully');
  }, 2500);
}

async function terminateCall(reason = 'Call ended') {
  isInitiatingSession = false;
  if (activeAdapter) {
    try {
      await activeAdapter.endSession();
    } catch (e) {}
    activeAdapter = null;
  }

  setCallState('ended');

  const endedMsg: WSMessage = {
    type: 'CALL_ENDED',
    data: { reason },
  };

  sendToPhone(endedMsg);
  broadcastToAdmins(endedMsg);

  // Return to standby after 2 seconds
  setTimeout(() => {
    setCallState('standby');
  }, 2000);
}

// WebSocket Server Handshake
wss.on('connection', (ws: WebSocket, req) => {
  let role: 'admin' | 'phone' | 'unknown' = 'unknown';

  ws.on('message', async (data) => {
    try {
      const msg: WSMessage = JSON.parse(data.toString());

      switch (msg.type) {
        case 'REGISTER': {
          role = msg.data?.role;
          if (role === 'admin') {
            adminSockets.add(ws);
            broadcastPhoneStatus();
          } else if (role === 'phone') {
            phoneSocket = ws;
            setCallState(currentCallState === 'ringing' || currentCallState === 'active' ? currentCallState : 'standby');
            broadcastPhoneStatus();
            console.log('[WS] Mobile phone client registered on LAN.');
          }
          break;
        }

        case 'TRIGGER_CALL': {
          if (msg.data?.payload) {
            initiateCall(msg.data.payload, msg.data.config);
          }
          break;
        }

        case 'ANSWER_CALL': {
          if (currentCallState !== 'ringing' || isInitiatingSession) {
            console.warn(
              `[Server] Received ANSWER_CALL but current state is "${currentCallState}" (initiating: ${isInitiatingSession}), ignoring.`
            );
            break;
          }
          await handleCallAnswered();
          break;
        }

        case 'DECLINE_CALL': {
          await terminateCall('Declined by receiver');
          break;
        }

        case 'HANGUP_CALL': {
          await terminateCall('Hangup by user');
          break;
        }

        case 'AUDIO_CHUNK': {
          // Inbound audio from phone client
          if (activeAdapter && msg.data?.audio) {
            const buffer = Buffer.from(msg.data.audio, 'base64');
            if (activeAdapter.processAudioInput) {
              await activeAdapter.processAudioInput(buffer);
            }
          }
          break;
        }

        case 'TRANSCRIPT_UPDATE': {
          // Client tool / speech relayed from Mode A
          broadcastToAdmins(msg);
          break;
        }

        case 'ORDER_FINALIZED': {
          if (msg.data?.decision) {
            handleOrderFinalized(msg.data.decision);
          }
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;
        }
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (role === 'admin') {
      adminSockets.delete(ws);
    } else if (role === 'phone' && phoneSocket === ws) {
      phoneSocket = null;
      console.log('[WS] Phone client disconnected.');
      broadcastPhoneStatus();
      if (currentCallState === 'active' || currentCallState === 'ringing') {
        terminateCall('Phone client disconnected');
      }
    }
  });
});

// Serve static client assets if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = config.serverPort;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress();
  console.log(`=======================================================`);
  console.log(`Akadli-AI Playground Sandbox Server Running!`);
  console.log(`Local LAN IP:    ${ip}`);
  console.log(`Backend API/WS:  http://${ip}:${PORT}`);
  console.log(`Admin Dashboard: https://${ip}:${config.port}/admin`);
  console.log(`Mobile Receiver: https://${ip}:${config.port}/phone`);
  console.log(`=======================================================`);
});
