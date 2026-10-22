import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "../../..");
const publicDir = path.resolve(__dirname, "../public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log("[generate-llms] Generating llms.txt and llms-full.txt...");

// 1. Generate llms.txt
const llmsTxtContent = `# Akadli-AI

> Open-source Algerian Cash-on-Delivery (COD) Voice Confirmation Engine & Store Adapters for the 2026 69-Wilaya / 1,708-Commune division.

Akadli-AI automates post-checkout COD order confirmation calls in Algerian Darja via ElevenLabs Conversational AI (ElevenAgents), normalizes Algerian addresses to the official 2026 69 Wilayas and 1,708 Communes, and applies real-time order mutations (confirmation, variant/address modification, and cancellation) across Shopify, YouCan, WooCommerce, Google Sheets, and Tassyir ERP.

- Website: https://akadli.me
- Arabic Documentation: https://akadli.me/ar/
- GitHub: https://github.com/Akadli-AI/Akadli-AI
- Full LLM Context: https://akadli.me/llms-full.txt

## Quick Installation

\`\`\`bash
pnpm add @akadli/core @akadli/dz-geo @akadli/provider-shopify
\`\`\`

## Getting Started

- [Overview](https://akadli.me/getting-started/overview): Architectural lifecycle, webhook ingress, and order mutation flow.
- [Quickstart](https://akadli.me/getting-started/quickstart): 20-line end-to-end TypeScript integration example.
- [Playground Sandbox](https://akadli.me/getting-started/playground): Local HTTPS WebRTC phone simulator (/phone) and admin console (/admin) over LAN Wi-Fi.

## Core Packages

- [@akadli/adapter-contract](https://akadli.me/core/adapter-contract): Universal TypeScript interfaces (StandardizedDzOrder, FinalizedOrderDecision, IEcommerceProvider) and Zod validation schemas. Zero runtime dependencies.
- [@akadli/dz-geo](https://akadli.me/core/dz-geo): Official 2026 Algerian 69 Wilayas, 1,708 Communes, ONP postal codes, and +213 phone normalizer.
- [@akadli/core](https://akadli.me/core/engine): Stateless voice orchestration engine connecting ElevenAgents with store providers.

## Store & ERP Adapters

- [@akadli/provider-shopify](https://akadli.me/providers/shopify): Shopify COD adapter with Dev Dashboard setup, protected customer data access, and missing-province fallback.
- [@akadli/provider-youcan](https://akadli.me/providers/youcan): YouCan (.shop) COD adapter with 1-page checkout extra_fields extraction.
- [@akadli/provider-woocommerce](https://akadli.me/providers/woocommerce): WooCommerce REST v3 adapter with DZ-XX state codes and COD plugin meta_data parser.
- [@akadli/provider-gsheets](https://akadli.me/providers/gsheets): Universal Google Sheets v4 & Zero-OAuth Apps Script bridge for SetShop, JustSell, and Foorweb.
- [@akadli/provider-tassyir](https://akadli.me/providers/tassyir): Official Tassyir Admin API (2026-10) with Standard Webhooks (v1a Ed25519) and OAuth installation flow.

## AI Coding Agent Guidance

- [AI Agent Portal](https://akadli.me/agents/overview): Canonical rules, skills, and prompt templates for Cursor, Antigravity, Claude Code, and Codex.
- Full context bundle for LLM ingestion: https://akadli.me/llms-full.txt
`;

fs.writeFileSync(path.join(publicDir, "llms.txt"), llmsTxtContent, "utf-8");
console.log("  ✓ Created public/llms.txt");

// 2. Generate llms-full.txt
const sections = [
  {
    title: "# Akadli-AI Full Repository Context for LLMs",
    body: `This file contains the complete, unedited architectural specifications, agent invariants, and documentation for all packages in the Akadli-AI monorepo (https://akadli.me).\nGenerated at: ${new Date().toISOString()}`
  }
];

function readIfExists(filePath, title) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    sections.push({
      title: `\n\n================================================================================\n# FILE: ${title}\n================================================================================\n`,
      body: content
    });
  }
}

// Monorepo Root Documents
readIfExists(path.join(workspaceRoot, "AGENTS.md"), "AGENTS.md (Architectural Invariants & Agent Guidelines)");
readIfExists(path.join(workspaceRoot, "README.md"), "Root README.md");
readIfExists(path.join(workspaceRoot, "README.ar.md"), "Root README.ar.md (Arabic)");

// Core Packages
const packages = [
  { dir: "packages/adapter-contract", name: "@akadli/adapter-contract" },
  { dir: "packages/dz-geo", name: "@akadli/dz-geo" },
  { dir: "packages/core", name: "@akadli/core" },
  { dir: "packages/provider-shopify", name: "@akadli/provider-shopify" },
  { dir: "packages/provider-youcan", name: "@akadli/provider-youcan" },
  { dir: "packages/provider-woocommerce", name: "@akadli/provider-woocommerce" },
  { dir: "packages/provider-gsheets", name: "@akadli/provider-gsheets" },
  { dir: "packages/provider-tassyir", name: "@akadli/provider-tassyir" },
  { dir: "apps/akadli-playground", name: "@akadli/playground" }
];

for (const pkg of packages) {
  const pkgDir = path.join(workspaceRoot, pkg.dir);
  readIfExists(path.join(pkgDir, "README.md"), `${pkg.name} - README.md`);
  readIfExists(path.join(pkgDir, "docs/api-spec.md"), `${pkg.name} - docs/api-spec.md`);
}

const llmsFullContent = sections.map((s) => `${s.title}\n\n${s.body}`).join("\n");
fs.writeFileSync(path.join(publicDir, "llms-full.txt"), llmsFullContent, "utf-8");
console.log(`  ✓ Created public/llms-full.txt (${(Buffer.byteLength(llmsFullContent, 'utf-8') / 1024).toFixed(1)} KB)`);
console.log("[generate-llms] Complete.");
