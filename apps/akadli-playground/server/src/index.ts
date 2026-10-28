import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { createHmac } from 'node:crypto';
import dns from 'node:dns';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Prefer IPv4 first to avoid Node undici Happy Eyeballs connect timeouts when reaching api.elevenlabs.io
dns.setDefaultResultOrder('ipv4first');
import { ShopifyProvider } from '@akadli/provider-shopify';
import { YouCanProvider } from '@akadli/provider-youcan';
import { WooCommerceProvider, isWooCommerceWebhookPing } from '@akadli/provider-woocommerce';
import { GSheetsProvider } from '@akadli/provider-gsheets';
import { TassyirProvider, TassyirClient } from '@akadli/provider-tassyir';
import { normalizeWilaya, normalizeCommune } from '@akadli/dz-geo';
import {
  handleFinalizeOrderToolCall,
  fetchElevenLabsConversationAudio,
  fetchElevenLabsConversationTranscript,
} from '@akadli/core';
import { IEcommerceProvider, OrderConstraints, StandardizedDzOrder } from '@akadli/adapter-contract';
import { config, getLocalIpAddress } from './config.js';
import {
  CallLogEntry,
  CallLogTranscriptItem,
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
app.use(
  express.urlencoded({
    extended: true,
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
const tassyirProvider = new TassyirProvider();

type ProviderKey = 'shopify' | 'youcan' | 'woocommerce' | 'gsheets' | 'tassyir';

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
      const isTassyir = order?.source === 'tassyir';
      const hasShopifyCreds = Boolean(
        config.shopifyShopDomain &&
          (config.shopifyAccessToken || (config.shopifyClientId && config.shopifyClientSecret))
      );
      return (
        order?.source === 'shopify' ||
        (!isYouCan && !isWooCommerce && !isGSheets && !isTassyir && hasShopifyCreds)
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
  {
    key: 'tassyir',
    displayName: 'Tassyir',
    provider: tassyirProvider,
    getWebhookSecret: () => undefined,
    secretEnvVarName: 'TASSYIR_PUBLIC_KEY',
    webhookReceivedType: 'TASSYIR_WEBHOOK_RECEIVED',
    mutationResultType: 'TASSYIR_MUTATION_RESULT',
    getLiveStoreLabel: () => config.tassyirApiBaseUrl || 'https://api.tassyir.io/apps/2026-10',
    resolveFixture: (fixture) =>
      fixture === 'stopdesk' || fixture === 'stop-desk' || fixture === '59'
        ? 'webhook-order-stopdesk.json'
        : 'webhook-order-created.json',
    createSimulatedHeaders: (rawBody, secret) => {
      const computedHmac = createHmac('sha256', secret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('hex');
      return {
        'x-tassyir-signature': computedHmac,
        'content-type': 'application/json',
      };
    },
    isTargetOrder: (order) => order?.source === 'tassyir',
    getMutationCredentials: () => {
      const credentials: Record<string, string> = {
        baseUrl: config.tassyirApiBaseUrl || 'https://api.tassyir.io/apps/2026-10',
        confirmOnModified: 'true',
        cancelOnRefused: 'true',
      };
      const token = inMemoryTassyirAccessToken || config.tassyirAccessToken || config.tassyirApiKey;
      if (token) {
        credentials.accessToken = token;
      }
      if (config.tassyirClientId) {
        credentials.clientId = config.tassyirClientId;
      }
      if (config.tassyirClientSecret) {
        credentials.clientSecret = config.tassyirClientSecret;
      }
      const refreshToken = inMemoryTassyirRefreshToken || config.tassyirRefreshToken;
      if (refreshToken) {
        credentials.refreshToken = refreshToken;
      }
      if (!credentials.accessToken && !credentials.clientId) {
        credentials.accessToken = 'simulated_tassyir_access_token';
      }
      return credentials;
    },
  },
];

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// In-memory Tassyir OAuth token storage (acquired via /api/webhooks/tassyir/callback)
let inMemoryTassyirAccessToken: string | null = config.tassyirAccessToken || null;
let inMemoryTassyirRefreshToken: string | null = config.tassyirRefreshToken || null;

// Global State
let adminSockets = new Set<WebSocket>();
let phoneSocket: WebSocket | null = null;
let currentCallState: CallState = 'standby';
let currentOrder: OrderPayload | null = null;
let currentConfig: VoiceConfig | null = null;
let activeAdapter: VoiceEngineAdapter | null = null;
let isInitiatingSession = false;
let currentConversationId: string | null = null;
let currentTranscript: CallLogTranscriptItem[] = [];
let activeCallLogPath: string | null = null;
let pendingAudioLog: CallLogEntry | null = null;
let finalizeHangupTimer: NodeJS.Timeout | null = null;

function getCallLogsDir(): string {
  return path.resolve(process.cwd(), config.callLogsDir);
}

/**
 * Fetches the ElevenLabs MP3 recording once the conversation reaches `status === "done"`,
 * saves it to `mp3Path`, and enriches `jsonPath` if closing transcript turns were added.
 */
async function fetchAndSaveConversationMp3(
  conversationId: string,
  mp3Path: string,
  jsonPath?: string
): Promise<boolean> {
  const cleanConvId = conversationId.trim();
  if (!cleanConvId || !config.elevenlabsApiKey) {
    return false;
  }

  if (fs.existsSync(mp3Path)) {
    return true;
  }

  const apiKey = config.elevenlabsApiKey;
  const maxAttempts = 8;
  const pollIntervalMs = 2500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const details = await fetchElevenLabsConversationTranscript(cleanConvId, apiKey);

      if (jsonPath && details.transcript.length > 0 && fs.existsSync(jsonPath)) {
        try {
          const parsedJson = JSON.parse(await fsPromises.readFile(jsonPath, 'utf-8'));
          const existingCount = Array.isArray(parsedJson.transcript)
            ? parsedJson.transcript.length
            : 0;
          if (details.transcript.length > existingCount) {
            const baseTs =
              typeof parsedJson.timestamp === 'number' ? parsedJson.timestamp : Date.now();
            parsedJson.transcript = details.transcript.map((t) => ({
              role: t.role,
              text: t.message,
              timestamp: baseTs + (t.timeInCallSecs ?? 0) * 1000,
            }));
            await fsPromises.writeFile(jsonPath, JSON.stringify(parsedJson, null, 2), 'utf-8');
          }
        } catch {
          // Ignore non-fatal JSON transcript update errors
        }
      }

      if (
        (details.status === 'initiated' ||
          details.status === 'in-progress' ||
          details.status === 'processing') &&
        !details.hasAudio
      ) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, pollIntervalMs));
          continue;
        }
      }

      const audioBytes = await fetchElevenLabsConversationAudio(cleanConvId, apiKey);
      if (audioBytes.byteLength > 0) {
        await fsPromises.mkdir(path.dirname(mp3Path), { recursive: true });
        await fsPromises.writeFile(mp3Path, audioBytes);
        console.log(
          `[Call Logs] Saved ElevenLabs MP3 audio (${audioBytes.byteLength} bytes) to ${mp3Path}`
        );
        return true;
      }
    } catch (err: any) {
      if (attempt === maxAttempts) {
        console.warn(
          `[Call Logs] Could not archive MP3 audio for ${cleanConvId}:`,
          err.message || err
        );
      }
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  return false;
}

function recordTranscriptTurn(turn: TranscriptTurn | undefined, conversationId?: string) {
  if (conversationId && conversationId.trim()) {
    currentConversationId = conversationId.trim();
  }
  if (!turn || typeof turn.text !== 'string' || !turn.text.trim()) {
    return;
  }
  const role: 'user' | 'agent' =
    turn.role === 'user' || turn.speaker === 'user' ? 'user' : 'agent';
  currentTranscript.push({
    role,
    text: turn.text,
    timestamp: turn.timestamp || Date.now(),
  });

  if (activeCallLogPath && config.saveCallLogs) {
    const targetPath = activeCallLogPath;
    const latestTranscript = [...currentTranscript];
    const latestConvId = currentConversationId;
    void (async () => {
      try {
        const raw = await fsPromises.readFile(targetPath, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.transcript = latestTranscript;
        if (latestConvId && !parsed.conversationId) {
          parsed.conversationId = latestConvId;
        }
        await fsPromises.writeFile(targetPath, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch {
        // Ignore background update errors if file is being written
      }
    })();
  }
}

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
    tassyirConfigured: Boolean(
      inMemoryTassyirAccessToken ||
      config.tassyirAccessToken ||
      (config.tassyirClientId && config.tassyirClientSecret) ||
      config.tassyirApiKey
    ),
    tassyirApiBaseUrl: config.tassyirApiBaseUrl,
    saveCallLogs: config.saveCallLogs,
    callLogsDir: config.callLogsDir,
  });
});

