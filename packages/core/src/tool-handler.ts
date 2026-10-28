import {
  FinalizedOrderDecisionSchema,
  FinalizedOrderDecision,
  IEcommerceProvider,
  ApplyOrderDecisionResult,
  OrderConstraints,
  StandardizedDzOrder
} from "@akadli/adapter-contract";
import {
  normalizeWilaya,
  normalizeCommune,
  resolveCommuneForWilaya,
  getAllCommunes
} from "@akadli/dz-geo";

export interface FinalizeOrderToolResult {
  success: boolean;
  message: string;
  externalStatus?: string;
  rawResponse?: unknown;
  decision?: FinalizedOrderDecision;
  error?: string;
}

function normalizeRawToolPayload(
  raw: any,
  order?: Partial<Pick<StandardizedDzOrder, "quantity">>
): unknown {
  if (!raw || typeof raw !== "object") return raw;

  let finalWilaya = raw.finalWilaya ?? raw.final_wilaya;
  if (finalWilaya) {
    try {
      finalWilaya = normalizeWilaya(finalWilaya).code;
    } catch {
      // Keep as-is if unparseable to let schema validation handle it
    }
  }

  // Support finalVariant, final_variant, and backwards-compatible legacy fallback
  const legacyFinalSize = (raw as Record<string, unknown>)["final" + "Size"] ?? (raw as Record<string, unknown>)["final_size"];
  const finalVariant = raw.finalVariant ?? raw.final_variant ?? legacyFinalSize;

  const rawQuantity =
    raw.finalQuantity ??
    raw.final_quantity ??
    raw.quantity ??
    raw.order?.quantity ??
    order?.quantity ??
    1;
  const parsedQuantity = Number(rawQuantity);
  const finalQuantity =
    Number.isFinite(parsedQuantity) && Math.round(parsedQuantity) >= 1
      ? Math.round(parsedQuantity)
      : 1;

  return {
    orderId: raw.orderId ?? raw.order_id,
    status: raw.status,
    finalQuantity,
    finalVariant,
    finalWilaya,
    finalCommune: raw.finalCommune ?? raw.final_commune,
    finalAddressNote: raw.finalAddressNote ?? raw.final_address_note,
    reasonOrNotes: raw.reasonOrNotes ?? raw.reason_or_notes ?? ""
  };
}

/**
 * Handles the ElevenAgents `finalize_order_decision` tool call.
 * Validates the raw payload against FinalizedOrderDecisionSchema,
 * verifies allowed Wilaya/Commune/Variant constraints when status is MODIFIED,
 * and calls the underlying IEcommerceProvider to persist the decision.
 */
export async function handleFinalizeOrderToolCall(
  rawToolPayload: unknown,
  provider: IEcommerceProvider,
  credentials: Record<string, string>,
  constraints?: OrderConstraints,
  order?: Partial<Pick<StandardizedDzOrder, "quantity" | "currentWilaya">>
): Promise<FinalizeOrderToolResult> {
  // 1. Normalize and validate payload against schema
  const normalized = normalizeRawToolPayload(rawToolPayload, order);
  const parseResult = FinalizedOrderDecisionSchema.safeParse(normalized);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e: { path: (string | number)[]; message: string }) => e.message).join("; ");
    return {
      success: false,
      message: `Invalid finalize_order_decision payload: ${errorMsg}`,
      error: errorMsg
    };
  }

  const decision = parseResult.data;

  // 2. If status is MODIFIED, verify constraints
  if (decision.status === "MODIFIED") {
    if (decision.finalVariant && constraints && !constraints.allowedVariants.includes(decision.finalVariant)) {
      return {
        success: false,
        message: `Variant "${decision.finalVariant}" is not in the allowed variants: ${constraints.allowedVariants.join(", ")}`,
        decision,
        error: "INVALID_VARIANT_CONSTRAINT"
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
      const explicitWilaya =
        decision.finalWilaya ||
        order?.currentWilaya ||
        (constraints?.allowedWilayas.length === 1 ? constraints.allowedWilayas[0] : undefined);

      if (explicitWilaya) {
        const matchResult = normalizeCommune(decision.finalCommune, explicitWilaya);
        if (matchResult.matched) {
          decision.finalCommune = matchResult.canonicalCommune;
        } else if (!decision.finalWilaya && constraints?.allowedCommunes?.length) {
          const fallbackMatch = resolveCommuneForWilaya(
            decision.finalCommune,
            constraints.allowedCommunes
          );
          if (fallbackMatch.matched) {
            decision.finalCommune = fallbackMatch.canonicalCommune;
          } else if (!constraints.allowedCommunes.includes(decision.finalCommune)) {
            return {
              success: false,
              message: `Commune "${decision.finalCommune}" could not be verified for Wilaya ${explicitWilaya}.`,
              decision,
              error: "INVALID_COMMUNE_CONSTRAINT"
            };
          }
        } else if (constraints && !constraints.allowedCommunes.includes(decision.finalCommune)) {
          return {
            success: false,
            message: `Commune "${decision.finalCommune}" could not be verified for Wilaya ${explicitWilaya}.`,
            decision,
            error: "INVALID_COMMUNE_CONSTRAINT"
          };
        }
      } else {
        const candidatePool =
          constraints?.allowedCommunes && constraints.allowedCommunes.length > 0
            ? constraints.allowedCommunes
            : getAllCommunes();
        const matchResult = resolveCommuneForWilaya(decision.finalCommune, candidatePool);
        if (matchResult.matched) {
          decision.finalCommune = matchResult.canonicalCommune;
        } else if (constraints && !constraints.allowedCommunes.includes(decision.finalCommune)) {
          return {
            success: false,
            message: `Commune "${decision.finalCommune}" could not be verified in allowed communes.`,
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
      rawResponse: providerResult.rawResponse,
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
