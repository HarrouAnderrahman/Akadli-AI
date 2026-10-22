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
          translations: { ar: "البداية والتشغيل" },
          items: [
            {
              label: "Overview & Architecture",
              slug: "getting-started/overview",
              translations: { ar: "نظرة عامة والهندسة المعمارية" },
            },
            {
              label: "Quickstart Guide",
              slug: "getting-started/quickstart",
              translations: { ar: "دليل البدء السريع" },
            },
            {
              label: "Playground Sandbox",
              slug: "getting-started/playground",
              translations: { ar: "بيئة الاختبار التفاعلية (Playground)" },
            },
          ],
        },
        {
          label: "Core Packages",
          translations: { ar: "الحزم الأساسية" },
          items: [
            {
              label: "Adapter Contract (@akadli/adapter-contract)",
              slug: "core/adapter-contract",
              translations: { ar: "العقود البرمجية (@akadli/adapter-contract)" },
            },
            {
              label: "Algerian Geo & Phone (@akadli/dz-geo)",
              slug: "core/dz-geo",
              translations: { ar: "الجغرافيا والهاتف 2026 (@akadli/dz-geo)" },
            },
            {
              label: "Voice Orchestration Engine (@akadli/core)",
              slug: "core/engine",
              translations: { ar: "محرك المحادثة الصوتية (@akadli/core)" },
            },
          ],
        },
        {
          label: "Store & ERP Adapters",
          translations: { ar: "محولات المتاجر و ERP" },
          items: [
            {
              label: "Shopify Adapter (@akadli/provider-shopify)",
              slug: "providers/shopify",
              translations: { ar: "محول شوبيفاي (@akadli/provider-shopify)" },
            },
            {
              label: "YouCan Adapter (@akadli/provider-youcan)",
              slug: "providers/youcan",
              translations: { ar: "محول يوكان (@akadli/provider-youcan)" },
            },
            {
              label: "WooCommerce Adapter (@akadli/provider-woocommerce)",
              slug: "providers/woocommerce",
              translations: { ar: "محول ووكومرس (@akadli/provider-woocommerce)" },
            },
            {
              label: "Google Sheets Adapter (@akadli/provider-gsheets)",
              slug: "providers/gsheets",
              translations: { ar: "محول جداول جوجل (@akadli/provider-gsheets)" },
            },
            {
              label: "Tassyir ERP Adapter (@akadli/provider-tassyir)",
              slug: "providers/tassyir",
              translations: { ar: "محول تسيير (@akadli/provider-tassyir)" },
            },
          ],
        },
        {
          label: "For AI Agents",
          translations: { ar: "للوكلاء البرمجيين والذكاء الاصطناعي" },
          items: [
            {
              label: "AI Agent Portal & llms.txt",
              slug: "agents/overview",
              translations: { ar: "بوابة الوكلاء وملفات llms.txt" },
            },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
