import { z } from "zod";

export const YouCanCredentialsSchema = z.object({
  accessToken: z.string().min(1, "YouCan access token is required."),
  baseUrl: z
    .string()
    .url()
    .default("https://api.youcan.shop")
    .optional(),
  closeOnRefused: z.string().default("true").optional()
});

export type YouCanCredentials = z.infer<typeof YouCanCredentialsSchema>;

export const YouCanOrderWebhookPayloadSchema = z
  .object({
    id: z.union([z.string(), z.number()], {
      required_error: "Order id is required in YouCan webhook payload."
    }),
    store_name: z.string().nullish(),
    shop_name: z.string().nullish(),
    total: z.union([z.string(), z.number()]).nullish(),
    currency: z.string().nullish(),
    status: z.union([z.string(), z.number()]).nullish(),
    created_at: z.string().nullish(),
    customer: z
      .object({
        id: z.union([z.string(), z.number()]).nullish(),
        first_name: z.string().nullish(),
        last_name: z.string().nullish(),
        email: z.string().nullish(),
        phone: z.string().nullish()
      })
      .nullish(),
    shipping: z
      .object({
        address: z
          .object({
            first_name: z.string().nullish(),
            last_name: z.string().nullish(),
            phone: z.string().nullish(),
            region: z.string().nullish(),
            state: z.string().nullish(),
            city: z.string().nullish(),
            first_line: z.string().nullish(),
            second_line: z.string().nullish(),
            country: z.string().nullish()
          })
          .nullish()
      })
      .nullish(),
    variants: z
      .array(
        z.object({
          id: z.union([z.string(), z.number()]).nullish(),
          item: z
            .object({
              id: z.union([z.string(), z.number()]).nullish(),
              name: z.string().nullish()
            })
            .nullish(),
          variation: z
            .object({
              size: z.string().nullish(),
              color: z.string().nullish()
            })
            .passthrough()
            .nullish(),
          title: z.string().nullish(),
          quantity: z.number().nullish(),
          price: z.union([z.string(), z.number()]).nullish()
        })
      )
      .nullish()
      .default([]),
    line_items: z
      .array(
        z.object({
          id: z.union([z.string(), z.number()]).nullish(),
          title: z.string().nullish(),
          variant_title: z.string().nullish(),
          quantity: z.number().nullish(),
          price: z.union([z.string(), z.number()]).nullish()
        })
      )
      .nullish()
      .default([]),
    extra_fields: z
      .union([z.array(z.record(z.any())), z.record(z.any())])
      .nullish(),
    custom_fields: z
      .union([z.array(z.record(z.any())), z.record(z.any())])
      .nullish(),
    tags: z.union([z.array(z.string()), z.string()]).nullish(),
    notes: z.string().nullish()
  })
  .passthrough();

export type YouCanOrderWebhookPayload = z.infer<
  typeof YouCanOrderWebhookPayloadSchema
>;
