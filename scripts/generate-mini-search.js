import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fullDataPath = path.join(__dirname, '../src/data/pages-data.json');
const miniDataDir = path.join(__dirname, '../public/data');
const miniDataPath = path.join(miniDataDir, 'pages-mini.json');

const pages = JSON.parse(fs.readFileSync(fullDataPath, 'utf-8'));
const miniPages = pages.map(p => ({
  slug: p.slug,
  title: p.title.replace(' (2026)', '').replace(' - 4K Anti-Freeze', ''),
  category: p.category.replace('-', ' ').toUpperCase()
}));

fs.mkdirSync(miniDataDir, { recursive: true });
fs.writeFileSync(miniDataPath, JSON.stringify(miniPages), 'utf-8');

console.log(`Generated lightweight search index (${miniPages.length} items) into ${miniDataPath}`);
