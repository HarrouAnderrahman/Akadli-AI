import { z } from "zod";

export const TassyirBuyerSchema = z
  .object({
    name: z.string().nullable().optional(),
    phone: z.union([z.string(), z.number()]).nullable().optional(),
    provinceCode: z.union([z.number(), z.string()]).nullable().optional(),
    townOns: z.union([z.number(), z.string()]).nullable().optional(),
    address: z.string().nullable().optional(),
    address2: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export type TassyirBuyer = z.infer<typeof TassyirBuyerSchema>;

export const TassyirItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullable().optional(),
    name: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    variantTitle: z.string().nullable().optional(),
    variant: z.string().nullable().optional(),
    options: z.array(z.string()).nullable().optional(),
    size: z.string().nullable().optional(),
    quantity: z.number().nullable().optional(),
    price: z.union([z.number(), z.string()]).nullable().optional(),
  })
  .catchall(z.unknown());

export type TassyirItem = z.infer<typeof TassyirItemSchema>;

export const TassyirCustomerSchema = z
  .object({
    full_name: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    phone: z.union([z.string(), z.number()]).nullable().optional(),
    wilaya: z.union([z.string(), z.number()]).nullable().optional(),
    commune: z.union([z.string(), z.number()]).nullable().optional(),
    address: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export const TassyirShippingAddressSchema = z
  .object({
    phone: z.union([z.string(), z.number()]).nullable().optional(),
    wilaya: z.union([z.string(), z.number()]).nullable().optional(),
    province: z.union([z.string(), z.number()]).nullable().optional(),
    commune: z.union([z.string(), z.number()]).nullable().optional(),
    city: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export const TassyirOrderSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullable().optional(),
    order_id: z.union([z.string(), z.number()]).nullable().optional(),
    orderNumber: z.union([z.string(), z.number()]).nullable().optional(),
    order_number: z.union([z.string(), z.number()]).nullable().optional(),
    tracking_id: z.string().nullable().optional(),
    store_name: z.string().nullable().optional(),
    storeId: z.union([z.string(), z.number()]).nullable().optional(),
    product_name: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    total: z.union([z.number(), z.string()]).nullable().optional(),
    total_price: z.union([z.number(), z.string()]).nullable().optional(),
    cod_amount: z.union([z.number(), z.string()]).nullable().optional(),
    waiting: z.boolean().nullable().optional(),
    buyer: TassyirBuyerSchema.nullable().optional(),
    customer: TassyirCustomerSchema.nullable().optional(),
    shipping_address: TassyirShippingAddressSchema.nullable().optional(),
    delivery: z
      .object({
        method: z.string().nullable().optional(),
      })
      .catchall(z.unknown())
      .nullable()
      .optional(),
    items: z.array(TassyirItemSchema).nullable().optional(),
    client_name: z.string().nullable().optional(),
    client_phone: z.union([z.string(), z.number()]).nullable().optional(),
    full_name: z.string().nullable().optional(),
    phone: z.union([z.string(), z.number()]).nullable().optional(),
    customer_phone: z.union([z.string(), z.number()]).nullable().optional(),
    wilaya: z.union([z.string(), z.number()]).nullable().optional(),
    wilaya_code: z.union([z.string(), z.number()]).nullable().optional(),
    wilaya_id: z.union([z.string(), z.number()]).nullable().optional(),
    commune: z.union([z.string(), z.number()]).nullable().optional(),
    commune_name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    stop_desk: z.union([z.boolean(), z.string()]).nullable().optional(),
    delivery_note: z.string().nullable().optional(),
    confirmation_status: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export type TassyirOrder = z.infer<typeof TassyirOrderSchema>;

export const TassyirWebhookPayloadSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  apiVersion: z.string().optional(),
  event: z.string().optional(),
  data: z
    .object({
      order: TassyirOrderSchema.optional(),
    })
    .optional(),
}).catchall(z.unknown());

export type TassyirWebhookPayload = z.infer<typeof TassyirWebhookPayloadSchema>;

export const TassyirOAuthTokenResponseSchema = z
  .object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    token_type: z.string().optional(),
    expires_in: z.number().optional(),
    installation_id: z.string().optional(),
    scope: z.string().optional(),
  })
  .catchall(z.unknown());

export type TassyirOAuthTokenResponse = z.infer<typeof TassyirOAuthTokenResponseSchema>;

export const TassyirCredentialsSchema = z
  .object({
    accessToken: z.string().optional(),
    apiKey: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    refreshToken: z.string().optional(),
    baseUrl: z.string().optional().default("https://api.tassyir.io/apps/2026-10"),
    confirmOnModified: z.string().optional().default("true"),
    dispatchOnConfirm: z.string().optional().default("true"),
    cancelOnRefused: z.string().optional().default("true"),
  })
  .refine(
    (data) => {
      const hasToken = Boolean(
        (data.accessToken && data.accessToken.trim().length > 0) ||
        (data.apiKey && data.apiKey.trim().length > 0)
      );
      const hasOAuthRefresh = Boolean(
        data.clientId &&
        data.clientId.trim().length > 0 &&
        data.clientSecret &&
        data.clientSecret.trim().length > 0 &&
        data.refreshToken &&
        data.refreshToken.trim().length > 0
      );
      const hasOAuthClient = Boolean(
        data.clientId &&
        data.clientId.trim().length > 0 &&
        data.clientSecret &&
        data.clientSecret.trim().length > 0
      );
      return hasToken || hasOAuthRefresh || hasOAuthClient;
    },
    {
      message:
        "Tassyir credentials require either an accessToken (tsy_at_...) or (clientId, clientSecret, and refreshToken)",
      path: ["accessToken"],
    }
  );

export type TassyirCredentials = z.infer<typeof TassyirCredentialsSchema>;
export type TassyirCredentialsInput = z.input<typeof TassyirCredentialsSchema>;

export const TassyirOrderPatchPayloadSchema = z.object({
  note: z.string().optional(),
  notes: z.string().optional(),
  buyer: z
    .object({
      provinceCode: z.number().optional(),
      address: z.string().optional(),
      townOns: z.string().optional(),
    })
    .optional(),
  confirmation_status: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variant_size: z.string().optional(),
  shipping_address: z.any().optional(),
});

export type TassyirOrderPatchPayload = z.infer<typeof TassyirOrderPatchPayloadSchema>;

export const TassyirOrderCancelPayloadSchema = z.object({
  note: z.string(),
});

export type TassyirOrderCancelPayload = z.infer<typeof TassyirOrderCancelPayloadSchema>;

// Backward compatibility alias
export const TassyirOrderUpdatePayloadSchema = TassyirOrderPatchPayloadSchema;
export type TassyirOrderUpdatePayload = TassyirOrderPatchPayload;

export const TassyirDispatchPayloadSchema = z.object({
  ready_for_expedition: z.boolean(),
  trigger_source: z.string(),
  shipping_address: z
    .object({
      wilaya: z.string().optional(),
      commune: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  variant_size: z.string().optional(),
});

export type TassyirDispatchPayload = z.infer<typeof TassyirDispatchPayloadSchema>;
