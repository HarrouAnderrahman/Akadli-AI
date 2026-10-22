import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

const requiredFiles = [
  "llms.txt",
  "llms-full.txt",
  "sitemap-index.xml",
  "sitemap-0.xml",
  "index.html",
  "ar/index.html",
  "robots.txt",
  "CNAME"
];

console.log("[test-build] Verifying generated documentation distribution files...");

let missing = 0;
for (const file of requiredFiles) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ Missing expected dist file: ${file}`);
    missing++;
  } else {
    const stats = fs.statSync(filePath);
    console.log(`  ✓ Found ${file} (${stats.size} bytes)`);
  }
}

if (missing > 0) {
  console.error(`[test-build] Verification failed: ${missing} files missing.`);
  process.exit(1);
}

console.log("[test-build] All required distribution files verified successfully.");
