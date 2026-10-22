import {
  TassyirCredentials,
  TassyirCredentialsInput,
  TassyirCredentialsSchema,
  TassyirOrderPatchPayload,
  TassyirOrderCancelPayload,
  TassyirDispatchPayload,
  TassyirOAuthTokenResponse,
  TassyirOAuthTokenResponseSchema,
  TassyirProduct,
  TassyirProductSchema,
} from "./schemas.js";

export const ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY =
  "whpk_1BaNZhSk1qxT/1RugRT9eucQWvfo1ufg0o1u5qZejAA=";

let cachedKeys: { keys: string[]; expiresAt: number } | null = null;

export function clearWebhookKeysCache(): void {
  cachedKeys = null;
}

/**
 * Fetches published Tassyir webhook Ed25519 public keys from GET https://api.tassyir.io/apps/webhook-keys.
 * Caches the keys in memory for 1 hour, falling back to ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY on error.
 */
export async function fetchTassyirWebhookPublicKeys(
  fetchFn?: typeof fetch,
  baseUrl = "https://api.tassyir.io/apps"
): Promise<string[]> {
  const now = Date.now();
  if (cachedKeys && now < cachedKeys.expiresAt && cachedKeys.keys.length > 0) {
    return [...cachedKeys.keys];
  }

  const fn = fetchFn ?? globalThis.fetch;
  const url = `${baseUrl.replace(/\/+$/, "")}/webhook-keys`;
  try {
    const res = await fn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Tassyir webhook keys: HTTP ${res.status}`);
    }
    const data = (await res.json()) as any;
    const keys: string[] = [];
    if (data && typeof data === "object") {
      const list = Array.isArray(data.keys)
        ? data.keys
        : Array.isArray(data)
          ? data
          : [];
      for (const item of list) {
        if (typeof item === "string" && item.trim()) {
          keys.push(item.trim());
        } else if (item && typeof item.publicKey === "string" && item.publicKey.trim()) {
          keys.push(item.publicKey.trim());
        }
      }
    }

    if (keys.length > 0) {
      cachedKeys = {
        keys,
        expiresAt: now + 60 * 60 * 1000, // 1 hour
      };
      return [...keys];
    }
  } catch {
    // Graceful fallback to default key if network error or test environment
  }

  const fallback = [ACTIVE_TASSYIR_WEBHOOK_PUBLIC_KEY];
  cachedKeys = {
    keys: fallback,
    expiresAt: now + 60 * 60 * 1000,
  };
  return [...fallback];
}

export class TassyirClient {
  private readonly baseUrl: string;
  private readonly credentials: TassyirCredentials;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: TassyirCredentialsInput, fetchFn?: typeof fetch) {
    this.credentials = TassyirCredentialsSchema.parse(credentials);
    this.baseUrl = (this.credentials.baseUrl || "https://api.tassyir.io/apps/2026-10").replace(/\/+$/, "");
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
  }

  /**
   * Returns root apps URL, stripping version suffix (e.g. /2026-10)
   */
  private getAppsBaseUrl(): string {
    return this.baseUrl.replace(/\/(?:20\d\d-\d\d|v\d+)\/?$/, "");
  }

  /**
   * Returns current credentials
   */
  getCredentials(): TassyirCredentials {
    return { ...this.credentials };
  }

  /**
   * Redeems an install code (?code=tsy_ic_...) for access & refresh tokens
   * via POST https://api.tassyir.io/apps/oauth/token with HTTP Basic Auth.
   *
   * NEVER puts client_secret in the body (Tassyir rejects that with invalid_client).
   */
  async redeemInstallCode(
    arg1?: string,
    arg2?: string,
    arg3?: string
  ): Promise<TassyirOAuthTokenResponse> {
    let clientId: string;
    let clientSecret: string;
    let code: string;

    if (arg2 !== undefined && arg3 !== undefined) {
      clientId = arg1 || "";
      clientSecret = arg2 || "";
      code = arg3 || "";
    } else if (arg1 !== undefined) {
      clientId = this.credentials.clientId || "";
      clientSecret = this.credentials.clientSecret || "";
      code = arg1;
    } else {
      throw new Error("Tassyir install code is required");
    }

    if (!clientId || !clientSecret) {
      throw new Error("Tassyir clientId and clientSecret are required to redeem install code");
    }
    if (!code) {
      throw new Error("Tassyir install code is required");
    }

    const appsUrl = this.getAppsBaseUrl();
    const url = `${appsUrl}/oauth/token`;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code.trim(),
    }).toString();

    const res = await this.getFetch()(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      const errDetails = typeof data === "object" ? JSON.stringify(data) : String(data);
      throw new Error(`Failed to redeem Tassyir install code (HTTP ${res.status}): ${errDetails}`);
    }

    const parsed = TassyirOAuthTokenResponseSchema.parse(data);
    this.credentials.accessToken = parsed.access_token;
    if (parsed.refresh_token) {
      this.credentials.refreshToken = parsed.refresh_token;
    }
    return parsed;
  }

  /**
   * Refreshes an expired access token using a refresh token (tsy_rt_...)
   * via POST https://api.tassyir.io/apps/oauth/token with HTTP Basic Auth.
   */
  async refreshAccessToken(
    arg1?: string,
    arg2?: string,
    arg3?: string
  ): Promise<TassyirOAuthTokenResponse> {
    let clientId: string;
    let clientSecret: string;
    let refreshToken: string;

    if (arg2 !== undefined && arg3 !== undefined) {
      clientId = arg1 || "";
      clientSecret = arg2 || "";
      refreshToken = arg3 || "";
    } else if (arg1 !== undefined) {
      clientId = this.credentials.clientId || "";
      clientSecret = this.credentials.clientSecret || "";
      refreshToken = arg1;
    } else {
      clientId = this.credentials.clientId || "";
      clientSecret = this.credentials.clientSecret || "";
      refreshToken = this.credentials.refreshToken || "";
    }

    if (!clientId || !clientSecret) {
      throw new Error("Tassyir clientId and clientSecret are required to refresh access token");
    }
    if (!refreshToken) {
      throw new Error("Tassyir refreshToken is required to refresh access token");
    }

    const appsUrl = this.getAppsBaseUrl();
    const url = `${appsUrl}/oauth/token`;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken.trim(),
    }).toString();

    const res = await this.getFetch()(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      const errDetails = typeof data === "object" ? JSON.stringify(data) : String(data);
      throw new Error(`Failed to refresh Tassyir access token (HTTP ${res.status}): ${errDetails}`);
    }

    const parsed = TassyirOAuthTokenResponseSchema.parse(data);
    this.credentials.accessToken = parsed.access_token;
    if (parsed.refresh_token) {
      this.credentials.refreshToken = parsed.refresh_token;
    }
    return parsed;
  }

  /**
   * Updates an order on Tassyir Admin API via PATCH /orders/{orderId}
   */
  async updateOrder(
    orderId: string,
    payload: TassyirOrderPatchPayload
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}`;
    return this.request(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Confirms an order on Tassyir Admin API via POST /orders/{orderId}/confirm
   */
  async confirmOrder(
    orderId: string,
    idempotencyKey?: string
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}/confirm`;
    const key = idempotencyKey || `akadli-confirm-${orderId}`;
    return this.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify({}),
    });
  }

  /**
   * Cancels an order on Tassyir Admin API via POST /orders/{orderId}/cancel
   */
  async cancelOrder(
    orderId: string,
    payload: TassyirOrderCancelPayload,
    idempotencyKey?: string
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}/cancel`;
    const key = idempotencyKey || `akadli-cancel-${orderId}`;
    return this.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Dispatches an order to the courier expedition queue via POST /orders/{orderId}/dispatch (legacy)
   */
  async dispatchOrder(
    orderId: string,
    payload: TassyirDispatchPayload
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}/dispatch`;
    return this.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Fetches product details and variants from Tassyir Admin API via GET /products/{productId}.
   * Returns null if product does not exist, app lacks read_products scope, or request fails.
   */
  async getProduct(productId: string | number): Promise<TassyirProduct | null> {
    const url = `${this.baseUrl}/products/${encodeURIComponent(String(productId))}`;
    try {
      const res = await this.request(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (res.success && res.rawResponse) {
        return TassyirProductSchema.parse(res.rawResponse);
      }
    } catch {
      return null;
    }
    return null;
  }

  private async request(
    url: string,
    init: RequestInit,
    retries = 3
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    // If accessToken/apiKey missing but OAuth refresh info is present, auto-refresh once before request
    if (!this.credentials.accessToken && !this.credentials.apiKey) {
      if (
        this.credentials.clientId &&
        this.credentials.clientSecret &&
        this.credentials.refreshToken
      ) {
        try {
          await this.refreshAccessToken();
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          return {
            success: false,
            externalStatus: "UNAUTHORIZED",
            rawResponse: { error: `Failed to refresh Tassyir access token: ${errorMessage}` },
          };
        }
      }
    }

    let refreshedOn401 = false;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const token = this.credentials.accessToken || this.credentials.apiKey || "";

      const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      };

      if (this.credentials.apiKey) {
        headers["X-Tassyir-Api-Key"] = this.credentials.apiKey;
      }

      try {
        const res = await this.getFetch()(url, { ...init, headers });
        const text = await res.text();
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text;
        }

        if (res.status === 401 || res.status === 403) {
          if (
            res.status === 401 &&
            !refreshedOn401 &&
            this.credentials.clientId &&
            this.credentials.clientSecret &&
            this.credentials.refreshToken
          ) {
            refreshedOn401 = true;
            try {
              await this.refreshAccessToken();
              continue;
            } catch {
              // fall through to return UNAUTHORIZED
            }
          }
          return {
            success: false,
            externalStatus: "UNAUTHORIZED",
            rawResponse: parsedBody,
          };
        }

        if (res.status === 404) {
          return {
            success: false,
            externalStatus: "NOT_FOUND",
            rawResponse: parsedBody,
          };
        }

        if (res.status === 422) {
          return {
            success: false,
            externalStatus: "UNPROCESSABLE_ENTITY",
            rawResponse: parsedBody,
          };
        }

        if (res.status === 429) {
          const isBusiness =
            typeof parsedBody === "object" &&
            parsedBody !== null &&
            ((parsedBody as Record<string, unknown>).code === "BUSINESS_RATE_LIMITED" ||
              (parsedBody as Record<string, unknown>).error === "BUSINESS_RATE_LIMITED");

          if (attempt < retries) {
            const retryAfterSec = Number(res.headers.get("Retry-After")) || 1;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.min(retryAfterSec * 1000, 2000))
            );
            continue;
          }

          return {
            success: false,
            externalStatus: isBusiness ? "BUSINESS_RATE_LIMITED" : "RATE_LIMITED",
            rawResponse: parsedBody,
          };
        }

        if (res.status === 503) {
          if (attempt < retries) {
            const retryAfterSec = Number(res.headers.get("Retry-After")) || 1;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.min(retryAfterSec * 1000, 2000))
            );
            continue;
          }

          return {
            success: false,
            externalStatus: "API_BUSY",
            rawResponse: parsedBody,
          };
        }

        if (!res.ok) {
          if (res.status >= 500 && attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 300));
            continue;
          }

          return {
            success: false,
            externalStatus: `HTTP_${res.status}`,
            rawResponse: parsedBody,
          };
        }

        return {
          success: true,
          externalStatus: "OK",
          rawResponse: parsedBody,
        };
      } catch (err: unknown) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
          continue;
        }

        const errorMessage = err instanceof Error ? err.message : String(err);
        const isAuthError =
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.includes("401");
        return {
          success: false,
          externalStatus: isAuthError ? "UNAUTHORIZED" : "NETWORK_ERROR",
          rawResponse: { error: errorMessage },
        };
      }
    }

    return {
      success: false,
      externalStatus: "MAX_RETRIES_EXCEEDED",
      rawResponse: { error: "Failed after maximum retries" },
    };
  }
}
