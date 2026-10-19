# @akadli/provider-shopify

Shopify Cash-On-Delivery (COD) and Algerian e-commerce provider adapter for the **Akadli-AI** voice confirmation engine (`ElevenAgents`).

This package implements the `IEcommerceProvider` interface from [`@akadli/adapter-contract`](file:///home/har/Documents/Programming/Akadli-AI/packages/adapter-contract/src/index.ts):
- Webhook signature verification (`verifyWebhook`) using HMAC-SHA256 (Base64).
- Inbound COD order parsing and address normalization (`parseWebhookOrder`) against the 2026 Algerian administrative division (69 Wilayas, 1,708 Communes).
- Outbound order decision mutations (`applyOrderDecision`) for `CONFIRMED`, `MODIFIED`, and `REFUSED` states.
- Support for both direct Admin API Access Tokens (`shpat_...`) and automatic OAuth token exchange (`clientId` + `clientSecret`).

---

## Live Shopify Store Setup Guide (2026 Dev Dashboard)

Follow this step-by-step guide to connect a live Shopify store to Akadli-AI using the modern Shopify Developer Dashboard (`dev.shopify.com`).

### 1. Create App in `dev.shopify.com`
1. Navigate to [dev.shopify.com](https://dev.shopify.com) and log in with your Shopify Partner or Store account.
2. Go to **Apps** -> **Create an App** (or select your existing development app).
3. Set **App URL** to `https://example.com` (or your webhook forwarder URL).
4. **CRITICAL**: Leave **Embed app in Shopify admin** **UNCHECKED** (Akadli-AI operates as a backend service).
5. In **API access** -> **Scopes**, grant the following Admin API scopes:
   - `read_orders`
   - `write_orders`

### 2. Enable Protected Customer Data Access (CRITICAL)
In Shopify's modern API, customer personal data is redacted by default unless explicitly enabled:
1. In `dev.shopify.com` -> **API access** -> **Protected customer data access**, click **Manage**.
2. Enable **Protected customer data**.
3. Under data fields, check all three required items:
   - **Name**
   - **Address**
   - **Phone**
> [!IMPORTANT]
> If Protected Customer Data Access is not enabled, Shopify will redact customer phone numbers and delivery addresses in webhook payloads, and mutating `shipping_address` during order modifications will fail.

### 3. Authentication (`clientId` + `clientSecret` or `accessToken`)
Akadli-AI supports two authentication methods for Shopify:
- **Option A (OAuth Client Credentials - Recommended for Dev Apps):**
  - Copy **Client ID** and **Client secret** from `dev.shopify.com` -> **API credentials**.
  - Configure `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`.
  - `@akadli/provider-shopify` automatically performs the OAuth token exchange via `POST https://{shopDomain}/admin/oauth/access_token` with `grant_type: "client_credentials"` and caches the resulting token in memory until expiration.
- **Option B (Direct Admin API Access Token):**
  - Install the app on your test store and generate a permanent Admin Access Token (`shpat_...`).
  - Configure `SHOPIFY_ACCESS_TOKEN`.

### 4. Algerian Address Mapping (Missing `Province` Field)
When a customer selects **Algeria** (`DZ`) in standard Shopify checkout:
- **Shopify hides the `Province` / State dropdown entirely** because Shopify does not natively maintain Algerian Wilaya divisions.
- Consequently, Algerian customers frequently enter their Wilaya in the `city` field, in `address1`, or enter a 5-digit Algerian ONP postal code in `zip` (e.g., `13000` for Tlemcen, `16000` for Alger, `68000` for Bou Saada).
- Furthermore, merchants running Algerian COD apps (like **EasySell**, **Releasit**, **CodForm**, or **FastForm**) store customer details inside `note_attributes` rather than standard address objects.

`@akadli/provider-shopify` automatically handles this using a multi-candidate extraction pipeline:
1. **`note_attributes` Inspection:** Checks custom COD form attributes (`wilaya`, `province`, `commune`, `city`, `phone`, `nom`, `adresse`).
2. **Postal Code Resolution (`zip`):** Extracts the 2-digit Wilaya prefix from 5-digit Algerian ONP postal codes (e.g. `13000` -> Wilaya `"13"`, `68000` -> Wilaya `"68"`).
3. **Multi-Candidate Geo Normalization:** Scans `city`, `zip`, `address1`, and `address2` against `@akadli/dz-geo` to resolve the canonical Wilaya (`"01"` to `"69"`).
4. **Smart Commune Matching:** Matches the specific commune within the resolved Wilaya, disambiguating communes from Wilaya capitals.

---

## Environment Variables

```env
# Shopify Store Domain
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com

# Authentication: Direct Token OR Client Credentials
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx
# OR:
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret

# Webhook Verification Secret (from Shopify Notifications -> Webhooks)
SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret

# API Version (defaults to 2025-01 / 2024-04)
SHOPIFY_API_VERSION=2025-01
```

---

## Order Decision Mutations

- **`CONFIRMED`**: Tags the order with `akadli-confirmed` and adds an agent call confirmation note.
- **`MODIFIED`**: Updates `shipping_address` (Wilaya code, Commune city, address note), tags the order with `akadli-modified` (and `akadli-size-{size}` if changed), and appends call modification notes.
- **`REFUSED`**: Tags the order with `akadli-refused`, records refusal reasons, and cancels the order via `POST /admin/api/{version}/orders/{id}/cancel.json` (`restock: true`).
