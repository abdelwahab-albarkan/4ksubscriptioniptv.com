import fs from 'fs';
import path from 'path';

const csvDir = './data_imports';
const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));

const allKeywords = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(csvDir, file), 'utf-8');
  const lines = content.split('\n');
  if (lines.length <= 1) continue;
  
  // parse header to find Keyword, Volume
  const header = lines[0].split(/[;,,\t]/).map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
  const kwIdx = header.findIndex(h => /keyword/i.test(h));
  const volIdx = header.findIndex(h => /volume/i.test(h));
  const kdIdx = header.findIndex(h => /keyword difficulty|kd/i.test(h));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // split carefully
    const parts = line.split(/[;,,\t]/).map(p => p.trim().replace(/^"/, '').replace(/"$/, ''));
    const kw = kwIdx !== -1 ? parts[kwIdx] : parts[0];
    const vol = volIdx !== -1 ? parseInt(parts[volIdx], 10) : 0;
    if (kw && !isNaN(vol) && vol > 0) {
      allKeywords.push({ keyword: kw, volume: vol, file });
    }
  }
}

// deduplicate
const kwMap = new Map();
for (const k of allKeywords) {
  const norm = k.keyword.toLowerCase();
  if (!kwMap.has(norm) || kwMap.get(norm).volume < k.volume) {
    kwMap.set(norm, k);
  }
}

const sorted = Array.from(kwMap.values()).sort((a, b) => b.volume - a.volume);

console.log('=== TOP 40 DIRECT COMMERCIAL BUYER KEYWORDS IN DATASET ===');
sorted
  .filter(k => /(iptv|stream|subscription|trial|provider|service|4k|player|smart)/i.test(k.keyword))
  .slice(0, 40)
  .forEach((k, i) => {
    console.log(`${i + 1}. [${k.volume.toLocaleString()}/mo] "${k.keyword}"`);
  });
