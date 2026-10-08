// Checks every built page (dist/) for: meta title / description, canonical, robots, social tags and JSON-LD structure.
//   npm run build && node scripts/validate-seo.mjs
import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const walk = (d, a = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, a) : f === 'index.html' && a.push(p); } return a; };
const files = walk(DIST);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const issues = {};
const add = (k, f) => { (issues[k] ||= []).push(f.replace(/\\/g, '/').replace('dist/', '/').replace('/index.html', '')); };
const typeCount = {};
let pages = 0, redirects = 0;

for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/.test(h) && !/<h1/.test(h)) { redirects++; continue; } // redirect stubs
  pages++;
  const title = decode((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const desc = decode((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  if (!title) add('missing <title>', f); else if (title.length > 65) add('title > 65 chars', f);
  if (!desc) add('missing meta description', f); else { if (desc.length > 165) add('description > 165 chars', f); if (desc.length < 70) add('description < 70 chars', f); }
  const canon = (h.match(/rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canon) add('missing canonical', f);
  else if (!canon.startsWith('https://')) add('canonical not absolute https', f);
  if (!/name="robots"/.test(h)) add('missing robots meta', f);
  for (const t of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'twitter:card']) if (!new RegExp(`(property|name)="${t}"`).test(h)) add('missing ' + t, f);
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) add('H1 count != 1', f);

  // JSON-LD
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) { add('no JSON-LD', f); continue; }
  const idsSeen = new Map(); const refs = [];
  let hasOrg = false, hasWebsite = false, hasWebPage = false;
  for (const raw of blocks) {
    let j; try { j = JSON.parse(raw); } catch { add('JSON-LD parse error', f); continue; }
    const nodes = j['@graph'] || [j];
    for (const n of nodes) {
      const types = [].concat(n['@type'] || []);
      types.forEach((t) => (typeCount[t] = (typeCount[t] || 0) + 1));
      if (types.includes('Organization')) hasOrg = true;
      if (types.includes('WebSite')) hasWebsite = true;
      if (types.some((t) => /Page$/.test(t))) hasWebPage = true;
      const walkNode = (o, top) => {
        if (Array.isArray(o)) return o.forEach((x) => walkNode(x, false));
        if (!o || typeof o !== 'object') return;
        const keys = Object.keys(o);
        if (typeof o['@id'] === 'string') {
          if (keys.length > 1 || top) { if (idsSeen.has(o['@id'])) add('duplicate @id', f); idsSeen.set(o['@id'], true); }
          else refs.push(o['@id']);
        }
        for (const k of keys) if (k !== '@id') walkNode(o[k], false);
      };
      walkNode(n, true);
      if (types.includes('AggregateRating') || n.aggregateRating) add('AggregateRating present', f);
      if (types.includes('Product') && !n.offers) add('Product without offers', f);
      if (types.includes('BreadcrumbList') && !(n.itemListElement || []).length) add('empty BreadcrumbList', f);
      if (types.includes('FAQPage') && !(n.mainEntity || []).length) add('empty FAQPage', f);
    }
  }
  if (!hasOrg) add('no Organization', f);
  if (!hasWebsite) add('no WebSite', f);
  if (!hasWebPage) add('no WebPage entity', f);
  // every {"@id": ...} reference must exist somewhere in the page
  for (const r of new Set(refs)) if (!idsSeen.has(r) && r.startsWith('http')) add('dangling @id reference', f);
}


// ---- Focus keyword check (articles + hand-written posts): every word of the keyword must appear in the title or the H1
const { articles } = await import('../src/data/articles.mjs');
const staticKw = {
  'how-to-setup-iptv-firestick-2026': 'how to set up iptv on firestick',
  'best-iptv-apps-comparison-tivimate-vs-smarters': 'tivimate vs iptv smarters pro',
  'how-to-fix-iptv-buffering-isp-throttling': 'iptv buffering fix',
  'start-iptv-reseller-business-guide': 'iptv reseller business',
};
const kwList = [...articles.map((a) => [a.slug, a.focusKeyword]), ...Object.entries(staticKw)];
const stop = new Set(['on', 'for', 'to', 'the', 'a', 'of', 'how']);
for (const [slug, kw] of kwList) {
  const file = path.join(DIST, 'blog', slug, 'index.html');
  if (!kw) { add('article without focus keyword', '/blog/' + slug); continue; }
  if (!fs.existsSync(file)) continue;
  const h = fs.readFileSync(file, 'utf8');
  const title = decode((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').toLowerCase();
  const h1 = decode(((h.match(/<h1[\s\S]*?<\/h1>/) || [''])[0]).replace(/<[^>]+>/g, ' ')).toLowerCase();
  const hay = title + ' ' + h1;
  const missing = kw.toLowerCase().split(/\s+/).filter((w) => !stop.has(w) && !hay.includes(w));
  if (missing.length) add('focus keyword not in title/H1', '/blog/' + slug + ' (' + missing.join(', ') + ')');
}

console.log(`Checked ${pages} pages (${redirects} redirect stubs skipped)\n`);
const keys = Object.keys(issues);
if (!keys.length) console.log('No issues found.');
for (const k of keys) console.log(`${k.padEnd(34)} ${String(issues[k].length).padStart(5)}   e.g. ${issues[k].slice(0, 2).join(', ')}`);
console.log('\nSchema types found:', Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t}:${c}`).join('  '));
