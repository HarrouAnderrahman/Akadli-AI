import { z } from "zod";

export const TassyirItemSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  variant: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().optional(),
  price: z.union([z.number(), z.string()]).optional(),
});

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

export const TassyirWebhookPayloadSchema = z.object({
  event: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  order_id: z.union([z.string(), z.number()]).optional(),
  tracking_id: z.string().optional(),
  store_name: z.string().optional(),
  product_name: z.string().optional(),
  size: z.string().optional(),
  total_price: z.union([z.number(), z.string()]).optional(),
  total: z.union([z.number(), z.string()]).optional(),
  cod_amount: z.union([z.number(), z.string()]).optional(),
  customer: TassyirCustomerSchema.optional(),
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
  shipping_address: TassyirShippingAddressSchema.optional(),
  items: z.array(TassyirItemSchema).optional(),
  confirmation_status: z.string().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
});

export type TassyirWebhookPayload = z.infer<typeof TassyirWebhookPayloadSchema>;

export const TassyirCredentialsSchema = z.object({
  apiKey: z.string().min(1, "Tassyir apiKey is required"),
  baseUrl: z.string().optional().default("https://api.tassyir.dz/v1"),
  dispatchOnConfirm: z.string().optional().default("true"),
  cancelOnRefused: z.string().optional().default("true"),
});

export type TassyirCredentials = z.infer<typeof TassyirCredentialsSchema>;

export const TassyirOrderUpdatePayloadSchema = z.object({
  confirmation_status: z.enum(["confirmed", "refused", "pending"]).optional(),
  status: z.string().optional(),
  shipping_address: z
    .object({
      wilaya: z.string().optional(),
      commune: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  variant_size: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type TassyirOrderUpdatePayload = z.infer<typeof TassyirOrderUpdatePayloadSchema>;

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
