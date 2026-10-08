import fs from 'fs';
import path from 'path';

const csvDir = './data_imports';
const iptvFiles = fs.readdirSync(csvDir).filter(f => f.toLowerCase().includes('iptv'));

const iptvKeywords = [];

for (const file of iptvFiles) {
  const content = fs.readFileSync(path.join(csvDir, file), 'utf-8');
  const lines = content.split('\n');
  if (lines.length <= 1) continue;
  
  const header = lines[0].split(/[;,,\t]/).map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
  const kwIdx = header.findIndex(h => /keyword/i.test(h));
  const volIdx = header.findIndex(h => /volume/i.test(h));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/[;,,\t]/).map(p => p.trim().replace(/^"/, '').replace(/"$/, ''));
    const kw = kwIdx !== -1 ? parts[kwIdx] : parts[0];
    const vol = volIdx !== -1 ? parseInt(parts[volIdx], 10) : 0;
    if (kw && !isNaN(vol) && vol > 0) {
      iptvKeywords.push({ keyword: kw, volume: vol, file });
    }
  }
}

// deduplicate
const kwMap = new Map();
for (const k of iptvKeywords) {
  const norm = k.keyword.toLowerCase();
  if (!kwMap.has(norm) || kwMap.get(norm).volume < k.volume) {
    kwMap.set(norm, k);
  }
}

const sorted = Array.from(kwMap.values()).sort((a, b) => b.volume - a.volume);

console.log('=== TOP 50 HIGHEST SEARCH VOLUME IPTV COMMERCIAL KEYWORDS (US & UK) ===');
sorted.slice(0, 50).forEach((k, i) => {
  console.log(`${i + 1}. [${k.volume.toLocaleString()}/mo] "${k.keyword}"`);
});
