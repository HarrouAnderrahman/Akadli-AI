import { z } from "zod";

export const WooCommerceMetaItemSchema = z.object({
  id: z.number().optional(),
  key: z.string(),
  value: z.any()
});

export type WooCommerceMetaItem = z.infer<typeof WooCommerceMetaItemSchema>;

export const WooCommerceAddressSchema = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  address_1: z.string().nullable().optional(),
  address_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional()
});

export type WooCommerceAddress = z.infer<typeof WooCommerceAddressSchema>;

export const WooCommerceLineItemSchema = z.object({
  id: z.number().or(z.string()).optional(),
  name: z.string().default("Article"),
  product_id: z.number().optional(),
  variation_id: z.number().optional(),
  quantity: z.number().default(1),
  subtotal: z.string().or(z.number()).optional(),
  total: z.string().or(z.number()).default(0),
  sku: z.string().nullable().optional(),
  price: z.number().or(z.string()).optional(),
  meta_data: z.array(WooCommerceMetaItemSchema).default([])
});

export type WooCommerceLineItem = z.infer<typeof WooCommerceLineItemSchema>;

export const WooCommerceShippingLineSchema = z
  .object({
    id: z.number().or(z.string()).optional(),
    method_title: z.string().nullable().optional(),
    total: z.string().or(z.number()).nullable().optional()
  })
  .passthrough();

export const WooCommerceOrderWebhookPayloadSchema = z
  .object({
    id: z.number().or(z.string()),
    number: z.string().optional(),
    order_key: z.string().optional(),
    status: z.string().optional(),
    currency: z.string().default("DZD"),
    store_name: z.string().optional(),
    total: z.string().or(z.number()).default(0),
    shipping_total: z.string().or(z.number()).nullable().optional(),
    shipping_lines: z.array(WooCommerceShippingLineSchema).default([]),
    billing: WooCommerceAddressSchema.nullable().optional(),
    shipping: WooCommerceAddressSchema.nullable().optional(),
    payment_method: z.string().optional(),
    payment_method_title: z.string().optional(),
    line_items: z.array(WooCommerceLineItemSchema).default([]),
    meta_data: z.array(WooCommerceMetaItemSchema).default([])
  })
  .passthrough();

export type WooCommerceOrderWebhookPayload = z.infer<
  typeof WooCommerceOrderWebhookPayloadSchema
>;

export const WooCommerceCredentialsSchema = z.object({
  siteUrl: z.string().min(1, "siteUrl is required"),
  consumerKey: z.string().min(1, "consumerKey is required"),
  consumerSecret: z.string().min(1, "consumerSecret is required"),
  cancelOnRefused: z.string().default("true")
});

export type WooCommerceCredentials = z.infer<
  typeof WooCommerceCredentialsSchema
>;
