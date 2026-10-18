import { WooCommerceCredentials } from "./schemas.js";

export class WooCommerceClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: WooCommerceCredentials, fetchFn?: typeof fetch) {
    const rawUrl = credentials.siteUrl.replace(/\/+$/, "");
    this.baseUrl = rawUrl.includes("/wp-json/wc/v3")
      ? rawUrl
      : `${rawUrl}/wp-json/wc/v3`;
    this.authHeader = `Basic ${Buffer.from(
      `${credentials.consumerKey}:${credentials.consumerSecret}`
    ).toString("base64")}`;
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
  }

  /**
   * Updates order data via PUT /wp-json/wc/v3/orders/{orderId}
   */
  async updateOrder(
    orderId: string,
    orderData: Record<string, unknown>
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${orderId}`;
    return this.request(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader
      },
      body: JSON.stringify(orderData)
    });
  }

  /**
   * Appends an internal note via POST /wp-json/wc/v3/orders/{orderId}/notes
   */
  async createOrderNote(
    orderId: string,
    noteData: { note: string; customer_note?: boolean }
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
    const url = `${this.baseUrl}/orders/${orderId}/notes`;
    return this.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader
      },
      body: JSON.stringify({
        customer_note: false,
        ...noteData
      })
    });
  }

  private async request(
    url: string,
    init: RequestInit
  ): Promise<{ success: boolean; externalStatus: string; rawResponse: unknown }> {
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
      return {
        success: false,
        externalStatus: "NETWORK_ERROR",
        rawResponse: { error: errorMessage }
      };
    }
  }
}
