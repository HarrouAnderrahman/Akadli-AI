---
name: dz-geo-address-normalizer
description: Normalize, fuzzy-match, or validate Algerian 69 Wilayas, 1708 Communes, and phone numbers from messy Arabic, French, or Franco-Arabic customer input. Trigger when building address mapping, Wilaya enum constraints for ElevenAgents, or testing COD address updates (e.g., "normalize Algerian Wilaya and commune", "validate +213 phone number", "build ElevenAgents Wilaya enum").
---

# dz-geo-address-normalizer

Normalize, fuzzy-match, and validate Algerian 69 Wilayas (`"01"` through `"69"`), 1708 Communes (with `WILAYAS_58` backward compatibility for legacy couriers), and Algerian phone numbers (`05/06/07XXXXXXXX` and `+213`) inside `@dz-voice/dz-geo` and across provider adapters.

## When to Use

- Implementing or updating `@dz-voice/dz-geo` Wilaya, Commune, or phone normalization functions
- Mapping messy e-commerce checkout inputs (Arabic, French, Franco-Arabic/Arabizi, or numeric codes) into canonical `"01"`-`"69"` Wilaya codes and `"13 - Tlemcen"` / `"68 - Bou Saada"` display labels
- Extracting the valid commune constraint list (`allowedCommunes`) for a specific Wilaya so the ElevenAgents `finalize_order_decision` tool cannot hallucinate invalid communes
- Validating or converting Algerian mobile phone numbers between local 10-digit (`05/06/07XXXXXXXX`) and E.164 (`+213[567]XXXXXXXX`) formats

## Decision Tree: Normalization Pipeline

1. **Normalizing a Customer Phone Number?**
   - Strip all whitespace, hyphens, dots, parentheses, and `00213` prefixes.
   - Convert `+2130([567]\d{8})` or `002130?([567]\d{8})` to either local `0$1` (for COD store/courier APIs) or `+213$1` (for ElevenAgents outbound SIP/Twilio calls).
   - Reject landlines or non-mobile prefixes (anything not starting with `5`, `6`, or `7` after `+213`/`0`) when mobile voice confirmation is required.
2. **Normalizing a Messy Wilaya Input?**
   - Load `{{SKILL_PATH}}/references/algeria-wilayas-spec.md`.
   - Run the 4-stage resolution pipeline (**Step 1**): Exact Code Match -> Diacritic/Script Normalization -> Alias & Arabizi Lookup -> Bounded Levenshtein/Trigram Fuzzy Match.
3. **Resolving a Commune & Building ElevenAgents Constraints?**
   - Always resolve the canonical Wilaya code (`"01"`-`"69"`) **first**.
   - Scope commune matching strictly to the resolved Wilaya's commune list (with a fallback cross-Wilaya lookup only if the customer mistyped the Wilaya).
   - Export the full commune list of the resolved Wilaya into `constraints.allowedCommunes`.

## Step-by-Step Instructions

### Step 1: Implement 4-Stage Wilaya Normalization (`normalizeWilaya`)

Read the full 69-Wilaya dataset and normalization rules in `{{SKILL_PATH}}/references/algeria-wilayas-spec.md` and implement `normalizeWilaya(rawInput: string | number)` in `packages/dz-geo/src/wilaya.ts`:

1. **Stage 1 - Numeric & Prefix Extraction**:
   - If input is an integer (`1` to `69`) or contains a leading/embedded 1-2 digit code (e.g., `"16"`, `"13 - Tlemcen"`, `"68 - Bou Saada"`, `"Wilaya 09"`, `"Wilaya 59"`, `"31 Oran"`), extract the integer, verify `1 <= n <= 69`, and zero-pad to 2 digits (`String(n).padStart(2, "0")`).
2. **Stage 2 - Script & Diacritic Canonicalization**:
   - For Latin text: lowercase, strip French accents (`é, è, ê -> e`, `ï, î -> i`, `â -> a`), strip punctuation/hyphens, and remove stop words (`wilaya`, `de`, `d`, `el`, `al`).
   - For Arabic text: normalize Alef variants (`أ, إ, آ -> ا`), Teh Marbuta (`ة -> ه`), Alef Maksura (`ى -> ي`), remove Tatweel (`ـ`) and Tashkeel diacritics, and strip leading `ولاية` or `ال`.
