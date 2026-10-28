import {
  StandardizedDzOrder,
  StandardizedDzOrderSchema,
  WILAYA_CODES,
  WilayaCode,
  OrderConstraints
} from "@akadli/adapter-contract";
import {
  normalizeDzPhone,
  normalizeWilaya,
  normalizeCommune,
  getCommunesForWilaya
} from "@akadli/dz-geo";

export interface CreateDzOrderParams {
  orderId: string;
  storeName: string;
  customerName: string;
  rawCustomerPhone: string;
  itemName: string;
  quantity?: number;
  shippingFeeDa?: number;
  priceDa: number;
  currentVariant: string;
  rawWilaya: string | number;
  rawCommune: string;
  currentAddressNote?: string;
  allowedVariants?: string[];
  allowedWilayas?: WilayaCode[];
  allowedCommunes?: string[];
}

export type CreateStandardizedDzOrderInput = CreateDzOrderParams;

/**
 * Creates and validates a canonical StandardizedDzOrder using @akadli/dz-geo
 * to normalize the customer phone, Wilaya code, and commune, while populating
 * the allowed commune constraints scoped to the order's Wilaya.
 */
export function createStandardizedDzOrder(params: CreateDzOrderParams): StandardizedDzOrder {
  // 1. Normalize phone to local 10-digit standard
  const customerPhone = normalizeDzPhone(params.rawCustomerPhone, "local");

  // 2. Normalize Wilaya to 2-digit zero-padded code ("01" to "69")
  const normWilaya = normalizeWilaya(params.rawWilaya);
  const currentWilaya = normWilaya.code;

  // 3. Resolve commune within the Wilaya
  const normCommune = normalizeCommune(params.rawCommune, currentWilaya);
  const currentCommune = normCommune.canonicalCommune;

  // 4. Derive constraints if not explicitly provided (default to all 69 Wilayas & 1,708 Communes)
  const allowedVariants = params.allowedVariants && params.allowedVariants.length > 0
    ? params.allowedVariants
    : [params.currentVariant];

  const allowedWilayas = params.allowedWilayas && params.allowedWilayas.length > 0
    ? params.allowedWilayas
    : [...WILAYA_CODES];

  const allowedCommunes = params.allowedCommunes && params.allowedCommunes.length > 0
    ? params.allowedCommunes
    : [
        ...getCommunesForWilaya(currentWilaya),
        ...WILAYA_CODES.filter((code) => code !== currentWilaya).flatMap((code) =>
          getCommunesForWilaya(code)
        )
      ];

  const constraints: OrderConstraints = {
    allowedVariants,
    allowedWilayas,
    allowedCommunes: allowedCommunes.length > 0 ? allowedCommunes : [currentCommune]
  };

  const parsedQuantity = Number(params.quantity);
  const quantity =
    Number.isFinite(parsedQuantity) && Math.round(parsedQuantity) >= 1
      ? Math.round(parsedQuantity)
      : 1;

  const parsedShippingFee = Number(params.shippingFeeDa);
  const shippingFeeDa =
    Number.isFinite(parsedShippingFee) && Math.round(parsedShippingFee) >= 0
      ? Math.round(parsedShippingFee)
      : 0;

  const rawOrder = {
    orderId: params.orderId,
    storeName: params.storeName,
    customerName: params.customerName,
    customerPhone,
    itemName: params.itemName,
    quantity,
    shippingFeeDa,
    priceDa: Math.round(params.priceDa),
    currentVariant: params.currentVariant,
    currentWilaya,
    currentCommune,
    currentAddressNote: params.currentAddressNote || "",
    constraints
  };

  return StandardizedDzOrderSchema.parse(rawOrder);
}