// Call Logs & Audio Archive Endpoints
app.get('/api/logs', async (_req, res) => {
  try {
    const logsDir = getCallLogsDir();
    if (!fs.existsSync(logsDir)) {
      return res.json({ logs: [] });
    }
    const entries = await fsPromises.readdir(logsDir);
    const jsonFiles = entries.filter((f) => f.endsWith('.json'));

    const logs: CallLogEntry[] = [];
    for (const jsonFile of jsonFiles) {
      try {
        const fullJsonPath = path.join(logsDir, jsonFile);
        const rawContent = await fsPromises.readFile(fullJsonPath, 'utf-8');
        const parsed = JSON.parse(rawContent);
        const baseName = jsonFile.slice(0, -'.json'.length);
        const mp3Filename = `${baseName}.mp3`;
        const mp3Path = path.join(logsDir, mp3Filename);
        const hasMp3 = fs.existsSync(mp3Path);
        const isPending = pendingAudioLog?.id === baseName;

        logs.push({
          id: baseName,
          orderId: String(parsed.orderId || baseName),
          provider: String(parsed.provider || 'manual'),
          timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
          conversationId: parsed.conversationId || null,
          status: parsed.decision?.status || 'COMPLETED',
          customerName: parsed.order?.customer_name || parsed.order?.customerName || '',
          itemName: parsed.order?.item_name || parsed.order?.itemName || '',
          jsonFilename: jsonFile,
          jsonUrl: `/api/logs/${encodeURIComponent(jsonFile)}`,
          mp3Filename: hasMp3 ? mp3Filename : null,
          mp3Url: hasMp3 ? `/api/logs/${encodeURIComponent(mp3Filename)}` : null,
          hasAudio: hasMp3,
          audioPending: isPending,
          transcriptCount: Array.isArray(parsed.transcript) ? parsed.transcript.length : 0,
        });
      } catch {
        // Skip malformed log files
      }
    }

    logs.sort((a, b) => b.timestamp - a.timestamp);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list call logs' });
  }
});

