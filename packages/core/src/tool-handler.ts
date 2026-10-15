import {
  FinalizedOrderDecisionSchema,
  FinalizedOrderDecision,
  IEcommerceProvider,
  ApplyOrderDecisionResult,
  OrderConstraints
} from "@akadli/adapter-contract";
import { normalizeWilaya, normalizeCommune, getCommunesForWilaya } from "@akadli/dz-geo";

export interface FinalizeOrderToolResult {
  success: boolean;
  message: string;
  externalStatus?: string;
  decision?: FinalizedOrderDecision;
  error?: string;
}

/**
 * Handles the ElevenAgents `finalize_order_decision` tool call.
 * Validates the raw payload against FinalizedOrderDecisionSchema,
 * verifies allowed Wilaya/Commune/Size constraints when status is MODIFIED,
 * and calls the underlying IEcommerceProvider to persist the decision.
 */
export async function handleFinalizeOrderToolCall(
  rawToolPayload: unknown,
  provider: IEcommerceProvider,
  credentials: Record<string, string>,
  constraints?: OrderConstraints
): Promise<FinalizeOrderToolResult> {
  // 1. Validate payload against schema
  const parseResult = FinalizedOrderDecisionSchema.safeParse(rawToolPayload);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join("; ");
    return {
      success: false,
      message: `Invalid finalize_order_decision payload: ${errorMsg}`,
      error: errorMsg
    };
  }

  const decision = parseResult.data;

  // 2. If status is MODIFIED, verify constraints
  if (decision.status === "MODIFIED") {
    if (decision.finalSize && constraints && !constraints.allowedSizes.includes(decision.finalSize)) {
      return {
        success: false,
        message: `Size "${decision.finalSize}" is not in the allowed sizes: ${constraints.allowedSizes.join(", ")}`,
        decision,
        error: "INVALID_SIZE_CONSTRAINT"
      };
    }

    if (decision.finalWilaya) {
      if (constraints && !constraints.allowedWilayas.includes(decision.finalWilaya)) {
        return {
          success: false,
          message: `Wilaya "${decision.finalWilaya}" is not in the allowed Wilayas: ${constraints.allowedWilayas.join(", ")}`,
          decision,
          error: "INVALID_WILAYA_CONSTRAINT"
        };
      }
    }

    if (decision.finalCommune) {
      const targetWilaya = decision.finalWilaya || constraints?.allowedWilayas[0];
      if (targetWilaya) {
        const allowedCommunes = getCommunesForWilaya(targetWilaya);
        const matchResult = normalizeCommune(decision.finalCommune, targetWilaya);
        if (matchResult.matched) {
          // Normalize to canonical spelling
          decision.finalCommune = matchResult.canonicalCommune;
        } else if (constraints && !constraints.allowedCommunes.includes(decision.finalCommune)) {
          return {
            success: false,
            message: `Commune "${decision.finalCommune}" could not be verified for Wilaya ${targetWilaya}.`,
            decision,
            error: "INVALID_COMMUNE_CONSTRAINT"
          };
        }
      }
    }
  }

  // 3. Persist decision via provider
  try {
    const providerResult: ApplyOrderDecisionResult = await provider.applyOrderDecision(
      decision.orderId,
      decision,
      credentials
    );

    return {
      success: providerResult.success,
      externalStatus: providerResult.externalStatus,
      decision,
      message: `Order ${decision.orderId} successfully updated with status ${decision.status}.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to persist order decision: ${err?.message || String(err)}`,
      decision,
      error: err?.message || String(err)
    };
  }
}
