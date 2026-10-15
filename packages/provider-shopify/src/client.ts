import { ShopifyCredentials } from "./schemas.js";

export class ShopifyClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly customFetch?: typeof fetch;

  constructor(credentials: ShopifyCredentials, fetchFn?: typeof fetch) {
    const rawDomain = credentials.shopDomain
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    const apiVersion = credentials.apiVersion || "2024-04";
    this.baseUrl = `https://${rawDomain}/admin/api/${apiVersion}`;
    this.accessToken = credentials.accessToken;
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
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
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken
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
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken
      },
      body: JSON.stringify(cancelOptions)
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
