import { z } from "zod";

/**
 * Official 69 Algerian Wilaya codes ("01" through "69").
 * Zero-padded 2-digit strings are mandatory across all providers and couriers.
 */
export const WILAYA_CODES = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
  "41", "42", "43", "44", "45", "46", "47", "48", "49", "50",
  "51", "52", "53", "54", "55", "56", "57", "58", "59", "60",
  "61", "62", "63", "64", "65", "66", "67", "68", "69"
] as const;

export type WilayaCode = (typeof WILAYA_CODES)[number];

export const WilayaCodeSchema = z.enum(WILAYA_CODES, {
  errorMap: () => ({
    message: 'Wilaya code must be a zero-padded string from "01" to "69".'
  })
});

/**
 * Algerian Mobile Phone Schema:
 * Accepts either normalized local 10-digit format (05XXXXXXXX, 06XXXXXXXX, 07XXXXXXXX)
 * or international E.164 format (+2135XXXXXXXX, +2136XXXXXXXX, +2137XXXXXXXX).
 */
export const DzPhoneSchema = z
  .string()
  .regex(
    /^(?:0[567]\d{8}|\+213[567]\d{8})$/,
    "Customer phone must be normalized to Algerian 05/06/07XXXXXXXX or +213[567]XXXXXXXX format."
  );

/**
 * Dynamic guardrails passed into ElevenAgents so the LLM cannot hallucinate
 * unavailable variants, unsupported Wilayas, or invalid communes.
 */
export const OrderConstraintsSchema = z.object({
  allowedVariants: z.array(z.string().min(1)).min(1),
  allowedWilayas: z.array(WilayaCodeSchema).min(1),
  allowedCommunes: z.array(z.string().min(1)).min(1)
});

export type OrderConstraints = z.infer<typeof OrderConstraintsSchema>;

/**
 * Canonical inbound order parsed from any e-commerce webhook or sheet row.
 */
export const StandardizedDzOrderSchema = z.object({
  orderId: z.string().min(1),
  storeName: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: DzPhoneSchema,
  itemName: z.string().min(1),
  priceDa: z.number().nonnegative(),
  currentVariant: z.string().min(1),
  currentWilaya: WilayaCodeSchema,
  currentCommune: z.string().min(1),
  currentAddressNote: z.string().default(""),
  constraints: OrderConstraintsSchema
});

export type StandardizedDzOrder = z.infer<typeof StandardizedDzOrderSchema>;

/**
 * Allowed post-call order confirmation statuses from ElevenAgents.
 */
export const OrderDecisionStatusSchema = z.enum([
  "CONFIRMED",
  "REFUSED",
  "MODIFIED"
]);

export type OrderDecisionStatus = z.infer<typeof OrderDecisionStatusSchema>;

/**
 * Canonical outbound decision emitted by the ElevenAgents `finalize_order_decision`
 * server tool at the end of a customer confirmation call.
 */
export const FinalizedOrderDecisionSchema = z
  .object({
    orderId: z.string().min(1),
    status: OrderDecisionStatusSchema,
    finalVariant: z.string().min(1).optional(),
    finalWilaya: WilayaCodeSchema.optional(),
    finalCommune: z.string().min(1).optional(),
    finalAddressNote: z.string().optional(),
    reasonOrNotes: z.string().default("")
  })
  .superRefine((decision, ctx) => {
    if (decision.status === "MODIFIED") {
      const hasModification =
        decision.finalVariant !== undefined ||
        decision.finalWilaya !== undefined ||
        decision.finalCommune !== undefined ||
        decision.finalAddressNote !== undefined;
      if (!hasModification) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'When status is "MODIFIED", at least one of finalVariant, finalWilaya, finalCommune, or finalAddressNote must be provided.'
        });
      }
    }
  });

export type FinalizedOrderDecision = z.infer<
  typeof FinalizedOrderDecisionSchema
>;

/**
 * Standardized result returned by `IEcommerceProvider.applyOrderDecision`.
 */
export interface ApplyOrderDecisionResult {
  success: boolean;
  externalStatus: string;
  rawResponse?: unknown;
}

/**
 * Universal contract implemented by every provider package inside `packages/provider-<name>`.
 */
export interface IEcommerceProvider {
  /**
   * Cryptographically verifies an inbound webhook request (e.g., HMAC-SHA256 or bearer token).
   * Must use constant-time comparison (`crypto.timingSafeEqual`) and never throw on invalid signatures.
   */
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string
  ): Promise<boolean>;

  /**
   * Parses and validates an inbound provider webhook payload into a canonical `StandardizedDzOrder`.
   * Must normalize customerPhone and currentWilaya ("01"-"69") via `@akadli/dz-geo`.
   */
  parseWebhookOrder(payload: unknown): Promise<StandardizedDzOrder>;

  /**
   * Applies the customer's voice confirmation decision ("CONFIRMED" | "REFUSED" | "MODIFIED")
   * back to the e-commerce platform, COD ERP, or Google Sheet / Courier fallback bridge.
   */
  applyOrderDecision(
    orderId: string,
    decision: FinalizedOrderDecision,
    credentials: Record<string, string>
  ): Promise<ApplyOrderDecisionResult>;
}