3. **Stage 3 - Alias & Franco-Arabic Dictionary Match**:
   - Match against the alias table in `{{SKILL_PATH}}/references/algeria-wilayas-spec.md` covering French variants, Arabic names, and common checkout spellings (e.g., `"alger" | "algiers" | "الجزائر" | "dzayer" -> "16"`, `"tlemcen" | "tilimsen" | "تلمسان" -> "13"`, `"bousaada" | "bou saada" | "بوسعادة" -> "68"`, `"aflou" | "أفلو" -> "59"`).
4. **Stage 4 - Bounded Fuzzy Match**:
   - Compute normalized similarity (Levenshtein distance <= 2 for strings >= 5 chars) against canonical French and Arabic Wilaya names across all 69 Wilayas (`WILAYAS_ALL`).
   - Return `{ code: WilayaCode, nameFr: string, nameAr: string, canonicalLabel: string }` where `canonicalLabel` is formatted as `"${code} - ${nameFr}"` (e.g., `"13 - Tlemcen"`, `"68 - Bou Saada"`).

### Step 2: Implement Commune Resolution & Dynamic Constraints (`resolveCommuneAndConstraints`)

1. Given a resolved `wilayaCode` (`"01"`-`"69"`) and raw `communeInput`:
   - Retrieve all official communes for `wilayaCode` from the 1,708 official communes dataset.
   - Normalize `communeInput` using the same Latin/Arabic canonicalization (e.g., `"Mansourah"` / `"المنصورة"` / `"Mansoura"` in Wilaya `"13"` -> canonical `"Mansourah"`; `"بوسعادة"` in Wilaya `"68"` -> canonical `"Bou Saada"`).
2. Return both:
   - `currentCommune`: The matched canonical commune name (or the cleaned input if unrecognized so the voice agent can clarify on the call).
   - `allowedCommunes`: The complete array of canonical commune names belonging to `wilayaCode`, passed directly into `StandardizedDzOrder.constraints.allowedCommunes` for ElevenAgents.

### Step 3: Implement Algerian Phone Normalization (`normalizeDzPhone`)

Implement `normalizeDzPhone(rawPhone: string, format: "local" | "e164" = "local")` in `packages/dz-geo/src/phone.ts`:

1. Remove all spaces, dashes, dots, parentheses, and non-digit characters except a leading `+`.
2. Replace leading `00213` with `+213`, and replace leading `213` (when 12 digits total) with `+213`.
3. Handle trunk-zero inclusions such as `+2130550123456` by stripping the redundant `0` after `+213`.
4. Validate the 9-digit subscriber payload matches `/^[567]\d{8}$/` (Mobilis `06`, Djezzy `07`, Ooredoo `05`).
5. Return `"0" + subscriber9` when `format === "local"` (`0550123456`) or `"+213" + subscriber9` when `format === "e164"` (`+213550123456`). Throw a typed `InvalidDzPhoneError` if validation fails.

### Step 4: Verify Geo Dataset & Normalizer

Run the bundled verification script after modifying `@dz-voice/dz-geo`:

```bash
{{SKILL_PATH}}/scripts/verify-geo-data.sh
```

## Gotchas

- **Homonymous Communes Across Wilayas**: Commune names like `"Mansourah"` exist in multiple Wilayas (`"13 - Tlemcen"`, `"34 - Bordj Bou Arreridj"`, `"47 - Ghardaia"`), and `"Bir El Djir"` vs `"Bir Mourad Rais"` belong to different Wilayas. Always scope commune fuzzy matching to the order's `currentWilaya` first.
- **2026 Administrative Division (69 Wilayas & 1,708 Communes)**: The 2026 administrative reorganization established 69 Wilayas (codes `"01"` to `"69"`) and 1,708 Communes, promoting 11 delegated Wilayas (`"59"` through `"69"`: *Aflou, Barika, El Kantara, Bir El Ater, El Aricha, Ksar Chellala, Ain Oussera, Messad, Ksar El Boukhari, Bou Saada, El Abiodh Sidi Cheikh*).
- **Backward Compatibility (`WILAYAS_58`)**: For legacy logistics APIs, couriers (Yalidine, Ecotrack, ZR Express), or store plugins that have not yet updated their database enums past 58 Wilayas, `@dz-voice/dz-geo` exports `WILAYAS_58` as a compatibility slice while using `WILAYAS_ALL` (69 Wilayas) across the primary pipeline.
