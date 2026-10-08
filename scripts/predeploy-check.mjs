// Pre-deploy checks on the built site (dist/):
//   - every local href/src/srcset/css url() resolves to a real file
//   - no duplicate id="" on a page, every #anchor has a target
//   - hreflang alternates point to pages that exist
//   - no leftover placeholders / old brand / test data shipped
//   - largest files, total size
//   npm run build && node scripts/predeploy-check.mjs
import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const cfg = JSON.parse(fs.readFileSync('src/data/site-config.json', 'utf8'));
const domain = cfg.domain;

const walk = (d, a = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, a) : a.push(p); } return a; };
const all = walk(DIST);
const norm = (p) => p.split(path.sep).join('/');
const fileSet = new Set(all.map(norm));
const exists = (u) => {
  u = decodeURI(u.split('#')[0].split('?')[0]);
  if (!u) return true;
  const p = norm(path.join(DIST, u));
  return fileSet.has(p) || fileSet.has(p.replace(/\/$/, '') + '/index.html') || fileSet.has(p + '.html');
};
const pageExists = (url) => exists(url.replace(domain, '') || '/');

const bad = {};
const add = (k, v) => { (bad[k] ||= new Set()).add(v); };
const htmls = all.filter((f) => f.endsWith('.html'));
const short = (f) => norm(f).replace('dist', '').replace('/index.html', '') || '/';

for (const f of htmls) {
  const h = fs.readFileSync(f, 'utf8');
  const page = short(f);
  // --- local assets & links
  for (const m of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/.test(u)) continue;
    if (!u.startsWith('/')) continue;
    if (!exists(u)) add('missing local file/page', `${u}  (on ${page})`);
  }
  for (const m of h.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u.startsWith('/') && !exists(u)) add('missing srcset file', `${u} (on ${page})`); }
  // --- ids
  const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) { if (seen.has(id)) add('duplicate id on a page', `#${id} (on ${page})`); seen.add(id); }
  for (const m of h.matchAll(/href="#([^"]+)"/g)) if (!seen.has(m[1])) add('anchor without target', `#${m[1]} (on ${page})`);
  // --- hreflang
  for (const m of h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) if (m[2].startsWith(domain) && !pageExists(m[2])) add('hreflang points to a missing page', `${m[1]} -> ${m[2].replace(domain, '')} (on ${page})`);
  // --- leftovers
  if (/PuroStream|puroiptv|PuroIPTV/.test(h)) add('old brand text', page);
  if (/lorem ipsum|TODO:|FIXME|undefined<|\[object Object\]|NaN</i.test(h)) add('placeholder / broken text', page);
  if (/localhost|127\.0\.0\.1/.test(h)) add('localhost reference', page);
}

// --- URL policy: internal links, canonicals and sitemap must all follow trailingSlash
const slashPolicy = !!cfg.trailingSlash;
for (const f of htmls) {
  const h = fs.readFileSync(f, 'utf8'); const page = short(f);
  if (/http-equiv="refresh"/.test(h) && !/<h1/.test(h)) continue;
  for (const m of h.matchAll(/\shref="(\/[^"#?]*)"/g)) {
    const u = m[1];
    if (u === '/' || /^\/(_astro|images|flags|data)\//.test(u) || /\.[a-z0-9]{2,5}$/i.test(u) || u.startsWith('//')) continue;
    if (slashPolicy !== u.endsWith('/')) add('internal link breaks the URL policy', u + ' (on ' + page + ')');
  }
  const canon = (h.match(/rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon && canon.startsWith(domain) && canon !== domain + '/') { if (slashPolicy !== canon.endsWith('/')) add('canonical breaks the URL policy', canon); }
}

// --- files that should not be shipped
for (const f of all) {
  const n = norm(f);
  if (/\.(csv|xlsx|map|log|bak|env)$/i.test(n)) add('data/debug file in dist', n.replace('dist', ''));
  if (/DATAUSUK|data_imports|_image-originals|node_modules/.test(n)) add('private folder in dist', n.replace('dist', ''));
}

// --- required root files
for (const r of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest', 'og-default.png', 'logo.png']) if (!fileSet.has(`${DIST}/${r}`)) add('required file missing', r);

// --- robots / sitemap sanity
const robots = fs.readFileSync(`${DIST}/robots.txt`, 'utf8');
if (!robots.includes(`${domain}/sitemap.xml`)) add('robots.txt does not reference the sitemap', robots.trim());
if (/Disallow:\s*\/\s*$/m.test(robots)) add('robots.txt blocks the whole site', robots.trim());
const sm = fs.readFileSync(`${DIST}/sitemap.xml`, 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const l of locs) { if (!l.startsWith(domain)) add('sitemap URL on another domain', l); else if (!pageExists(l)) add('sitemap URL does not exist', l); }
if (new Set(locs).size !== locs.length) add('sitemap has duplicate URLs', String(locs.length - new Set(locs).size));

const size = all.reduce((s, f) => s + fs.statSync(f).size, 0);
const big = all.map((f) => [fs.statSync(f).size, norm(f).replace('dist', '')]).sort((a, b) => b[0] - a[0]).slice(0, 6);

console.log(`Pages: ${htmls.length}   Files: ${all.length}   Total: ${(size / 1048576).toFixed(1)} MB   Sitemap URLs: ${locs.length}`);
console.log('Largest files:', big.map(([s, n]) => `${(s / 1024).toFixed(0)}KB ${n}`).join(' | '));
const keys = Object.keys(bad);
if (!keys.length) console.log('\nAll checks passed.');
for (const k of keys) { console.log(`\n${k} (${bad[k].size})`); [...bad[k]].slice(0, 6).forEach((v) => console.log('   ' + v)); }
process.exitCode = keys.length ? 1 : 0;
