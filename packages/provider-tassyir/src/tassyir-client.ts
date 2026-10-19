import {
  TassyirCredentials,
  TassyirOrderUpdatePayload,
  TassyirDispatchPayload,
} from "./schemas.js";

export class TassyirClient {
  private readonly baseUrl: string;
  private readonly credentials: TassyirCredentials;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: TassyirCredentials, fetchFn?: typeof fetch) {
    this.credentials = credentials;
    this.baseUrl = (credentials.baseUrl || "https://api.tassyir.dz/v1").replace(/\/+$/, "");
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
  }

  /**
   * Updates an order on Tassyir ERP via PATCH /orders/{orderId}
   */
  async updateOrder(
    orderId: string,
    payload: TassyirOrderUpdatePayload
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
   * Dispatches an order to the courier expedition queue via POST /orders/{orderId}/dispatch
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
    init: RequestInit
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    try {
      const headers = {
        ...init.headers,
        Authorization: `Bearer ${this.credentials.apiKey}`,
        "X-Tassyir-Api-Key": this.credentials.apiKey,
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
        return {
          success: false,
          externalStatus: "RATE_LIMITED",
          rawResponse: parsedBody,
        };
      }

      if (!res.ok) {
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
}
