// Runs automatically before `astro build` (npm "prebuild").
// Merges the generated redirects (src/data/redirects.json) with your manual ones
// (src/data/seo/redirects.manual.json) and writes:
//   public/_redirects   real 301s for Netlify and Cloudflare Pages
//   vercel.json         the same for Vercel (+ URL policy and headers)
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('src/data/site-config.json', 'utf8'));
const slash = !!cfg.trailingSlash;
const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {});
const generated = read('src/data/redirects.json');
const manual = Object.fromEntries(Object.entries(read('src/data/seo/redirects.manual.json')).filter(([k]) => !k.startsWith('_')));
const all = { ...generated, ...manual };

const pol = (p) => (p === '/' ? '/' : slash ? p.replace(/\/+$/, '') + '/' : p.replace(/\/+$/, ''));
const rules = Object.entries(all).map(([from, to]) => [pol(from), /^https?:/.test(to) ? to : pol(to)]);

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/_redirects', rules.map(([a, b]) => `${a} ${b} 301`).join('\n') + (rules.length ? '\n' : ''));

const vercel = {
  cleanUrls: true,
  trailingSlash: slash,
  redirects: rules.map(([source, destination]) => ({ source, destination, permanent: true })),
  headers: [
    { source: '/images/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/flags/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/_astro/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] },
  ],
};
fs.writeFileSync('vercel.json', JSON.stringify(vercel, null, 2) + '\n');
console.log(`redirects: ${rules.length} rules -> public/_redirects, vercel.json (trailingSlash=${slash})`);
