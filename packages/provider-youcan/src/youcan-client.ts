import { YouCanCredentials } from "./schemas.js";

export interface YouCanUpdateOrderPayload {
  tags?: string[];
  notes?: string;
  shipping?: {
    address?: Record<string, unknown>;
  };
}

export interface YouCanClientResult {
  success: boolean;
  externalStatus: string;
  rawResponse: unknown;
}

export class YouCanClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: YouCanCredentials, fetchFn?: typeof fetch) {
    const rawBaseUrl = credentials.baseUrl || "https://api.youcan.shop";
    this.baseUrl = rawBaseUrl.replace(/\/+$/, "");
    this.accessToken = credentials.accessToken;
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
  }

  /**
   * Updates order tags, notes, or shipping address on YouCan via PUT /orders/{orderId}.
   */
  async updateOrder(
    orderId: string,
    payload: YouCanUpdateOrderPayload
  ): Promise<YouCanClientResult> {
    const url = `${this.baseUrl}/orders/${orderId}`;
    return this.request(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Updates order general status on YouCan via PUT /orders/{orderId}/status.
   * Supported slugs: "open", "closed", "processed", "canceled-by-seller", or custom status slug.
   */
  async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<YouCanClientResult> {
    const url = `${this.baseUrl}/orders/${orderId}/status`;
    return this.request(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ status })
    });
  }

  /**
   * Closes an order on YouCan via PUT /orders/{orderId}/close.
   */
  async closeOrder(
    orderId: string,
    cancelOrder = true
  ): Promise<YouCanClientResult> {
    const url = `${this.baseUrl}/orders/${orderId}/close`;
    return this.request(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ cancel_order: cancelOrder })
    });
  }

  private async request(
    url: string,
    init: RequestInit,
    retries = 3
  ): Promise<YouCanClientResult> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await this.getFetch()(url, init);
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

        if (res.status === 422) {
          return {
            success: false,
            externalStatus: "UNPROCESSABLE_ENTITY",
            rawResponse: parsedBody
          };
        }

        if (res.status === 429) {
          if (attempt < retries) {
            const retryAfterSec = Number(res.headers.get("Retry-After")) || 1;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.min(retryAfterSec * 1000, 2000))
            );
            continue;
          }
          return {
            success: false,
            externalStatus: "RATE_LIMITED",
            rawResponse: parsedBody
          };
        }

        if (res.status >= 500) {
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
            continue;
          }
          return {
            success: false,
            externalStatus: `SERVER_ERROR_${res.status}`,
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
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
          continue;
        }
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          externalStatus: "NETWORK_ERROR",
          rawResponse: { error: errorMessage }
        };
      }
    }

    return {
      success: false,
      externalStatus: "MAX_RETRIES_EXCEEDED",
      rawResponse: { error: "Failed after maximum retries" }
    };
  }
}