app.get('/api/logs/:filename', async (req, res) => {
  try {
    const requested = req.params.filename || '';
    const safeFilename = path.basename(requested);
    if (
      !safeFilename ||
      safeFilename !== requested ||
      (!safeFilename.endsWith('.json') && !safeFilename.endsWith('.mp3'))
    ) {
      return res.status(400).json({ error: 'Invalid log filename' });
    }

    const logsDir = getCallLogsDir();
    const filePath = path.join(logsDir, safeFilename);

    // If an .mp3 file is requested but not yet on disk, check if its paired .json has a conversationId and fetch on-demand
    if (safeFilename.endsWith('.mp3') && !fs.existsSync(filePath)) {
      const baseName = safeFilename.slice(0, -'.mp3'.length);
      const pairedJsonPath = path.join(logsDir, `${baseName}.json`);
      if (fs.existsSync(pairedJsonPath) && config.elevenlabsApiKey) {
        try {
          const rawJson = await fsPromises.readFile(pairedJsonPath, 'utf-8');
          const parsedJson = JSON.parse(rawJson);
          if (parsedJson.conversationId) {
            await fetchAndSaveConversationMp3(
              String(parsedJson.conversationId),
              filePath,
              pairedJsonPath
            );
          }
        } catch {
          // Fall through to 404 check below if on-demand fetch fails
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Call log file not found' });
    }

    if (safeFilename.endsWith('.json')) {
      const jsonContent = await fsPromises.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(jsonContent);
    } else {
      const audioBuffer = await fsPromises.readFile(filePath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', String(audioBuffer.byteLength));
      return res.send(audioBuffer);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to serve call log file' });
  }
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

    // Handle WooCommerce initial unsigned handshake ping (WC_Webhook::deliver_ping)
    if (desc.key === 'woocommerce' && isWooCommerceWebhookPing(headers, req.body, rawBody)) {
      const webhookId =
        req.body?.webhook_id ||
        (typeof rawBody === 'string' && rawBody.split('webhook_id=')[1]?.split('&')[0]) ||
        (Buffer.isBuffer(rawBody) && rawBody.toString('utf8').split('webhook_id=')[1]?.split('&')[0]) ||
        'unknown';
      console.log(
        `[WooCommerce Webhook] Acknowledged initial webhook handshake ping (webhook_id: ${webhookId}).`
      );
      return res.status(200).json({
        success: true,
        message: 'WooCommerce webhook ping acknowledged',
        webhook_id: webhookId,
      });
    }

    if (desc.key === 'tassyir') {
      // Tassyir signs with Ed25519 using public keys (whpk_...) from https://api.tassyir.io/apps/webhook-keys.
      // Zero secret is required in .env!
      const isValid = await desc.provider.verifyWebhook(headers, rawBody, '');
      if (!isValid) {
        const receivedSig =
          headers['webhook-signature'] ||
          headers['x-webhook-signature'] ||
          headers['x-tassyir-signature'];
        console.warn(
          `[Tassyir Webhook] Rejected request: Invalid Ed25519 signature. ` +
          `ContentType: "${req.headers['content-type']}", ` +
          `UserAgent: "${req.headers['user-agent']}", ` +
          `SignatureHeader: "${receivedSig ? 'present' : 'MISSING'}"`
        );
        return res.status(401).json({
          error: 'Invalid Tassyir Ed25519 webhook signature',
        });
      }
    } else {
      const secret = desc.getWebhookSecret();
      if (secret) {
        const isValid = await desc.provider.verifyWebhook(headers, rawBody, secret);
        if (!isValid) {
          const receivedSignature =
            headers['x-wc-webhook-signature'] ||
            headers['x-shopify-hmac-sha256'] ||
            headers['x-youcan-signature'] ||
            headers['x-tassyir-signature'] ||
            headers['x-akadli-signature'];
          console.warn(
            `[${desc.displayName} Webhook] Rejected request: Invalid HMAC-SHA256 signature. ` +
            `ContentType: "${req.headers['content-type']}", ` +
            `UserAgent: "${req.headers['user-agent']}", ` +
            `SignatureHeader: "${receivedSignature ? 'present' : 'MISSING'}"`
          );
          return res.status(401).json({
            error: `Invalid ${desc.displayName} HMAC-SHA256 signature`,
          });
        }
      } else {
        console.log(
          `[${desc.displayName} Webhook] ${desc.secretEnvVarName} not set in .env; skipping HMAC check for testing.`
        );
      }
    }

    let standardizedOrder: StandardizedDzOrder;
    if (desc.key === 'tassyir') {
      const creds = desc.getMutationCredentials();
      standardizedOrder = await (desc.provider as TassyirProvider).parseWebhookOrder(req.body, { credentials: creds });
    } else {
      standardizedOrder = await desc.provider.parseWebhookOrder(req.body);
    }
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
    const topLevelKeys =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? Object.keys(req.body)
        : Array.isArray(req.body)
          ? `[Array of length ${req.body.length}]`
          : typeof req.body;

    let payloadPreview = '';
    try {
      payloadPreview = JSON.stringify(req.body, null, 2);
      if (payloadPreview.length > 1000) {
        payloadPreview = payloadPreview.slice(0, 1000) + '\n... (truncated)';
      }
    } catch {
      payloadPreview = String(req.body);
    }

    console.error(
      `[${desc.displayName} Webhook Error]: Failed to process incoming webhook.\n` +
      `Top-level keys: ${JSON.stringify(topLevelKeys)}\n` +
      `Payload preview:\n${payloadPreview}\n` +
      `Error:`,
      err
    );
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

    let standardizedOrder: StandardizedDzOrder;
    if (desc.key === 'tassyir') {
      const creds = desc.getMutationCredentials();
      standardizedOrder = await (desc.provider as TassyirProvider).parseWebhookOrder(parsedPayload, { credentials: creds });
    } else {
      standardizedOrder = await desc.provider.parseWebhookOrder(parsedPayload);
    }
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

// Tassyir Headless External App OAuth Callback Route
app.get('/api/webhooks/tassyir/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).send('<h1>Missing install code (?code=...)</h1>');
  }

  const clientId = config.tassyirClientId;
  const clientSecret = config.tassyirClientSecret;
  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .send('<h1>TASSYIR_CLIENT_ID or TASSYIR_CLIENT_SECRET not configured in .env</h1>');
  }

  try {
    const tassyirClient = new TassyirClient({
      clientId,
      clientSecret,
      baseUrl: config.tassyirApiBaseUrl,
    });
    const tokens = await tassyirClient.redeemInstallCode(clientId, clientSecret, code);
    inMemoryTassyirAccessToken = tokens.access_token;
    if (tokens.refresh_token) {
      inMemoryTassyirRefreshToken = tokens.refresh_token;
    }

    console.log('[Tassyir OAuth] Successfully acquired OAuth tokens for store installation:');
    console.log(`  Access Token: ${tokens.access_token}`);
    if (tokens.refresh_token) {
      console.log(
        `  Refresh Token: ${tokens.refresh_token} (Optionally save as TASSYIR_REFRESH_TOKEN in .env to persist across server restarts)`
      );
    }

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Akadli-AI Connected to Tassyir</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; max-width: 520px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 1rem; }
            p { color: #94a3b8; line-height: 1.6; }
            code { background: #0f172a; color: #38bdf8; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Akadli-AI connected to Tassyir store!</h1>
            <p>Access &amp; Refresh tokens acquired. You can now trigger <code>orders/created</code> webhooks.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[Tassyir OAuth Callback Error]:', err);
    res.status(500).send(`<h1>Failed to redeem Tassyir install code</h1><p>${err.message}</p>`);
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
  if (finalizeHangupTimer) {
    clearTimeout(finalizeHangupTimer);
    finalizeHangupTimer = null;
  }
  currentOrder = payload;
  currentConfig = vConfig || {
    engine: 'elevenagents',
    useAgentDefaults: true,
  };
  currentConversationId = null;
  currentTranscript = [];
  activeCallLogPath = null;
  pendingAudioLog = null;

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
          recordTranscriptTurn(turn);
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
): Promise<{ success: boolean; externalStatus: string; rawResponse?: unknown }> {
  console.log(
    `[${desc.displayName} Live Mutation] Applying decision "${decision.status}" to order #${order.order_id} via @akadli/core...`
  );
  try {
    const credentials = desc.getMutationCredentials();
    const constraints: OrderConstraints = {
      allowedVariants: order.constraints?.allowed_variants || [order.current_variant],
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
        finalVariant: decision.final_variant || undefined,
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
      finalVariant: decision.final_variant || undefined,
      finalWilaya: (decision.final_wilaya ? normalizeWilaya(decision.final_wilaya).code : undefined) as WilayaCode | undefined,
      finalCommune: decision.final_commune || undefined,
      finalAddressNote: decision.final_address_note || undefined,
      reasonOrNotes: decision.reason_or_notes || '',
    };

    const mutationResult = {
      success: toolResult.success,
      externalStatus: toolResult.externalStatus || (toolResult.success ? 'UPDATED' : 'ERROR'),
      rawResponse: toolResult.rawResponse || { error: toolResult.error || toolResult.message },
    };

    const mutationMsg: WSMessage<ShopifyMutationData> = {
      type: desc.mutationResultType,
      data: {
        orderId: order.order_id,
        decision: standardizedDecision,
        mutationResult,
        liveStore: desc.getLiveStoreLabel(),
        ...(desc.key !== 'shopify' ? { provider: desc.key } : {}),
        timestamp: Date.now(),
      },
    };

    broadcastToAdmins(mutationMsg);
    sendToPhone(mutationMsg);
    return mutationResult;
  } catch (err: any) {
    console.error(`[${desc.displayName} Mutation Error]:`, err);
    const fallbackWilaya = decision.final_wilaya ? (normalizeWilaya(decision.final_wilaya).code as WilayaCode) : undefined;
    const standardizedDecision: StandardizedFinalizedOrderDecision = {
      orderId: order.order_id || decision.order_id,
      status: decision.status,
      finalVariant: decision.final_variant || undefined,
      finalWilaya: fallbackWilaya,
      finalCommune: decision.final_commune || undefined,
      finalAddressNote: decision.final_address_note || undefined,
      reasonOrNotes: decision.reason_or_notes || '',
    };

    const mutationResult = {
      success: false,
      externalStatus: 'MUTATION_EXCEPTION',
      rawResponse: { error: err.message },
    };

    const failureMsg: WSMessage<ShopifyMutationData> = {
      type: desc.mutationResultType,
      data: {
        orderId: order.order_id,
        decision: standardizedDecision,
        mutationResult,
        liveStore: desc.getLiveStoreLabel(),
        ...(desc.key !== 'shopify' ? { provider: desc.key } : {}),
        timestamp: Date.now(),
      },
    };
    broadcastToAdmins(failureMsg);
    return mutationResult;
  }
}

async function archiveCallTranscriptAndAudio(params: {
  orderId: string;
  provider: string;
  timestamp: number;
  conversationId: string | null;
  order: OrderPayload | null;
  decision: FinalizeOrderDecision;
  mutationResult: { success: boolean; externalStatus: string; rawResponse?: unknown } | null;
  transcript: CallLogTranscriptItem[];
}) {
  if (!config.saveCallLogs) {
    return;
  }

  try {
    const logsDir = getCallLogsDir();
    await fsPromises.mkdir(logsDir, { recursive: true });

    const safeOrderId = String(params.orderId || 'order').replace(/[^a-zA-Z0-9_-]/g, '_');
    const baseName = `${safeOrderId}-${params.timestamp}`;
    const jsonFilename = `${baseName}.json`;
    const jsonPath = path.join(logsDir, jsonFilename);

    activeCallLogPath = jsonPath;

    const jsonPayload = {
      orderId: params.orderId,
      provider: params.provider,
      timestamp: params.timestamp,
      conversationId: params.conversationId,
      order: params.order,
      decision: params.decision,
      mutationResult: params.mutationResult,
      transcript: params.transcript,
    };

    await fsPromises.writeFile(jsonPath, JSON.stringify(jsonPayload, null, 2), 'utf-8');
    console.log(`[Call Logs] Saved STT transcript JSON to ${jsonPath}`);

    const willFetchAudio = Boolean(params.conversationId && config.elevenlabsApiKey);
    const initialLogEntry: CallLogEntry = {
      id: baseName,
      orderId: params.orderId,
      provider: params.provider,
      timestamp: params.timestamp,
      conversationId: params.conversationId,
      status: params.decision.status,
      customerName: params.order?.customer_name || '',
      itemName: params.order?.item_name || '',
      jsonFilename,
      jsonUrl: `/api/logs/${encodeURIComponent(jsonFilename)}`,
      mp3Filename: null,
      mp3Url: null,
      hasAudio: false,
      audioPending: willFetchAudio,
      transcriptCount: params.transcript.length,
    };

    pendingAudioLog = willFetchAudio ? initialLogEntry : null;

    broadcastToAdmins({
      type: 'CALL_LOG_SAVED',
      data: { log: initialLogEntry },
    });
  } catch (err: any) {
    console.error('[Call Logs] Failed to write call log:', err);
  }
}

function flushPendingCallAudioArchive() {
  if (!pendingAudioLog || !pendingAudioLog.conversationId || !config.elevenlabsApiKey) {
    return;
  }

  const logToArchive = pendingAudioLog;
  pendingAudioLog = null;

  const logsDir = getCallLogsDir();
  const mp3Filename = `${logToArchive.id}.mp3`;
  const mp3Path = path.join(logsDir, mp3Filename);
  const jsonPath = path.join(logsDir, logToArchive.jsonFilename);

  // Wait 2s after call disconnect so ElevenLabs finishes flushing the conversation audio
  setTimeout(async () => {
    const saved = await fetchAndSaveConversationMp3(
      logToArchive.conversationId!,
      mp3Path,
      jsonPath
    );

    let transcriptCount = logToArchive.transcriptCount;
    try {
      const updatedParsed = JSON.parse(await fsPromises.readFile(jsonPath, 'utf-8'));
      if (Array.isArray(updatedParsed.transcript)) {
        transcriptCount = updatedParsed.transcript.length;
      }
    } catch {
      // Keep previous count
    }

    const updatedEntry: CallLogEntry = {
      ...logToArchive,
      mp3Filename: saved ? mp3Filename : null,
      mp3Url: saved ? `/api/logs/${encodeURIComponent(mp3Filename)}` : null,
      hasAudio: saved,
      audioPending: false,
      transcriptCount,
    };

    broadcastToAdmins({
      type: 'CALL_LOG_SAVED',
      data: { log: updatedEntry },
    });
  }, 2000);
}

async function handleOrderFinalized(
  decision: FinalizeOrderDecision,
  conversationId?: string | null
) {
  if (conversationId && conversationId.trim()) {
    currentConversationId = conversationId.trim();
  }
  setCallState('finalizing');

  const finalizedMsg: WSMessage = {
    type: 'ORDER_FINALIZED',
    data: {
      decision,
      originalOrder: currentOrder,
      conversationId: currentConversationId,
    },
  };

  broadcastToAdmins(finalizedMsg);
  sendToPhone(finalizedMsg);

  // Live Outbound Order Mutations powered by @akadli/core
  let mutationResult: { success: boolean; externalStatus: string; rawResponse?: unknown } | null =
    null;
  const matchedProvider = providerRegistry.find((p) => p.isTargetOrder(currentOrder));
  if (matchedProvider && currentOrder) {
    mutationResult = await dispatchOrderMutation(matchedProvider, currentOrder, decision);
  }

  // Save .json STT transcript and schedule .mp3 audio archiving on disconnect
  const orderId = currentOrder?.order_id || decision.order_id || 'unknown';
  const providerName = matchedProvider?.key || currentOrder?.source || 'manual';
  await archiveCallTranscriptAndAudio({
    orderId,
    provider: providerName,
    timestamp: Date.now(),
    conversationId: currentConversationId,
    order: currentOrder,
    decision,
    mutationResult,
    transcript: [...currentTranscript],
  });

  // Fallback auto hangup after 15 seconds if client has not already disconnected after goodbye
  if (finalizeHangupTimer) {
    clearTimeout(finalizeHangupTimer);
  }
  finalizeHangupTimer = setTimeout(() => {
    finalizeHangupTimer = null;
    if (currentCallState === 'finalizing' || currentCallState === 'active') {
      terminateCall('Order finalized successfully');
    }
  }, 15000);
}

async function terminateCall(reason = 'Call ended') {
  if (finalizeHangupTimer) {
    clearTimeout(finalizeHangupTimer);
    finalizeHangupTimer = null;
  }
  isInitiatingSession = false;
  if (activeAdapter) {
    try {
      await activeAdapter.endSession();
    } catch (e) {}
    activeAdapter = null;
  }

  setCallState('ended');
  flushPendingCallAudioArchive();

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
          recordTranscriptTurn(msg.data?.turn, msg.data?.conversationId);
          broadcastToAdmins(msg);
          break;
        }

        case 'ORDER_FINALIZED': {
          if (msg.data?.decision) {
            handleOrderFinalized(msg.data.decision, msg.data.conversationId);
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
