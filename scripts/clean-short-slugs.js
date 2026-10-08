import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDataPath = path.join(__dirname, '../src/data/pages-data.json');
let pages = JSON.parse(fs.readFileSync(pagesDataPath, 'utf-8'));

console.log(`Original pages count: ${pages.length}`);

// Helper to sanitize and shorten slugs
function shortenSlug(rawSlug) {
  if (!rawSlug) return '';
  
  // 1. Remove repeated consecutive word phrases (e.g., samsung-tv-samsung-tv -> samsung-tv)
  let clean = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  const words = clean.split('-');
  const dedupedWords = [];
  for (let i = 0; i < words.length; i++) {
    // If same word appears consecutively or identical 2-word phrase, skip
    if (i > 0 && words[i] === words[i - 1]) continue;
    dedupedWords.push(words[i]);
  }
  
  // Shorten phrase if too long (keep max 6 words)
  let result = dedupedWords.slice(0, 6).join('-');
  
  // Clean up common repetitive suffixes to keep links short & clean
  result = result
    .replace(/-all-stars-vs-nl-all-stars-match-player-stats/g, '-all-stars-stats')
    .replace(/-vs-real-madrid-lineups/g, '-madrid-lineups')
    .replace(/-match-player-stats/g, '-player-stats')
    .replace(/-premier-league-table/g, '-table')
    .replace(/-subscription/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');

  return result || 'iptv-stream';
}

const seenSlugs = new Set();
const cleanedPages = [];

for (const p of pages) {
  let cleanSlug = shortenSlug(p.slug);
  
  // Ensure uniqueness
  let finalSlug = cleanSlug;
  let counter = 1;
  while (seenSlugs.has(finalSlug)) {
    finalSlug = `${cleanSlug}-${counter}`;
    counter++;
  }
  
  seenSlugs.add(finalSlug);
  p.slug = finalSlug;
  cleanedPages.push(p);
}

// Update cross-linking with short clean slugs
for (let i = 0; i < cleanedPages.length; i++) {
  const currentPage = cleanedPages[i];
  const sameCat = cleanedPages.filter(p => p.category === currentPage.category && p.slug !== currentPage.slug);
  const otherCat = cleanedPages.filter(p => p.category !== currentPage.category);

  const relatedSame = sameCat.slice(i % Math.max(1, sameCat.length - 4), (i % Math.max(1, sameCat.length - 4)) + 4);
  const relatedOther = otherCat.slice((i * 2) % Math.max(1, otherCat.length - 4), ((i * 2) % Math.max(1, otherCat.length - 4)) + 4);

  currentPage.relatedPages = [...relatedSame, ...relatedOther].map(p => ({
    slug: p.slug,
    title: p.title,
    h1: p.h1,
    country: p.country
  }));
}

fs.writeFileSync(pagesDataPath, JSON.stringify(cleanedPages, null, 2), 'utf-8');
console.log(`Updated ${cleanedPages.length} pages with clean short slugs in ${pagesDataPath}!`);

// Update mini search index
const miniDataPath = path.join(__dirname, '../public/data/pages-mini.json');
const miniPages = cleanedPages.map(p => ({
  slug: p.slug,
  title: p.title.replace(' (2026)', '').replace(' - 4K Anti-Freeze', ''),
  category: p.category.replace('-', ' ').toUpperCase()
}));
fs.writeFileSync(miniDataPath, JSON.stringify(miniPages), 'utf-8');
console.log(`Updated lightweight search index (${miniPages.length} items).`);
