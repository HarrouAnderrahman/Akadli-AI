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

/**
 * Unwraps various YouCan webhook delivery envelopes (Resthooks, App Webhooks,
 * or direct order objects) and extracts the canonical order data.
 */
export function unwrapYouCanPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const rawObj = raw as Record<string, unknown>;

  const isPlainObject = (val: unknown): val is Record<string, unknown> =>
    Boolean(val && typeof val === "object" && !Array.isArray(val));

  // Determine if rawObj is wrapped in a YouCan Resthook or app webhook delivery envelope:
  // 1. data.order
  // 2. data
  // 3. payload.order
  // 4. payload
  // 5. order
  let orderData: Record<string, unknown> = rawObj;

  if (isPlainObject(rawObj.data)) {
    if (isPlainObject(rawObj.data.order)) {
      orderData = rawObj.data.order;
    } else {
      orderData = rawObj.data;
    }
  } else if (isPlainObject(rawObj.payload)) {
    if (isPlainObject(rawObj.payload.order)) {
      orderData = rawObj.payload.order;
    } else {
      orderData = rawObj.payload;
    }
  } else if (isPlainObject(rawObj.order)) {
    orderData = rawObj.order;
  }

  // Resolve Order ID:
  // In YouCan Resthook delivery envelopes, rawObj.id is often the delivery UUID (e.g. "8e6b019b-..."),
  // whereas the order ID or reference is inside orderData.id, orderData.order_id, or orderData.ref.
  let resolvedId: string | number | undefined;
  if (orderData.id != null) {
    resolvedId = orderData.id as string | number;
  } else if (orderData.order_id != null) {
    resolvedId = orderData.order_id as string | number;
  } else if (orderData.ref != null) {
    resolvedId = orderData.ref as string | number;
  } else if (orderData === rawObj && rawObj.id != null) {
    resolvedId = rawObj.id as string | number;
  }

  // Preserve outer attributes if missing from inner orderData
  const storeName =
    orderData.store_name ||
    orderData.shop_name ||
    rawObj.store_name ||
    rawObj.shop_name;

  const extraFields =
    orderData.extra_fields ??
    orderData.custom_fields ??
    rawObj.extra_fields ??
    rawObj.custom_fields;

  const customFields =
    orderData.custom_fields ??
    rawObj.custom_fields;

  const customer =
    orderData.customer ??
    rawObj.customer;

  // Flattened vs nested shipping address normalization:
  // Sometimes shipping is directly the address object (has region/state/city/first_line)
  // rather than having shipping.address.
  let shipping = orderData.shipping ?? rawObj.shipping;
  if (isPlainObject(shipping)) {
    const shippingObj = shipping as Record<string, unknown>;
    const hasDirectAddressFields = Boolean(
      shippingObj.region ||
        shippingObj.state ||
        shippingObj.city ||
        shippingObj.first_line ||
        shippingObj.second_line ||
        shippingObj.address1 ||
        shippingObj.address2 ||
        shippingObj.zip ||
        shippingObj.postal_code
    );

    if (!isPlainObject(shippingObj.address) && hasDirectAddressFields) {
      shipping = {
        ...shippingObj,
        address: { ...shippingObj }
      };
    }
  }

  // Preserve notes or comments if present at root or inside orderData
  const notes =
    orderData.notes ??
    orderData.note ??
    orderData.customer_notes ??
    orderData.comment ??
    rawObj.notes ??
    rawObj.note ??
    rawObj.customer_notes ??
    rawObj.comment;

  return {
    ...orderData,
    ...(resolvedId != null ? { id: resolvedId } : {}),
    ...(storeName != null ? { store_name: storeName } : {}),
    ...(extraFields != null ? { extra_fields: extraFields } : {}),
    ...(customFields != null ? { custom_fields: customFields } : {}),
    ...(customer != null ? { customer } : {}),
    ...(shipping != null ? { shipping } : {}),
    ...(notes != null ? { notes } : {})
  };
}

const VariantOptionSchema = z
  .object({
    name: z.string().nullish(),
    type: z.union([z.string(), z.number()]).nullish(),
    values: z.array(z.string()).nullish()
  })
  .passthrough();

const ProductSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullish(),
    name: z.string().nullish(),
    slug: z.string().nullish(),
    variant_options: z.array(VariantOptionSchema).nullish(),
    meta: z
      .object({
        title: z.string().nullish()
      })
      .passthrough()
      .nullish()
  })
  .passthrough();

const NestedVariantSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullish(),
    product_id: z.union([z.string(), z.number()]).nullish(),
    variations: z.record(z.any()).nullish(),
    options: z.array(z.string()).nullish(),
    values: z.array(z.string()).nullish(),
    price: z.union([z.string(), z.number()]).nullish(),
    title: z.string().nullish(),
    name: z.string().nullish(),
    product: ProductSchema.nullish()
  })
  .passthrough();

const AddressSchema = z
  .object({
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    name: z.string().nullish(),
    phone: z.string().nullish(),
    region: z.string().nullish(),
    state: z.string().nullish(),
    city: z.string().nullish(),
    first_line: z.string().nullish(),
    second_line: z.string().nullish(),
    address1: z.string().nullish(),
    address2: z.string().nullish(),
    zip: z.union([z.string(), z.number()]).nullish(),
    postal_code: z.union([z.string(), z.number()]).nullish(),
    country: z.string().nullish()
  })
  .passthrough();

export const YouCanOrderWebhookPayloadSchema = z.preprocess(
  unwrapYouCanPayload,
  z
    .object({
      id: z.union([z.string(), z.number()], {
        required_error: "Order id is required in YouCan webhook payload."
      }),
      order_id: z.union([z.string(), z.number()]).nullish(),
      ref: z.union([z.string(), z.number()]).nullish(),
      store_name: z.string().nullish(),
      shop_name: z.string().nullish(),
      total: z.union([z.string(), z.number()]).nullish(),
      shipping_cost: z.union([z.string(), z.number()]).nullish(),
      shipping_total: z.union([z.string(), z.number()]).nullish(),
      currency: z.string().nullish(),
      status: z.union([z.string(), z.number()]).nullish(),
      created_at: z.string().nullish(),
      customer: z
        .object({
          id: z.union([z.string(), z.number()]).nullish(),
          first_name: z.string().nullish(),
          last_name: z.string().nullish(),
          name: z.string().nullish(),
          email: z.string().nullish(),
          phone: z.string().nullish()
        })
        .passthrough()
        .nullish(),
      shipping: z
        .object({
          address: AddressSchema.nullish(),
          price: z.union([z.string(), z.number()]).nullish(),
          cost: z.union([z.string(), z.number()]).nullish(),
          first_name: z.string().nullish(),
          last_name: z.string().nullish(),
          phone: z.string().nullish(),
          region: z.string().nullish(),
          state: z.string().nullish(),
          city: z.string().nullish(),
          first_line: z.string().nullish(),
          second_line: z.string().nullish(),
          address1: z.string().nullish(),
          address2: z.string().nullish(),
          zip: z.union([z.string(), z.number()]).nullish(),
          postal_code: z.union([z.string(), z.number()]).nullish(),
          country: z.string().nullish()
        })
        .passthrough()
        .nullish(),
      billing: z.record(z.any()).nullish(),
      billing_address: AddressSchema.nullish(),
      variants: z
        .array(
          z
            .object({
              id: z.union([z.string(), z.number()]).nullish(),
              price: z.union([z.string(), z.number()]).nullish(),
              quantity: z.number().nullish(),
              product_variant_id: z.union([z.string(), z.number()]).nullish(),
              name: z.string().nullish(),
              title: z.string().nullish(),
              variant: NestedVariantSchema.nullish(),
              item: z
                .object({
                  id: z.union([z.string(), z.number()]).nullish(),
                  name: z.string().nullish()
                })
                .passthrough()
                .nullish(),
              variation: z
                .object({
                  size: z.string().nullish(),
                  color: z.string().nullish()
                })
                .passthrough()
                .nullish()
            })
            .passthrough()
        )
        .nullish()
        .default([]),
      line_items: z
        .array(
          z
            .object({
              id: z.union([z.string(), z.number()]).nullish(),
              name: z.string().nullish(),
              title: z.string().nullish(),
              variant_title: z.string().nullish(),
              quantity: z.number().nullish(),
              price: z.union([z.string(), z.number()]).nullish(),
              variant: NestedVariantSchema.nullish()
            })
            .passthrough()
        )
        .nullish()
        .default([]),
      items: z
        .array(
          z
            .object({
              id: z.union([z.string(), z.number()]).nullish(),
              name: z.string().nullish(),
              title: z.string().nullish(),
              quantity: z.number().nullish(),
              price: z.union([z.string(), z.number()]).nullish()
            })
            .passthrough()
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
      notes: z.string().nullish(),
      note: z.string().nullish(),
      customer_notes: z.string().nullish(),
      comment: z.string().nullish()
    })
    .passthrough()
);

export type YouCanOrderWebhookPayload = z.infer<
  typeof YouCanOrderWebhookPayloadSchema
>;
