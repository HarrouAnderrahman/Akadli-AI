import { z } from "zod";

export const ShopifyNoteAttributeSchema = z.object({
  name: z.string(),
  value: z.string().nullable().optional()
});

export const ShopifyLineItemSchema = z.object({
  id: z.number().or(z.string()),
  title: z.string().default("Article"),
  variant_title: z.string().nullable().optional(),
  quantity: z.number().default(1),
  price: z.string().or(z.number()).default(0),
  sku: z.string().nullable().optional()
});

export const ShopifyAddressSchema = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  province_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  address1: z.string().nullable().optional(),
  address2: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  country_code: z.string().nullable().optional()
});

export const ShopifyCustomerSchema = z.object({
  id: z.number().or(z.string()).optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional()
});

export const ShopifyOrderWebhookPayloadSchema = z.object({
  id: z.number().or(z.string()),
  name: z.string().optional(),
  shop_name: z.string().optional(),
  store_name: z.string().optional(),
  currency: z.string().default("DZD"),
  total_price: z.string().or(z.number()).default(0),
  line_items: z.array(ShopifyLineItemSchema).default([]),
  shipping_address: ShopifyAddressSchema.nullable().optional(),
  billing_address: ShopifyAddressSchema.nullable().optional(),
  customer: ShopifyCustomerSchema.nullable().optional(),
  note_attributes: z.array(ShopifyNoteAttributeSchema).default([])
});

export type ShopifyOrderWebhookPayload = z.infer<
  typeof ShopifyOrderWebhookPayloadSchema
>;

export const ShopifyCredentialsSchema = z
  .object({
    shopDomain: z.string().min(1, "shopDomain is required"),
    accessToken: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    apiVersion: z.string().default("2024-04"),
    cancelOnRefused: z.string().default("true")
  })
  .superRefine((creds, ctx) => {
    const hasAccessToken = Boolean(creds.accessToken && creds.accessToken.trim());
    const hasClientCredentials = Boolean(
      creds.clientId &&
        creds.clientId.trim() &&
        creds.clientSecret &&
        creds.clientSecret.trim()
    );

    if (!hasAccessToken && !hasClientCredentials) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Must provide either accessToken or both clientId and clientSecret."
      });
    }
  });

export type ShopifyCredentials = z.infer<typeof ShopifyCredentialsSchema>;
