import { z } from "zod";

/**
 * Flexible column candidate keys across English, French, and Arabic.
 */
export const COLUMN_CANDIDATE_KEYS = {
  customerName: [
    "full_name",
    "fullname",
    "nom",
    "client",
    "الاسم",
    "اسم_العميل",
    "اسم العميل",
    "nom_client",
    "name",
    "customer_name",
    "customer"
  ],
  phone: [
    "phone",
    "telephone",
    "tel",
    "téléphone",
    "الهاتف",
    "رقم_الهاتف",
    "رقم الهاتف",
    "mobile",
    "numero_telephone",
    "num_tel"
  ],
  wilaya: [
    "wilaya",
    "province",
    "state",
    "الولاية",
    "ولاية",
    "region"
  ],
  commune: [
    "commune",
    "baladiya",
    "city",
    "البلدية",
    "بلدية",
    "ville"
  ],
  address: [
    "address",
    "adresse",
    "note",
    "العنوان",
    "عنوان",
    "address_note",
    "notes",
    "remarque"
  ],
  product: [
    "product",
    "item_name",
    "produit",
    "المنتج",
    "اسم_المنتج",
    "اسم المنتج",
    "article",
    "item"
  ],
  variant: [
    "variant",
    "variation",
    "size",
    "taille",
    "المقاس",
    "الحجم",
    "pointure",
    "dimension"
  ],
  size: [
    "variant",
    "variation",
    "size",
    "taille",
    "المقاس",
    "الحجم",
    "pointure",
    "dimension"
  ],
  price: [
    "price",
    "total",
    "prix",
    "السعر",
    "المبلغ",
    "montant",
    "tarif"
  ]
} as const;

/**
 * Inbound webhook payload schema accepting both flat row dictionaries and
 * objects wrapped in `data` or `row`.
 */
export const GSheetsOrderWebhookPayloadSchema = z
  .record(z.unknown())
  .refine(
    (val) => typeof val === "object" && val !== null,
    { message: "Webhook payload must be a non-null JSON object." }
  );

export type GSheetsOrderWebhookPayload = z.infer<
  typeof GSheetsOrderWebhookPayloadSchema
>;

/**
 * Mode A: Direct Google Sheets REST API v4 credentials.
 */
export const GSheetsApiCredentialsSchema = z.object({
  spreadsheetId: z.string().min(1),
  accessToken: z.string().min(1),
  sheetName: z.string().default("Sheet1"),
  statusColumn: z.string().default("G"),
  variantColumn: z.string().default("H"),
  sizeColumn: z.string().optional(),
  wilayaColumn: z.string().default("I"),
  communeColumn: z.string().default("J"),
  addressColumn: z.string().default("K"),
  notesColumn: z.string().default("L"),
  baseUrl: z.string().default("https://sheets.googleapis.com")
});

export type GSheetsApiCredentials = z.infer<typeof GSheetsApiCredentialsSchema>;

/**
 * Mode B: Apps Script Webhook Callback credentials.
 */
export const GSheetsAppsScriptCredentialsSchema = z.object({
  appsScriptWebhookUrl: z.string().url(),
  secret: z.string().optional()
});

export type GSheetsAppsScriptCredentials = z.infer<
  typeof GSheetsAppsScriptCredentialsSchema
>;

/**
 * Universal credentials schema supporting either Mode A, Mode B, or both.
 */
export const GSheetsCredentialsSchema = z.record(z.string()).refine(
  (creds) => {
    const hasModeA = Boolean(creds.spreadsheetId && creds.accessToken);
    const hasModeB = Boolean(creds.appsScriptWebhookUrl);
    return hasModeA || hasModeB;
  },
  {
    message:
      "GSheets credentials must include either Mode A (spreadsheetId + accessToken) or Mode B (appsScriptWebhookUrl)."
  }
);

export type GSheetsCredentials = Record<string, string>;
