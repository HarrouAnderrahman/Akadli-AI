import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also fallback to server/.env if present
dotenv.config();

export const config = {
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  },
  get serverPort(): number {
    return parseInt(process.env.SERVER_PORT || '3001', 10);
  },
  get elevenLabsApiKey(): string {
    return (process.env.ELEVENLABS_API_KEY || '').trim();
  },
  get elevenLabsAgentId(): string {
    return (process.env.ELEVENLABS_AGENT_ID || '').trim();
  },
  get geminiApiKey(): string {
    return (process.env.GEMINI_API_KEY || '').trim();
  },
  get openAiApiKey(): string {
    return (process.env.OPENAI_API_KEY || '').trim();
  },
  get shopifyShopDomain(): string {
    return (process.env.SHOPIFY_SHOP_DOMAIN || '').trim();
  },
  get shopifyAccessToken(): string {
    return (process.env.SHOPIFY_ACCESS_TOKEN || '').trim();
  },
  get shopifyClientId(): string {
    return (process.env.SHOPIFY_CLIENT_ID || '').trim();
  },
  get shopifyClientSecret(): string {
    return (process.env.SHOPIFY_CLIENT_SECRET || '').trim();
  },
  get shopifyWebhookSecret(): string {
    return (
      process.env.SHOPIFY_WEBHOOK_SECRET ||
      process.env.SHOPIFY_CLIENT_SECRET ||
      ''
    ).trim();
  },
  get shopifyApiVersion(): string {
    return (process.env.SHOPIFY_API_VERSION || '2025-01').trim();
  },
  get youcanAccessToken(): string {
    return (process.env.YOUCAN_ACCESS_TOKEN || '').trim();
  },
  get youcanWebhookSecret(): string {
    return (process.env.YOUCAN_WEBHOOK_SECRET || '').trim();
  },
  get youcanApiBaseUrl(): string {
    return (process.env.YOUCAN_API_BASE_URL || 'https://api.youcan.shop').trim();
  },
};

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;
    for (const net of netList) {
      // Look for IPv4 and non-internal addresses (e.g. 192.168.x.x, 10.x.x.x)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
