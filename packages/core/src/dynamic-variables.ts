import { StandardizedDzOrder } from "@akadli/adapter-contract";
import { normalizeDzPhone } from "@akadli/dz-geo";

export interface ElevenAgentsDynamicVariables {
  order_id: string;
  store_name: string;
  customer_name: string;
  customer_phone_e164: string;
  item_name: string;
  price_da: string;
  current_variant: string;
  current_wilaya: string;
  current_commune: string;
  current_address_note: string;
  allowed_variants: string;
  allowed_wilayas: string;
  allowed_communes: string;
  [key: string]: string;
}

/**
 * Builds ElevenAgents Conversational AI dynamic variables from a canonical StandardizedDzOrder.
 * Converts customerPhone to E.164 (+213...) for outbound telephony, formats price_da as an integer string,
 * and serializes constraints into comma-separated strings for prompt injection.
 */
export function buildElevenAgentsDynamicVariables(
  order: StandardizedDzOrder
): ElevenAgentsDynamicVariables {
  const phoneE164 = normalizeDzPhone(order.customerPhone, "e164");
  return {
    order_id: order.orderId,
    store_name: order.storeName,
    customer_name: order.customerName,
    customer_phone_e164: phoneE164,
    item_name: order.itemName,
    price_da: String(Math.round(order.priceDa)),
    current_variant: order.currentVariant,
    current_wilaya: order.currentWilaya,
    current_commune: order.currentCommune,
    current_address_note: order.currentAddressNote || "",
    allowed_variants: order.constraints.allowedVariants.join(", "),
    allowed_wilayas: order.constraints.allowedWilayas.join(", "),
    allowed_communes: order.constraints.allowedCommunes.join(", ")
  };
}
