const fs = require('fs');
const path = require('path');

const wilayasPath = path.resolve(__dirname, '../shared/data/wilayas.json');
const communesPath = path.resolve(__dirname, '../shared/data/communes.json');
const outputPath = path.resolve(__dirname, '../shared/algeria2026Data.ts');

const wilayasRaw = JSON.parse(fs.readFileSync(wilayasPath, 'utf8').replace(/^\uFEFF/, ''));
const communesRaw = JSON.parse(fs.readFileSync(communesPath, 'utf8').replace(/^\uFEFF/, ''));

const wilayas = wilayasRaw.map(w => ({
  id: String(w.id),
  code: String(w.code).padStart(2, '0'),
  name: w.name.trim(),
  ar_name: w.ar_name.trim()
}));

const communes = communesRaw.map(c => ({
  id: String(c.id),
  name: c.name.trim(),
  ar_name: c.ar_name.trim(),
  wilaya_id: String(c.wilaya_id)
}));

const tsContent = [
  '// Official 2026 Algerian Administrative Divisions (69 Wilayas, 1708 Communes)',
  '// Source: https://github.com/Kenandarabeh/algeria-wilayas-communes-2026',
  '',
  'export interface Wilaya2026 {',
  '  id: string;',
  '  code: string;',
  '  name: string;',
  '  ar_name: string;',
  '}',
  '',
  'export interface Commune2026 {',
  '  id: string;',
  '  name: string;',
  '  ar_name: string;',
  '  wilaya_id: string;',
  '}',
  '',
  `export const WILAYAS_2026: Wilaya2026[] = ${JSON.stringify(wilayas, null, 2)};`,
  '',
  `export const COMMUNES_2026: Commune2026[] = ${JSON.stringify(communes, null, 2)};`,
  ''
].join('\n');

fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log('Successfully written shared/algeria2026Data.ts. File size:', (fs.statSync(outputPath).size / 1024).toFixed(1), 'KB');
