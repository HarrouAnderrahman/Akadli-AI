import { z } from "zod";

export const TassyirBuyerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  provinceCode: z.union([z.number(), z.string()]).optional(),
  townOns: z.string().optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
});

export type TassyirBuyer = z.infer<typeof TassyirBuyerSchema>;

export const TassyirItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  variantTitle: z.string().optional(),
  variant: z.string().optional(),
  options: z.array(z.string()).optional(),
  size: z.string().optional(),
  quantity: z.number().optional(),
  price: z.union([z.number(), z.string()]).optional(),
});

export type TassyirItem = z.infer<typeof TassyirItemSchema>;

export const TassyirCustomerSchema = z.object({
  full_name: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  wilaya: z.union([z.string(), z.number()]).optional(),
  commune: z.string().optional(),
  address: z.string().optional(),
});

export const TassyirShippingAddressSchema = z.object({
  phone: z.string().optional(),
  wilaya: z.union([z.string(), z.number()]).optional(),
  province: z.union([z.string(), z.number()]).optional(),
  commune: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

export const TassyirOrderSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  order_id: z.union([z.string(), z.number()]).optional(),
  tracking_id: z.string().optional(),
  store_name: z.string().optional(),
  product_name: z.string().optional(),
  size: z.string().optional(),
  total: z.union([z.number(), z.string()]).optional(),
  total_price: z.union([z.number(), z.string()]).optional(),
  cod_amount: z.union([z.number(), z.string()]).optional(),
  waiting: z.boolean().optional(),
  buyer: TassyirBuyerSchema.optional(),
  customer: TassyirCustomerSchema.optional(),
  shipping_address: TassyirShippingAddressSchema.optional(),
  delivery: z
    .object({
      method: z.string().optional(),
    })
    .optional(),
  items: z.array(TassyirItemSchema).optional(),
  client_name: z.string().optional(),
  client_phone: z.string().optional(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  customer_phone: z.string().optional(),
  wilaya: z.union([z.string(), z.number()]).optional(),
  wilaya_code: z.union([z.string(), z.number()]).optional(),
  wilaya_id: z.union([z.string(), z.number()]).optional(),
  commune: z.string().optional(),
  commune_name: z.string().optional(),
  address: z.string().optional(),
  stop_desk: z.union([z.boolean(), z.string()]).optional(),
  delivery_note: z.string().optional(),
  confirmation_status: z.string().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
});

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

export const TassyirCredentialsSchema = z
  .object({
    accessToken: z.string().optional(),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional().default("https://api.tassyir.io/apps/2026-10"),
    confirmOnModified: z.string().optional().default("true"),
    dispatchOnConfirm: z.string().optional().default("true"),
    cancelOnRefused: z.string().optional().default("true"),
  })
  .refine((data) => Boolean((data.accessToken && data.accessToken.trim().length > 0) || (data.apiKey && data.apiKey.trim().length > 0)), {
    message: "Tassyir accessToken or apiKey is required",
    path: ["accessToken"],
  });

export type TassyirCredentials = z.infer<typeof TassyirCredentialsSchema>;

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
