import { ShopifyCredentials } from "./schemas.js";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

export function clearShopifyTokenCache(): void {
  tokenCache.clear();
}

export class ShopifyClient {
  private readonly rawDomain: string;
  private readonly baseUrl: string;
  private readonly credentials: ShopifyCredentials;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: ShopifyCredentials, fetchFn?: typeof fetch) {
    this.credentials = credentials;
    this.rawDomain = credentials.shopDomain
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    const apiVersion = credentials.apiVersion || "2024-04";
    this.baseUrl = `https://${this.rawDomain}/admin/api/${apiVersion}`;
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
  }

  /**
   * Retrieves an access token: returns credentials.accessToken if provided,
   * or automatically exchanges clientId + clientSecret via POST /admin/oauth/access_token
   * and caches the token in memory until expiry.
   */
  async getAccessToken(): Promise<string> {
    if (this.credentials.accessToken && this.credentials.accessToken.trim()) {
      return this.credentials.accessToken.trim();
    }

    const clientId = this.credentials.clientId?.trim();
    const clientSecret = this.credentials.clientSecret?.trim();

    if (!clientId || !clientSecret) {
      throw new Error("Missing Shopify accessToken or client credentials (clientId/clientSecret).");
    }

    const cacheKey = `${this.rawDomain}:${clientId}`;
    const cached = tokenCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.accessToken;
    }

    const tokenUrl = `https://${this.rawDomain}/admin/oauth/access_token`;
    const bodyParams = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    });

    const res = await this.getFetch()(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyParams.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Shopify OAuth token exchange failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw new Error("Shopify OAuth response missing access_token");
    }

    const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 86400;
    const expiresAt = now + Math.max(expiresInSec - 60, 10) * 1000;

    tokenCache.set(cacheKey, {
      accessToken: data.access_token,
      expiresAt
    });

    return data.access_token;
  }

  /**
   * Updates order tags, note, and shipping address on Shopify.
   */
  async updateOrder(
    orderId: string,
    orderData: {
      tags?: string;
      note?: string;
      shipping_address?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${orderId}.json`;
    const numericOrStringId = isNaN(Number(orderId)) ? orderId : Number(orderId);

    const payload = {
      order: {
        id: numericOrStringId,
        ...orderData
      }
    };

    return this.request(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Cancels an order on Shopify via POST /admin/api/{version}/orders/{id}/cancel.json
   */
  async cancelOrder(
    orderId: string,
    cancelOptions: {
      reason?: string;
      email?: boolean;
      restock?: boolean;
    } = { reason: "customer", email: false, restock: true }
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${orderId}/cancel.json`;

    return this.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cancelOptions)
    });
  }

  private async request(
    url: string,
    init: RequestInit
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    try {
      const token = await this.getAccessToken();
      const headers = {
        ...init.headers,
        "X-Shopify-Access-Token": token
      };

      const res = await this.getFetch()(url, { ...init, headers });
      const text = await res.text();
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          externalStatus: "UNAUTHORIZED",
          rawResponse: parsedBody
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          externalStatus: "NOT_FOUND",
          rawResponse: parsedBody
        };
      }

      if (res.status === 429) {
        return {
          success: false,
          externalStatus: "RATE_LIMITED",
          rawResponse: parsedBody
        };
      }

      if (!res.ok) {
        return {
          success: false,
          externalStatus: `HTTP_${res.status}`,
          rawResponse: parsedBody
        };
      }

      return {
        success: true,
        externalStatus: "OK",
        rawResponse: parsedBody
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isAuthError =
        errorMessage.toLowerCase().includes("unauthorized") ||
        errorMessage.includes("401");
      return {
        success: false,
        externalStatus: isAuthError ? "UNAUTHORIZED" : "NETWORK_ERROR",
        rawResponse: { error: errorMessage }
      };
    }
  }
}
