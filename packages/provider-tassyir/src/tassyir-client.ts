import {
  TassyirCredentials,
  TassyirOrderPatchPayload,
  TassyirOrderCancelPayload,
  TassyirDispatchPayload,
} from "./schemas.js";

export class TassyirClient {
  private readonly baseUrl: string;
  private readonly credentials: TassyirCredentials;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: TassyirCredentials, fetchFn?: typeof fetch) {
    this.credentials = credentials;
    this.baseUrl = (credentials.baseUrl || "https://api.tassyir.io/apps/2026-10").replace(/\/+$/, "");
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
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

  private async request(
    url: string,
    init: RequestInit,
    retries = 3
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const token = this.credentials.accessToken || this.credentials.apiKey || "";

    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    };

    if (this.credentials.apiKey) {
      headers["X-Tassyir-Api-Key"] = this.credentials.apiKey;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
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
