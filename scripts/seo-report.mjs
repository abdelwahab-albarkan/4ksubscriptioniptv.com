// Read-only SEO analysis of the built site (dist/), similar to a Rank Math style report.
//   npm run build && node scripts/seo-report.mjs            -> summary data for blog posts
//   node scripts/seo-report.mjs /blog/how-to-setup-iptv-firestick-2026   -> on-page + schema + link report for one page
import fs from 'fs';
import path from 'path';

const DIST = 'dist';
const cfg = JSON.parse(fs.readFileSync('src/data/site-config.json', 'utf8'));
const walk = (d, a = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, a) : f === 'index.html' && a.push(p); } return a; };
const toPath = (f) => '/' + path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, '').replace(/\/$/, '');
const dec = (s) => (s || '').replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const pages = {};
for (const f of walk(DIST)) {
  const p = toPath(f) || '/';
  const h = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/.test(h) && !/<h1/.test(h)) continue;
  const main = (h.match(/<main[\s\S]*?<\/main>/) || [''])[0];
  const body = (h.match(/<body[\s\S]*<\/body>/) || [h])[0];
  const out = [...body.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], text: strip(m[2]) }));
  const mainLinks = [...main.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], text: strip(m[2]) }));
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
  pages[p] = {
    path: p, html: h, main,
    title: dec((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1]),
    desc: dec((h.match(/name="description" content="([^"]*)"/) || [])[1]),
    canonical: (h.match(/rel="canonical" href="([^"]+)"/) || [])[1],
    robots: (h.match(/name="robots" content="([^"]+)"/) || [])[1],
    keywords: dec((h.match(/name="keywords" content="([^"]*)"/) || [])[1]),
    h1: strip((h.match(/<h1[\s\S]*?<\/h1>/) || [''])[0]),
    h2: [...main.matchAll(/<h2[\s\S]*?<\/h2>/g)].map((m) => strip(m[0])),
    text: strip(main || body),
    out, mainLinks, ld,
    imgs: [...main.matchAll(/<img\s[^>]*>/g)].map((m) => m[0]),
  };
}
const isInternal = (u) => u.startsWith('/') || u.startsWith(cfg.domain);
const norm = (u) => { let x = u.replace(cfg.domain, '').split('#')[0].split('?')[0]; x = x.replace(/\/+$/, ''); return x === '' ? '/' : x; };
const inlinks = {};
for (const [p, pg] of Object.entries(pages)) for (const l of pg.out) if (isInternal(l.href)) { const t = norm(l.href); if (t !== p) (inlinks[t] ||= new Set()).add(p); }

const target = process.argv[2];
const blog = Object.keys(pages).filter((p) => /^\/blog\/./.test(p));
const FIRST_SENTENCE = (t) => (t.match(/^(.{20,260}?[.!?])(\s|$)/) || [, t.slice(0, 200)])[1];

if (!target) {
  console.log(JSON.stringify({
    domainCfg: { domain: cfg.domain, trailingSlash: cfg.trailingSlash, gsv: cfg.googleSiteVerification, analytics: cfg.analytics, social: cfg.social },
    totals: { pages: Object.keys(pages).length, blog: blog.length },
    blog: blog.map((p) => {
      const pg = pages[p];
      const first = (pg.main.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || []).map((x) => strip(x)).find((x) => x.length > 60) || '';
      const schemaTypes = pg.ld.flatMap((j) => (j['@graph'] || [j]).map((n) => [].concat(n['@type']).join('+')));
      const internalMain = pg.mainLinks.filter((l) => isInternal(l.href)).length;
      const external = pg.out.filter((l) => !isInternal(l.href) && /^https?:/.test(l.href) && !/fonts\.|cdnjs|wa\.me|googleapis/.test(l.href)).length;
      return {
        path: p, title: pg.title, titleLen: pg.title.length, descLen: pg.desc.length, h1: pg.h1, kw: pg.keywords.split(',')[0],
        words: pg.text.split(' ').length, h2: pg.h2.length, imgs: pg.imgs.length, noAlt: pg.imgs.filter((i) => !/alt="[^"]+"/.test(i)).length,
        schemaTypes: [...new Set(schemaTypes)], internalInMain: internalMain, externalLinks: external,
        inlinks: (inlinks[p] || new Set()).size, inlinksFromContent: [...(inlinks[p] || [])].filter((s) => !/^\/(about|contact)/.test(s)).length,
        firstPara: first.slice(0, 160),
      };
    }),
  }, null, 1));
} else {
  const pg = pages[target];
  if (!pg) { console.error('page not found', target); process.exit(1); }
  const words = pg.text.split(' ').length;
  const links = pg.mainLinks;
  console.log(JSON.stringify({
    path: target, title: pg.title, titleLen: pg.title.length, desc: pg.desc, descLen: pg.desc.length, canonical: pg.canonical, robots: pg.robots,
    h1: pg.h1, h2count: pg.h2.length, h2: pg.h2.slice(0, 12), words,
    imgs: pg.imgs.length, noAlt: pg.imgs.filter((i) => !/alt="[^"]+"/.test(i)).length,
    kwInTitle: pg.keywords.split(',')[0].toLowerCase().split(' ').filter((w) => w.length > 3).every((w) => pg.title.toLowerCase().includes(w)),
    firstPara: (pg.main.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || []).map((x) => strip(x)).find((x) => x.length > 60),
    og: { image: /og:image"/.test(pg.html), type: (pg.html.match(/og:type" content="([^"]+)"/) || [])[1] },
    schema: pg.ld.flatMap((j) => (j['@graph'] || [j]).map((n) => ({ type: [].concat(n['@type']).join('+'), id: n['@id'], keys: Object.keys(n).slice(0, 14) }))),
    links: links.map((l) => ({ ...l, internal: isInternal(l.href), target: isInternal(l.href) ? norm(l.href) : l.href, exists: isInternal(l.href) ? !!pages[norm(l.href)] || /\.(png|jpg|svg|xml|txt)$/.test(l.href) : null })),
  }, null, 1));
}
