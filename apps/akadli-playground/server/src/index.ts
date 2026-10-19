import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShopifyProvider } from '@akadli/provider-shopify';
import { YouCanProvider } from '@akadli/provider-youcan';
import { WooCommerceProvider } from '@akadli/provider-woocommerce';
import { GSheetsProvider } from '@akadli/provider-gsheets';
import { normalizeWilaya, normalizeCommune } from '@akadli/dz-geo';
import { handleFinalizeOrderToolCall } from '@akadli/core';
import { IEcommerceProvider, OrderConstraints } from '@akadli/adapter-contract';
import { config, getLocalIpAddress } from './config.js';
import {
  CallState,
  FinalizeOrderDecision,
  OrderPayload,
  TranscriptTurn,
  VoiceConfig,
  WSMessage,
  WSMessageType,
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

function getProviderFixture(provider: string, filename: string): string {
  const candidatePaths = [
    path.resolve(__dirname, `../../../../packages/provider-${provider}/fixtures`, filename),
    path.resolve(__dirname, `../../../../../packages/provider-${provider}/fixtures`, filename),
    path.resolve(process.cwd(), `packages/provider-${provider}/fixtures`, filename),
    path.resolve(process.cwd(), `../../packages/provider-${provider}/fixtures`, filename),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  throw new Error(`${provider} fixture "${filename}" not found in candidate paths.`);
}

const shopifyProvider = new ShopifyProvider();
const youcanProvider = new YouCanProvider();
const woocommerceProvider = new WooCommerceProvider();
const gsheetsProvider = new GSheetsProvider();

type ProviderKey = 'shopify' | 'youcan' | 'woocommerce' | 'gsheets';

interface ProviderDescriptor {
  key: ProviderKey;
  displayName: string;
  provider: IEcommerceProvider;
  getWebhookSecret: () => string | undefined;
  secretEnvVarName: string;
  webhookReceivedType: WSMessageType;
  mutationResultType: WSMessageType;
  getLiveStoreLabel: () => string | undefined;
  resolveFixture: (bodyFixture?: string) => string;
  createSimulatedHeaders: (rawBody: string, secret: string) => Record<string, string>;
  isTargetOrder: (order: OrderPayload | null) => boolean;
  getMutationCredentials: () => Record<string, string>;
}

const providerRegistry: ProviderDescriptor[] = [
  {
    key: 'shopify',
    displayName: 'Shopify',
    provider: shopifyProvider,
    getWebhookSecret: () => config.shopifyWebhookSecret,
    secretEnvVarName: 'SHOPIFY_WEBHOOK_SECRET',
    webhookReceivedType: 'SHOPIFY_WEBHOOK_RECEIVED',
    mutationResultType: 'SHOPIFY_MUTATION_RESULT',
    getLiveStoreLabel: () => config.shopifyShopDomain,
    resolveFixture: (fixture) =>
      fixture === 'cod-form' ? 'webhook-order-cod-form.json' : 'webhook-order-created.json',
    createSimulatedHeaders: (rawBody, secret) => {
      const computedHmac = createHmac('sha256', secret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('base64');
      return {
        'x-shopify-hmac-sha256': computedHmac,
        'x-shopify-topic': 'orders/create',
        'x-shopify-shop-domain': config.shopifyShopDomain || 'dz-fashion.myshopify.com',
        'content-type': 'application/json',
      };
    },
    isTargetOrder: (order) => {
      const isYouCan = order?.source === 'youcan';
      const isWooCommerce = order?.source === 'woocommerce';
      const isGSheets = order?.source === 'gsheets';
      const hasShopifyCreds = Boolean(
        config.shopifyShopDomain &&
          (config.shopifyAccessToken || (config.shopifyClientId && config.shopifyClientSecret))
      );
      return (
        order?.source === 'shopify' ||
        (!isYouCan && !isWooCommerce && !isGSheets && hasShopifyCreds)
      );
    },
    getMutationCredentials: () => {
      const credentials: Record<string, string> = {
        shopDomain: config.shopifyShopDomain,
        apiVersion: config.shopifyApiVersion || '2025-01',
        cancelOnRefused: 'true',
      };
      if (config.shopifyAccessToken) credentials.accessToken = config.shopifyAccessToken;
      if (config.shopifyClientId) credentials.clientId = config.shopifyClientId;
      if (config.shopifyClientSecret) credentials.clientSecret = config.shopifyClientSecret;
      return credentials;
    },
  },
  {
    key: 'youcan',
    displayName: 'YouCan',
    provider: youcanProvider,
    getWebhookSecret: () => config.youcanWebhookSecret,
    secretEnvVarName: 'YOUCAN_WEBHOOK_SECRET',
    webhookReceivedType: 'YOUCAN_WEBHOOK_RECEIVED',
    mutationResultType: 'YOUCAN_MUTATION_RESULT',
    getLiveStoreLabel: () => config.youcanApiBaseUrl,
    resolveFixture: (fixture) =>
      fixture === 'extra-fields' || fixture === 'cod-form'
        ? 'webhook-order-extra-fields.json'
        : 'webhook-order-created.json',
    createSimulatedHeaders: (rawBody, secret) => {
      const computedHmac = createHmac('sha256', secret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('hex');
      return {
        'x-youcan-signature': computedHmac,
        'content-type': 'application/json',
      };
    },
    isTargetOrder: (order) => order?.source === 'youcan',
    getMutationCredentials: () => ({
      accessToken: config.youcanAccessToken || 'simulated_youcan_token',
      baseUrl: config.youcanApiBaseUrl || 'https://api.youcan.shop',
      closeOnRefused: 'true',
    }),
  },
  {
    key: 'woocommerce',
    displayName: 'WooCommerce',
    provider: woocommerceProvider,
    getWebhookSecret: () => config.woocommerceWebhookSecret,
    secretEnvVarName: 'WOOCOMMERCE_WEBHOOK_SECRET',
    webhookReceivedType: 'WOOCOMMERCE_WEBHOOK_RECEIVED',
    mutationResultType: 'WOOCOMMERCE_MUTATION_RESULT',
    getLiveStoreLabel: () => config.woocommerceSiteUrl || 'WooCommerce DZ Store',
    resolveFixture: (fixture) =>
      fixture === 'meta-cod' || fixture === 'cod-form'
        ? 'webhook-order-meta-cod.json'
        : 'webhook-order-created.json',
    createSimulatedHeaders: (rawBody, secret) => {
      const computedHmac = createHmac('sha256', secret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('base64');
      return {
        'x-wc-webhook-signature': computedHmac,
        'content-type': 'application/json',
      };
    },
    isTargetOrder: (order) => order?.source === 'woocommerce',
    getMutationCredentials: () => ({
      siteUrl: config.woocommerceSiteUrl || 'https://dz-boutique.com',
      consumerKey: config.woocommerceConsumerKey || 'ck_simulated_key',
      consumerSecret: config.woocommerceConsumerSecret || 'cs_simulated_secret',
      cancelOnRefused: 'true',
    }),
  },
  {
    key: 'gsheets',
    displayName: 'Google Sheets',
    provider: gsheetsProvider,
    getWebhookSecret: () => config.gsheetsWebhookSecret,
    secretEnvVarName: 'GSHEETS_WEBHOOK_SECRET',
    webhookReceivedType: 'GSHEETS_WEBHOOK_RECEIVED',
    mutationResultType: 'GSHEETS_MUTATION_RESULT',
    getLiveStoreLabel: () =>
      config.gsheetsSpreadsheetId
        ? `Sheet: ${config.gsheetsSpreadsheetId}`
        : config.gsheetsAppsScriptUrl
          ? `AppsScript: ${config.gsheetsAppsScriptUrl}`
          : 'Google Sheets DZ COD',
    resolveFixture: (fixture) =>
      fixture === 'arabic' || fixture === 'arabic-cod' || fixture === 'barika'
        ? 'webhook-row-arabic.json'
        : 'webhook-row-setshop.json',
    createSimulatedHeaders: (rawBody, secret) => {
      const computedHmac = createHmac('sha256', secret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('hex');
      return {
        'x-akadli-signature': computedHmac,
        'content-type': 'application/json',
      };
    },
    isTargetOrder: (order) => order?.source === 'gsheets',
    getMutationCredentials: () => {
      const credentials: Record<string, string> = {};
      if (config.gsheetsSpreadsheetId && config.gsheetsAccessToken) {
        credentials.spreadsheetId = config.gsheetsSpreadsheetId;
        credentials.accessToken = config.gsheetsAccessToken;
      } else if (config.gsheetsAppsScriptUrl) {
        credentials.appsScriptWebhookUrl = config.gsheetsAppsScriptUrl;
        if (config.gsheetsWebhookSecret) {
          credentials.secret = config.gsheetsWebhookSecret;
        }
      } else {
        credentials.spreadsheetId = 'simulated_spreadsheet_id';
        credentials.accessToken = 'simulated_access_token';
      }
      return credentials;
    },
  },
];

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
    shopifyConfigured: Boolean(
      config.shopifyShopDomain &&
        (config.shopifyAccessToken || (config.shopifyClientId && config.shopifyClientSecret))
    ),
    shopifyDomain: config.shopifyShopDomain || null,
    shopifyApiVersion: config.shopifyApiVersion,
    youcanConfigured: Boolean(config.youcanAccessToken),
    youcanApiBaseUrl: config.youcanApiBaseUrl,
    woocommerceConfigured: Boolean(
      config.woocommerceSiteUrl &&
        config.woocommerceConsumerKey &&
        config.woocommerceConsumerSecret
    ),
    woocommerceSiteUrl: config.woocommerceSiteUrl || null,
    gsheetsConfigured: Boolean(
      (config.gsheetsSpreadsheetId && config.gsheetsAccessToken) ||
        config.gsheetsAppsScriptUrl
    ),
    gsheetsMode:
      config.gsheetsSpreadsheetId && config.gsheetsAccessToken
        ? 'api_v4'
        : config.gsheetsAppsScriptUrl
          ? 'apps_script'
          : null,
    gsheetsSpreadsheetId: config.gsheetsSpreadsheetId || null,
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

// Provider Webhook Ingress Handler
async function handleWebhookIngress(
  desc: ProviderDescriptor,
  req: express.Request,
  res: express.Response
) {
  try {
    const rawBody: Buffer | string = (req as any).rawBody || JSON.stringify(req.body);
    const headers = req.headers as Record<string, string>;

    const secret = desc.getWebhookSecret();
    if (secret) {
      const isValid = await desc.provider.verifyWebhook(headers, rawBody, secret);
      if (!isValid) {
        console.warn(`[${desc.displayName} Webhook] Rejected request: Invalid HMAC-SHA256 signature.`);
        return res.status(401).json({
          error: `Invalid ${desc.displayName} HMAC-SHA256 signature`,
        });
      }
    } else {
      console.log(
        `[${desc.displayName} Webhook] ${desc.secretEnvVarName} not set in .env; skipping HMAC check for testing.`
      );
    }

    const standardizedOrder = await desc.provider.parseWebhookOrder(req.body);
    console.log(
      `[${desc.displayName} Webhook] Ingested live order #${standardizedOrder.orderId} for customer "${standardizedOrder.customerName}" (${standardizedOrder.currentWilaya} - ${standardizedOrder.currentCommune})`
    );

    const orderPayload = standardizedDzOrderToOrderPayload(standardizedOrder, desc.key);
    orderPayload.raw_order = req.body;

    broadcastToAdmins({
      type: desc.webhookReceivedType,
      data: {
        order: orderPayload,
        standardizedOrder,
        rawOrder: req.body,
      },
    });

    if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
      initiateCall(orderPayload);
      res.json({
        success: true,
        orderId: standardizedOrder.orderId,
        ringing: true,
        message: `${desc.displayName} order ingested and mobile receiver is ringing`,
      });
    } else {
      currentOrder = orderPayload;
      res.json({
        success: true,
        orderId: standardizedOrder.orderId,
        ringing: false,
        warning: `${desc.displayName} order ingested into state, but no mobile phone client is connected`,
      });
    }
  } catch (err: any) {
    console.error(`[${desc.displayName} Webhook Error]:`, err);
    res.status(400).json({ error: err.message || `Failed to process ${desc.displayName} webhook` });
  }
}

// Provider Webhook Fixture Simulation Handler
async function handleWebhookSimulate(
  desc: ProviderDescriptor,
  req: express.Request,
  res: express.Response
) {
  try {
    const fixtureType = desc.resolveFixture(req.body?.fixture);
    const rawFixtureBody = getProviderFixture(desc.key, fixtureType);
    const parsedPayload = JSON.parse(rawFixtureBody);

    const secret =
      desc.getWebhookSecret() ||
      (desc.key === 'shopify' ? 'simulated_secret_key' : `simulated_${desc.key}_secret_key`);
    const headers = desc.createSimulatedHeaders(rawFixtureBody, secret);

    const isSignatureValid = await desc.provider.verifyWebhook(
      headers,
      rawFixtureBody,
      secret
    );

    const standardizedOrder = await desc.provider.parseWebhookOrder(parsedPayload);
    const orderPayload = standardizedDzOrderToOrderPayload(standardizedOrder, desc.key);
    orderPayload.raw_order = parsedPayload;

    console.log(
      `[${desc.displayName} Simulate] Simulated webhook for order #${standardizedOrder.orderId} (signature valid: ${isSignatureValid})`
    );

    broadcastToAdmins({
      type: desc.webhookReceivedType,
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
        warning: `${desc.displayName} order simulated and loaded, but phone client is offline`,
        order: orderPayload,
        signatureValid: isSignatureValid,
      });
    }
  } catch (err: any) {
    console.error(`[${desc.displayName} Simulate Error]:`, err);
    res.status(500).json({ error: err.message });
  }
}

// Register all provider webhook ingress & simulation endpoints
for (const desc of providerRegistry) {
  app.post(`/api/webhooks/${desc.key}`, async (req, res) => {
    await handleWebhookIngress(desc, req, res);
  });
  app.post(`/api/webhooks/${desc.key}/simulate`, async (req, res) => {
    await handleWebhookSimulate(desc, req, res);
  });
}

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

async function dispatchOrderMutation(
  desc: ProviderDescriptor,
  order: OrderPayload,
  decision: FinalizeOrderDecision
) {
  console.log(
    `[${desc.displayName} Live Mutation] Applying decision "${decision.status}" to order #${order.order_id} via @akadli/core...`
  );
  try {
    const credentials = desc.getMutationCredentials();
    const constraints: OrderConstraints = {
      allowedSizes: order.constraints?.allowed_sizes || [order.current_size],
      allowedWilayas: (order.constraints?.allowed_wilayas?.map((w) => {
        const match = w.match(/^(\d{2})/);
        return (match ? match[1] : w) as WilayaCode;
      }) || [order.current_wilaya.slice(0, 2) as WilayaCode]),
      allowedCommunes: order.constraints?.allowed_communes || [order.current_commune],
    };

    const toolResult = await handleFinalizeOrderToolCall(
      {
        orderId: order.order_id || decision.order_id,
        status: decision.status,
        finalSize: decision.final_size || undefined,
        finalWilaya: decision.final_wilaya || undefined,
        finalCommune: decision.final_commune || undefined,
        finalAddressNote: decision.final_address_note || undefined,
        reasonOrNotes: decision.reason_or_notes || '',
      },
      desc.provider,
      credentials,
      constraints
    );

    console.log(`[@akadli/core ${desc.key === 'shopify' ? '' : desc.displayName + ' '}Tool Result]:`, toolResult);

    const standardizedDecision: StandardizedFinalizedOrderDecision = toolResult.decision || {
      orderId: order.order_id || decision.order_id,
      status: decision.status,
      finalSize: decision.final_size || undefined,
      finalWilaya: (decision.final_wilaya ? normalizeWilaya(decision.final_wilaya).code : undefined) as WilayaCode | undefined,
      finalCommune: decision.final_commune || undefined,
      finalAddressNote: decision.final_address_note || undefined,
      reasonOrNotes: decision.reason_or_notes || '',
    };

    const mutationMsg: WSMessage<ShopifyMutationData> = {
      type: desc.mutationResultType,
      data: {
        orderId: order.order_id,
        decision: standardizedDecision,
        mutationResult: {
          success: toolResult.success,
          externalStatus: toolResult.externalStatus || (toolResult.success ? 'UPDATED' : 'ERROR'),
          rawResponse: toolResult.rawResponse || { error: toolResult.error || toolResult.message },
        },
        liveStore: desc.getLiveStoreLabel(),
        ...(desc.key !== 'shopify' ? { provider: desc.key } : {}),
        timestamp: Date.now(),
      },
    };

    broadcastToAdmins(mutationMsg);
    sendToPhone(mutationMsg);
  } catch (err: any) {
    console.error(`[${desc.displayName} Mutation Error]:`, err);
    const fallbackWilaya = decision.final_wilaya ? (normalizeWilaya(decision.final_wilaya).code as WilayaCode) : undefined;
    const standardizedDecision: StandardizedFinalizedOrderDecision = {
      orderId: order.order_id || decision.order_id,
      status: decision.status,
      finalSize: decision.final_size || undefined,
      finalWilaya: fallbackWilaya,
      finalCommune: decision.final_commune || undefined,
      finalAddressNote: decision.final_address_note || undefined,
      reasonOrNotes: decision.reason_or_notes || '',
    };

    const failureMsg: WSMessage<ShopifyMutationData> = {
      type: desc.mutationResultType,
      data: {
        orderId: order.order_id,
        decision: standardizedDecision,
        mutationResult: {
          success: false,
          externalStatus: 'MUTATION_EXCEPTION',
          rawResponse: { error: err.message },
        },
        liveStore: desc.getLiveStoreLabel(),
        ...(desc.key !== 'shopify' ? { provider: desc.key } : {}),
        timestamp: Date.now(),
      },
    };
    broadcastToAdmins(failureMsg);
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

  // Live Outbound Order Mutations powered by @akadli/core
  const matchedProvider = providerRegistry.find((p) => p.isTargetOrder(currentOrder));
  if (matchedProvider && currentOrder) {
    await dispatchOrderMutation(matchedProvider, currentOrder, decision);
  }

  // Fallback auto hangup after 8 seconds (allows agent to generate and complete goodbye statement)
  setTimeout(() => {
    if (currentCallState === 'finalizing' || currentCallState === 'active') {
      terminateCall('Order finalized successfully');
    }
  }, 8000);
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
