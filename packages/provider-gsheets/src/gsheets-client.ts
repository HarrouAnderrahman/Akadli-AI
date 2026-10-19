import { createHmac } from "node:crypto";
import { ApplyOrderDecisionResult } from "@akadli/adapter-contract";

export interface CellUpdate {
  column: string;
  value: string;
}

export interface BatchUpdateOptions {
  sheetName?: string;
  rowNumber: number;
  baseUrl?: string;
}

export class GSheetsClient {
  private readonly customFetch?: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.customFetch = fetchFn;
  }

  private getFetch(): typeof fetch {
    return this.customFetch ?? globalThis.fetch;
  }

  /**
   * Mode A: Updates specific cell ranges in a Google Sheet row using REST API v4 values:batchUpdate.
   */
  async updateRowValues(
    spreadsheetId: string,
    accessToken: string,
    updates: CellUpdate[],
    options: BatchUpdateOptions
  ): Promise<ApplyOrderDecisionResult> {
    const baseUrl = (options.baseUrl || "https://sheets.googleapis.com").replace(/\/+$/, "");
    const sheetName = options.sheetName || "Sheet1";
    const url = `${baseUrl}/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`;

    const data = updates.map((u) => ({
      range: `${sheetName}!${u.column}${options.rowNumber}`,
      values: [[u.value]]
    }));

    const bodyPayload = {
      valueInputOption: "USER_ENTERED",
      data
    };

    try {
      const res = await this.getFetch()(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          externalStatus: "UNAUTHORIZED",
          rawResponse: parsed
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          externalStatus: "NOT_FOUND",
          rawResponse: parsed
        };
      }

      if (res.status === 429) {
        return {
          success: false,
          externalStatus: "RATE_LIMITED",
          rawResponse: parsed
        };
      }

      if (!res.ok) {
        return {
          success: false,
          externalStatus: `HTTP_${res.status}`,
          rawResponse: parsed
        };
      }

      return {
        success: true,
        externalStatus: "UPDATED",
        rawResponse: parsed
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        externalStatus: "NETWORK_ERROR",
        rawResponse: { error: msg }
      };
    }
  }

  /**
   * Mode B: Sends post-call decision to merchant's Apps Script Webhook callback.
   */
  async sendAppsScriptCallback(
    url: string,
    payload: Record<string, unknown>,
    secret?: string
  ): Promise<ApplyOrderDecisionResult> {
    const bodyStr = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (secret && secret.trim()) {
      headers["x-akadli-secret"] = secret.trim();
      headers["x-akadli-signature"] = createHmac("sha256", secret.trim())
        .update(bodyStr)
        .digest("hex");
    }

    try {
      const res = await this.getFetch()(url, {
        method: "POST",
        headers,
        body: bodyStr
      });

      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          externalStatus: "UNAUTHORIZED",
          rawResponse: parsed
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          externalStatus: "NOT_FOUND",
          rawResponse: parsed
        };
      }

      if (!res.ok) {
        return {
          success: false,
          externalStatus: `HTTP_${res.status}`,
          rawResponse: parsed
        };
      }

      return {
        success: true,
        externalStatus: "CALLBACK_OK",
        rawResponse: parsed
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        externalStatus: "NETWORK_ERROR",
        rawResponse: { error: msg }
      };
    }
  }
}
