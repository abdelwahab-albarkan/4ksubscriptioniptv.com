// Indexability audit of the built site (dist/). Read-only.
//   npm run build && node scripts/audit-index.mjs [--json]
// 1. canonical / robots / sitemap / hreflang consistency
// 2. near-duplicate analysis of programmatic pages (the usual reason for "Crawled - currently not indexed")
// 3. contextual (in-content) internal links to commercial pages
import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const cfg = JSON.parse(fs.readFileSync('src/data/site-config.json', 'utf8'));
const domain = cfg.domain;
const walk = (d, a = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, a) : f === 'index.html' && a.push(p); } return a; };
const toPath = (f) => { const p = '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, '').replace(/\/$/, ''); return p === '' ? '/' : p; };
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const norm = (u) => { let x = u.replace(domain, '').split('#')[0].split('?')[0]; x = x.replace(/\/+$/, ''); return x === '' ? '/' : x; };

const pages = {};
for (const f of walk(DIST)) {
  const p = toPath(f);
  const h = fs.readFileSync(f, 'utf8');
  const redirect = /http-equiv="refresh"/.test(h) && !/<h1/.test(h);
  const mainM = h.match(/<main id="main-content">([\s\S]*?)<footer/);
  const main = mainM ? mainM[1] : '';
  pages[p] = {
    p, redirect,
    noindex: /name="robots" content="noindex/.test(h),
    canonical: (h.match(/rel="canonical" href="([^"]+)"/) || [])[1],
    hreflang: [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]),
    title: (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '',
    main, text: strip(main),
    mainLinks: [...main.matchAll(/<a\s[^>]*href="(\/[^"#?]*)"/g)].map((m) => norm(m[1])),
    breadcrumbLinks: [...(main.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/) || [''])[0].matchAll(/href="(\/[^"#?]*)"/g)].map((m) => norm(m[1])),
  };
}
const all = Object.values(pages);
const live = all.filter((x) => !x.redirect);
const out = { counts: { pages: live.length, redirectStubs: all.length - live.length, noindex: live.filter((x) => x.noindex).length } };
const problems = {};
const add = (k, v) => (problems[k] ||= []).push(v);

// ---------- 1) canonical, sitemap, hreflang ----------
for (const x of live) {
  if (!x.canonical) { add('missing canonical', x.p); continue; }
  if (!x.canonical.startsWith(domain)) { add('canonical on another host', x.p + ' -> ' + x.canonical); continue; }
  const t = norm(x.canonical);
  if (t !== x.p) {
    add('canonical points to a different URL', x.p + ' -> ' + t);
    const tp = pages[t];
    if (!tp) add('canonical target does not exist', x.p + ' -> ' + t);
    else if (tp.redirect) add('canonical points to a redirect', x.p + ' -> ' + t);
    else if (tp.noindex) add('canonical points to a noindex page', x.p + ' -> ' + t);
  }
}
const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const seen = new Set();
for (const l of locs) {
  const t = norm(l); const pg = pages[t];
  if (seen.has(l)) add('sitemap duplicate', l); seen.add(l);
  if (!l.startsWith('https://')) add('sitemap URL not https', l);
  if (!pg) add('sitemap URL does not exist', l);
  else if (pg.redirect) add('sitemap URL is a redirect', l);
  else if (pg.noindex) add('sitemap URL is noindex', l);
  else if (pg.canonical && norm(pg.canonical) !== t) add('sitemap URL is not its own canonical', l);
}
const inSitemap = new Set(locs.map(norm));
const indexableNotInSitemap = live.filter((x) => !x.noindex && x.p !== '/404' && !inSitemap.has(x.p));
if (indexableNotInSitemap.length) add('indexable page missing from sitemap', indexableNotInSitemap.map((x) => x.p).slice(0, 8).join(', ') + ` (${indexableNotInSitemap.length})`);
// hreflang: reciprocity + self reference + existing targets
for (const x of live.filter((y) => y.hreflang.length)) {
  const self = x.hreflang.find(([, u]) => norm(u) === x.p);
  if (!self) add('hreflang without self reference', x.p);
  for (const [lang, u] of x.hreflang) {
    const t = norm(u); const pg = pages[t];
    if (!pg) { add('hreflang target missing', `${x.p} ${lang} -> ${t}`); continue; }
    if (pg.noindex || pg.redirect) add('hreflang target noindex/redirect', `${x.p} ${lang} -> ${t}`);
    if (!pg.hreflang.some(([, v]) => norm(v) === x.p)) add('hreflang not reciprocal', `${x.p} -> ${t}`);
  }
}
const robots = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
out.robots = { allowsAll: /User-agent: \*\s*\nAllow: \//.test(robots), disallow: (robots.match(/Disallow:.*/g) || []), sitemapRef: robots.includes(domain + '/sitemap.xml') };

// ---------- 2) near-duplicate analysis (programmatic pages) ----------
const shingles = (t, n = 6) => { const w = t.toLowerCase().split(/\s+/); const s = new Set(); for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' ')); return s; };
const jacc = (a, b) => { let i = 0; const [s, l] = a.size < b.size ? [a, b] : [b, a]; for (const x of s) if (l.has(x)) i++; return i / (a.size + b.size - i || 1); };
const prog = live.filter((x) => x.p.startsWith('/iptv/') && !x.noindex);
const dataset = JSON.parse(fs.readFileSync('src/data/pages-data.json', 'utf8'));
const meta = Object.fromEntries(dataset.map((d) => ['/iptv/' + d.slug, d]));
const mask = (x) => {
  const d = meta[x.p]; if (!d) return x.text;
  const tokens = new Set([d.city, d.locationName, d.stateCode, d.region, d.content?.facts?.[0]?.v].filter(Boolean).flatMap((s) => String(s).split(/[,\s]+/)).filter((s) => s.length > 2));
  let t = x.text; for (const tk of tokens) t = t.replace(new RegExp('\\b' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g'), 'X');
  return t;
};
for (const x of prog) { x.sh = shingles(x.text); x.shm = shingles(mask(x)); }
const groupKey = (x) => { const d = meta[x.p]; return d ? [d.category, d.stateCode || d.region || d.countryCode].join('|') : 'other'; };
const groups = {};
for (const x of prog) (groups[groupKey(x)] ||= []).push(x);
const nearest = (x, key) => { let best = 0, who = ''; for (const y of groups[groupKey(x)] || []) { if (y === x) continue; const j = jacc(x[key], y[key]); if (j > best) { best = j; who = y.p; } } return [best, who]; };
const bucket = { geo: [], device: [], sports: [], intent: [] };
for (const x of prog) {
  const d = meta[x.p]; if (!d) continue;
  const [raw, who] = nearest(x, 'sh'); const [msk] = nearest(x, 'shm');
  const k = /geo/.test(d.category) ? 'geo' : d.category;
  (bucket[k] ||= []).push({ p: x.p, raw, masked: msk, who });
}
const stat = (a) => { const s = [...a].sort((x, y) => x - y); return { median: +(s[Math.floor(s.length / 2)] || 0).toFixed(2), p90: +(s[Math.floor(s.length * 0.9)] || 0).toFixed(2), max: +(s[s.length - 1] || 0).toFixed(2) }; };
out.nearDuplicates = Object.fromEntries(Object.entries(bucket).map(([k, a]) => [k, { pages: a.length, rawSimilarityToNearestSibling: stat(a.map((r) => r.raw)), maskedNames: stat(a.map((r) => r.masked)), over80pctRaw: a.filter((r) => r.raw >= 0.8).length, over60pctRaw: a.filter((r) => r.raw >= 0.6).length }]));
// unique sentences: sentences that appear on fewer than 3 pages
const sentenceCount = new Map();
for (const x of prog) for (const s of new Set(x.text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40))) sentenceCount.set(s, (sentenceCount.get(s) || 0) + 1);
const uniq = prog.map((x) => { const ss = x.text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40); const u = ss.filter((s) => sentenceCount.get(s) < 3); return { p: x.p, words: x.text.split(' ').length, uniqueWords: u.join(' ').split(' ').length, sharePct: ss.length ? Math.round((100 * u.length) / ss.length) : 0 }; });
const byCat = {};
for (const u of uniq) { const c = meta[u.p]?.category || 'x'; (byCat[c] ||= []).push(u); }
out.uniqueContent = Object.fromEntries(Object.entries(byCat).map(([c, a]) => [c, { pages: a.length, avgWords: Math.round(a.reduce((n, r) => n + r.words, 0) / a.length), avgUniqueWords: Math.round(a.reduce((n, r) => n + r.uniqueWords, 0) / a.length), avgUniqueSentencePct: Math.round(a.reduce((n, r) => n + r.sharePct, 0) / a.length) }]));
// twins (same place, two intents)
const twinPairs = [];
for (const d of dataset) {
  if (d.category !== 'us-geo') continue;
  if (!d.slug.startsWith('best-iptv-for-firestick')) continue;
  const twin = dataset.find((o) => o.category === 'us-geo' && o.locationName === d.locationName && !o.slug.startsWith('best-iptv-for-firestick'));
  const a = pages['/iptv/' + d.slug], b = twin && pages['/iptv/' + twin.slug];
  if (a?.sh && b?.sh) twinPairs.push(jacc(a.sh, b.sh));
}
out.twinSimilarity_firestickVsCity = { pairs: twinPairs.length, ...stat(twinPairs), over60pct: twinPairs.filter((v) => v >= 0.6).length };
const ukPairs = [];
for (const d of dataset) {
  if (d.category !== 'uk-geo' || !d.slug.startsWith('premier-league-iptv')) continue;
  const twin = dataset.find((o) => o.category === 'uk-geo' && o.locationName === d.locationName && !o.slug.startsWith('premier-league-iptv'));
  const a = pages['/iptv/' + d.slug], b = twin && pages['/iptv/' + twin.slug];
  if (a?.sh && b?.sh) ukPairs.push(jacc(a.sh, b.sh));
}
out.twinSimilarity_plVsUkCity = { pairs: ukPairs.length, ...stat(ukPairs), over60pct: ukPairs.filter((v) => v >= 0.6).length };
out.worstPairs = Object.values(bucket).flat().sort((a, b) => b.raw - a.raw).slice(0, 5).map((r) => `${r.p} ~ ${r.who} (${r.raw.toFixed(2)})`);

// ---------- 3) contextual links to commercial pages ----------
const commercial = ['/pricing', '/uk/pricing', '/iptv-free-trial', '/uk/iptv-free-trial', '/devices/firestick', '/uk/devices/firestick', '/devices/smart-tv', '/devices/apple-tv', '/devices/formuler-mag', '/apps/tivimate', '/apps/iptv-smarters-pro', '/apps/implayer', '/sports/nfl-sunday-ticket', '/sports/nba-league-pass', '/sports/super-bowl', '/sports/ufc-boxing-ppv', '/sports/formula-1', '/uk/sports/premier-league', '/uk/sports/sky-sports', '/uk/sports/tnt-sports', '/alternatives/cable-tv-alternative', '/uk/alternatives/sky-virgin-media', '/features/anti-freeze-4k', '/features/epg-catchup'];
out.contextualInlinks = {};
for (const c of commercial) {
  const from = live.filter((x) => x.p !== c && !x.noindex && x.mainLinks.includes(c) && !(x.breadcrumbLinks.includes(c) && x.mainLinks.filter((l) => l === c).length === 1));
  const types = { iptvPages: from.filter((x) => x.p.startsWith('/iptv/')).length, blog: from.filter((x) => x.p.startsWith('/blog/')).length, other: from.filter((x) => !x.p.startsWith('/iptv/') && !x.p.startsWith('/blog/')).length };
  out.contextualInlinks[c] = { total: from.length, ...types, fromHome: !!(pages['/'] && pages['/'].mainLinks.includes(c)) };
}
const orphans = live.filter((x) => !x.noindex && x.p !== '/404').filter((x) => !live.some((y) => y !== x && y.mainLinks.includes(x.p)));
out.noContextualInlink = orphans.map((x) => x.p).slice(0, 30);
out.noContextualInlinkCount = orphans.length;

out.problems = Object.fromEntries(Object.entries(problems).map(([k, v]) => [k, { count: v.length, examples: v.slice(0, 4) }]));
if (process.argv.includes('--json')) fs.writeFileSync(path.join(process.env.TEMP || '.', 'audit-index.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
