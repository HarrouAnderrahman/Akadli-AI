// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://akadli.me",
  integrations: [
    starlight({
      title: "Akadli-AI",
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        ar: {
          label: "العربية",
          lang: "ar",
          dir: "rtl",
        },
      },
      social: {
        github: "https://github.com/Akadli-AI/Akadli-AI",
      },
      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "meta",
          attrs: {
            name: "keywords",
            content:
              "Algerian COD confirmation, 69 Wilayas 1708 Communes Algeria JSON npm, Shopify YouCan WooCommerce Tassyir Algeria AI, ElevenLabs Algerian Darja, الدفع عند الاستلام الجزائر, تأكيد الطلبيات صوتيا بالذكاء الاصطناعي, ولايات الجزائر 69",
          },
        },
        {
          tag: "script",
          attrs: {
            type: "application/ld+json",
          },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Akadli-AI",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Cross-platform",
            url: "https://akadli.me",
            description:
              "Open-source Algerian Cash-on-Delivery (COD) Voice Confirmation Engine & Store Adapters for the 2026 69-Wilaya / 1,708-Commune division.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            author: {
              "@type": "Organization",
              name: "Akadli-AI",
              url: "https://akadli.me",
            },
          }),
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          translations: { ar: "البداية" },
          items: [
            {
              label: "Overview",
              slug: "getting-started/overview",
              translations: { ar: "نظرة عامة" },
            },
            {
              label: "Quickstart",
              slug: "getting-started/quickstart",
              translations: { ar: "البدء السريع" },
            },
            {
              label: "Playground",
              slug: "getting-started/playground",
              translations: { ar: "بيئة التجارب" },
            },
          ],
        },
        {
          label: "Core",
          translations: { ar: "الحزم الأساسية" },
          items: [
            {
              label: "Adapter Contract",
              slug: "core/adapter-contract",
              translations: { ar: "العقود البرمجية" },
            },
            {
              label: "Algerian Geography",
              slug: "core/dz-geo",
              translations: { ar: "الجغرافيا والهاتف" },
            },
            {
              label: "Voice Engine",
              slug: "core/engine",
              translations: { ar: "المحرك الصوتي" },
            },
          ],
        },
        {
          label: "Store Adapters",
          translations: { ar: "محولات المتاجر" },
          items: [
            {
              label: "Shopify",
              slug: "providers/shopify",
              translations: { ar: "Shopify" },
            },
            {
              label: "YouCan",
              slug: "providers/youcan",
              translations: { ar: "YouCan" },
            },
            {
              label: "WooCommerce",
              slug: "providers/woocommerce",
              translations: { ar: "WooCommerce" },
            },
            {
              label: "Google Sheets",
              slug: "providers/gsheets",
              translations: { ar: "Google Sheets" },
            },
            {
              label: "Tassyir ERP",
              slug: "providers/tassyir",
              translations: { ar: "Tassyir ERP" },
            },
          ],
        },
        {
          label: "AI Agents",
          translations: { ar: "وكلاء الذكاء الاصطناعي" },
          items: [
            {
              label: "Agent Portal",
              slug: "agents/overview",
              translations: { ar: "بوابة الوكلاء" },
            },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
