// Notify Bing, Yandex, Seznam, Naver (IndexNow) about new or changed URLs. Google does NOT use IndexNow.
//   node scripts/index-now.mjs                       -> every URL of the LIVE sitemap
//   node scripts/index-now.mjs --local               -> every URL of dist/sitemap.xml
//   node scripts/index-now.mjs https://.../a https://.../b  -> only these URLs
//   add --dry to print what would be sent without sending anything
// Run it after the site is deployed: the key file (public/<key>.txt) must be reachable on the live domain.
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('src/data/site-config.json', 'utf8'));
const SITE_URL = cfg.domain.replace(/\/+$/, '');
const HOST = new URL(SITE_URL).hostname;
const KEY = cfg.indexNowKey;
if (!KEY) { console.error('Missing "indexNowKey" in src/data/site-config.json'); process.exit(1); }
if (!fs.existsSync(`public/${KEY}.txt`)) { console.error(`Missing public/${KEY}.txt (its content must be the key)`); process.exit(1); }

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const local = args.includes('--local');
const specific = args.filter((a) => a.startsWith('http'));
const ENGINES = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow'];
const BATCH = 1000;

async function sitemapUrls() {
  let xml;
  if (local) xml = fs.readFileSync('dist/sitemap.xml', 'utf8');
  else {
    const r = await fetch(`${SITE_URL}/sitemap.xml`, { headers: { 'User-Agent': 'Mozilla/5.0 (IndexNow script)' } });
    if (!r.ok) throw new Error(`Sitemap HTTP ${r.status}`);
    xml = await r.text();
  }
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

const urls = specific.length ? specific : await sitemapUrls();
const bad = urls.filter((u) => new URL(u).hostname !== HOST);
if (bad.length) { console.error(`These URLs are not on ${HOST}: ${bad.slice(0, 3).join(', ')}`); process.exit(1); }
console.log(`${urls.length} URL(s) for ${HOST}${dry ? ' (dry run, nothing sent)' : ''}`);
if (dry) process.exit(0);

for (let i = 0; i < urls.length; i += BATCH) {
  const batch = urls.slice(i, i + BATCH);
  for (const engine of ENGINES) {
    try {
      const r = await fetch(engine, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList: batch }),
      });
      console.log(`${r.ok ? 'OK ' : 'ERR'} ${r.status} ${engine} (${batch.length} URLs)`);
    } catch (e) { console.error(`ERR ${engine}: ${e.message}`); }
  }
}
