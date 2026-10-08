// Internal-link graph audit on the built site (dist/).
//   npm run build && node scripts/link-audit.mjs
// Reports: click depth from the home page, pages with few incoming links, orphans, link-heavy pages, hub coverage.
import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const walk = (d, a = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, a) : f.endsWith('.html') && a.push(p); } return a; };
const toPath = (f) => '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
const norm = (u) => { let p = u.split('#')[0].split('?')[0]; if (!p) return null; p = p.replace(/\/+$/, ''); return p === '' ? '/' : p; };

const files = walk(DIST);
const pages = new Map(); // path -> { out:Set, noindex, redirect }
for (const f of files) {
  const p = toPath(f) || '/';
  const h = fs.readFileSync(f, 'utf8');
  const redirect = /http-equiv="refresh"/.test(h) && !/<h1/.test(h);
  const noindex = /name="robots" content="noindex/.test(h);
  // only links in the main content, header, footer (all of <body>)
  const body = (h.match(/<body[\s\S]*<\/body>/) || [h])[0];
  const out = new Set();
  for (const m of body.matchAll(/\shref="(\/[^"]*)"/g)) {
    const t = norm(m[1]);
    if (!t || /\.(xml|txt|png|jpg|svg|ico|webp|json|css|js)$/i.test(t) || t.startsWith('/_astro') || t.startsWith('/images')) continue;
    out.add(t);
  }
  pages.set(p === '' ? '/' : p, { out, noindex, redirect });
}

const indexable = [...pages].filter(([, v]) => !v.noindex && !v.redirect).map(([k]) => k);
const inlinks = new Map(indexable.map((p) => [p, new Set()]));
for (const [p, v] of pages) { if (v.redirect) continue; for (const t of v.out) if (inlinks.has(t) && t !== p) inlinks.get(t).add(p); }

// BFS depth from home
const depth = new Map([['/', 0]]); const q = ['/'];
while (q.length) { const c = q.shift(); const v = pages.get(c); if (!v) continue; for (const t of v.out) if (pages.has(t) && !depth.has(t) && !pages.get(t).redirect) { depth.set(t, depth.get(c) + 1); q.push(t); } }

const hist = {}; for (const p of indexable) { const d = depth.has(p) ? depth.get(p) : 'unreachable'; hist[d] = (hist[d] || 0) + 1; }
const orphans = indexable.filter((p) => inlinks.get(p).size === 0);
const weak = indexable.filter((p) => inlinks.get(p).size > 0 && inlinks.get(p).size < 3);
const counts = indexable.map((p) => inlinks.get(p).size).sort((a, b) => a - b);
const median = counts[Math.floor(counts.length / 2)];
const topIn = indexable.map((p) => [p, inlinks.get(p).size]).sort((a, b) => b[1] - a[1]).slice(0, 8);
const heavy = [...pages].filter(([k, v]) => !v.redirect).map(([k, v]) => [k, v.out.size]).sort((a, b) => b[1] - a[1]).slice(0, 6);

console.log(`Indexable pages: ${indexable.length}`);
console.log('Click depth from home:', Object.entries(hist).map(([d, c]) => `${d}: ${c}`).join('   '));
console.log(`Incoming internal links per page -> median ${median}, orphans (0): ${orphans.length}, weak (<3): ${weak.length}`);
console.log('Most linked-to:', topIn.map(([p, n]) => `${p} (${n})`).join(' | '));
console.log('Most outgoing links:', heavy.map(([p, n]) => `${p} (${n})`).join(' | '));
const byType = (re) => indexable.filter((p) => re.test(p));
for (const [name, re] of [['/iptv/* pages', /^\/iptv\//], ['blog posts', /^\/blog\/./], ['cluster pages', /^\/(devices|apps|sports|features|alternatives|uk\/(devices|sports|alternatives))\//]]) {
  const set = byType(re); const avg = set.length ? (set.reduce((s, p) => s + inlinks.get(p).size, 0) / set.length).toFixed(1) : '-';
  const d = set.length ? (set.reduce((s, p) => s + (depth.get(p) ?? 9), 0) / set.length).toFixed(1) : '-';
  console.log(`  ${name.padEnd(16)} ${String(set.length).padStart(5)} pages, avg inlinks ${avg}, avg depth ${d}`);
}
if (process.argv.includes('--list')) { console.log('\nOrphans:'); orphans.slice(0, 40).forEach((p) => console.log('  ' + p)); console.log('\nWeak:'); weak.slice(0, 40).forEach((p) => console.log('  ' + p + ' (' + inlinks.get(p).size + ')')); }
