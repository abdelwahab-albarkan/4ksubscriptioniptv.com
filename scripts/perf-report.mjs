// Page weight report for the built site (dist/): HTML, inline CSS/JS, JSON-LD, DOM size, images and external requests.
//   npm run build && node scripts/perf-report.mjs [/path ...]
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DIST = 'dist';
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/pricing', '/devices/firestick', '/iptv/best-iptv-los-angeles-ca', '/locations/usa/california', '/blog/what-is-iptv-beginners-guide', '/all-devices'];

const fileFor = (p) => path.join(DIST, p === '/' ? '' : p, 'index.html');
const sizeOf = (u) => { const f = path.join(DIST, decodeURI(u.split('?')[0])); return fs.existsSync(f) ? fs.statSync(f).size : 0; };

for (const p of targets) {
  const f = fileFor(p);
  if (!fs.existsSync(f)) { console.log(p, 'not found'); continue; }
  const raw = fs.readFileSync(f);
  const h = raw.toString('utf8');
  const css = [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((n, m) => n + Buffer.byteLength(m[1]), 0);
  const js = [...h.matchAll(/<script(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].reduce((n, m) => n + Buffer.byteLength(m[1]), 0);
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].reduce((n, m) => n + Buffer.byteLength(m[1]), 0);
  const nodes = (h.match(/<[a-zA-Z][^>]*>/g) || []).length;
  const imgTags = [...h.matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);
  const imgSrc = [...new Set(imgTags.map((t) => (t.match(/\ssrc="([^"]+)"/) || [])[1]).filter((s) => s && s.startsWith('/')))];
  const lazy = imgTags.filter((t) => /loading="lazy"/.test(t)).length;
  const noDims = imgTags.filter((t) => !/\swidth=/.test(t) || !/\sheight=/.test(t)).length;
  const imgBytes = imgSrc.reduce((n, s) => n + sizeOf(s), 0);
  const eager = imgSrc.filter((s) => !imgTags.some((t) => t.includes(`src="${s}"`) && /loading="lazy"/.test(t)));
  const eagerBytes = eager.reduce((n, s) => n + sizeOf(s), 0);
  const cssLinks = [...h.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const ext = [...new Set([...h.matchAll(/(?:href|src)="(https?:\/\/(?!4ksubscriptioniptv)[^"]+)"/g)].map((m) => new URL(m[1]).host))].filter((x) => !/wa\.me/.test(x));
  const extResources = [...new Set([...h.matchAll(/<(?:link|script)[^>]+(?:href|src)="(https?:\/\/(?:fonts\.|cdnjs)[^"]+)"/g)].map((m) => m[1].slice(0, 70)))];
  console.log(`\n${p}`);
  console.log(`  HTML ${kb(raw.length)} (gzip ${kb(gz(raw))}) | inline CSS ${kb(css)} | inline JS ${kb(js)} | JSON-LD ${kb(ld)} | tags ${nodes}`);
  console.log(`  images ${imgSrc.length} (${kb(imgBytes)} on disk; ${eager.length} not lazy = ${kb(eagerBytes)}) | <img> without width/height: ${noDims}/${imgTags.length} | lazy: ${lazy}`);
  console.log(`  external hosts: ${ext.join(', ') || 'none'}`);
  console.log(`  render-blocking-ish external: ${extResources.join(' | ')}`);
  console.log(`  local stylesheets: ${cssLinks.filter((x) => x.startsWith('/')).map((x) => x + ' ' + kb(sizeOf(x))).join(', ') || 'all inline'}`);
}
