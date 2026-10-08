// Generates brand assets into public/: logo, favicons, apple-touch-icon, web manifest and the default OG image.
// Edit the constants below, then run:  node scripts/generate-brand-assets.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PUB = path.join(root, 'public');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-config.json'), 'utf8'));

const NAME_A = '4K';
const NAME_B = 'Subscription';
const NAME_C = 'IPTV';
const HOST = cfg.domain.replace(/^https?:\/\//, '');
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const BOLT = 'M13.2 2 4 13.6h6.2L9.2 22l9.6-12.2h-6.1z';

const markSvg = (size = 512, radius = 0.22) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
  <rect width="24" height="24" rx="${24 * radius}" fill="url(#g)"/>
  <path d="${BOLT}" fill="#fff" transform="translate(12 12) scale(0.62) translate(-11.4 -12)"/>
</svg>`;

const write = (rel, buf) => { fs.mkdirSync(path.dirname(path.join(PUB, rel)), { recursive: true }); fs.writeFileSync(path.join(PUB, rel), buf); console.log('wrote public/' + rel); };

// 1) SVG favicon / logo mark
write('favicon.svg', markSvg(64));
write('logo-mark.svg', markSvg(512));

// 2) PNG icons
const png = (size) => sharp(Buffer.from(markSvg(size))).png().toBuffer();
write('icon-192.png', await png(192));
write('icon-512.png', await png(512));
write('apple-touch-icon.png', await sharp(Buffer.from(markSvg(180, 0))).png().toBuffer()); // iOS rounds corners itself
const f32 = await png(32), f48 = await png(48);
write('favicon-32.png', f32);

// 3) favicon.ico (PNG-compressed entries: 32 and 48)
{
  const imgs = [[32, f32], [48, f48]];
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let offset = 6 + imgs.length * 16;
  const dirs = [], datas = [];
  for (const [s, b] of imgs) {
    const d = Buffer.alloc(16);
    d.writeUInt8(s, 0); d.writeUInt8(s, 1); d.writeUInt8(0, 2); d.writeUInt8(0, 3);
    d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(b.length, 8); d.writeUInt32LE(offset, 12);
    offset += b.length; dirs.push(d); datas.push(b);
  }
  write('favicon.ico', Buffer.concat([head, ...dirs, ...datas]));
}

// 4) Horizontal logo (transparent) for schema / emails
const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
  <rect width="1200" height="300" rx="36" fill="#070a14"/>
  <rect x="50" y="50" width="200" height="200" rx="46" fill="url(#g)"/>
  <path d="${BOLT}" fill="#fff" transform="translate(150 150) scale(5.2) translate(-11.4 -12)"/>
  <text x="290" y="165" font-family="${FONT}" font-size="96" font-weight="800" fill="#ffffff" letter-spacing="-2">${NAME_A}<tspan fill="#38bdf8">${NAME_B}</tspan></text>
  <text x="294" y="228" font-family="${FONT}" font-size="42" font-weight="700" fill="#94a3b8" letter-spacing="16">${NAME_C}</text>
</svg>`;
write('logo.png', await sharp(Buffer.from(logoSvg)).png().toBuffer());

// 5) Default Open Graph image 1200x630
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1226"/><stop offset="1" stop-color="#05070f"/></linearGradient>
    <radialGradient id="g1" cx="0.15" cy="0.1" r="0.7"><stop offset="0" stop-color="#3b82f6" stop-opacity="0.55"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0.95" cy="0.95" r="0.6"><stop offset="0" stop-color="#06b6d4" stop-opacity="0.45"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/></radialGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <g stroke="#ffffff" stroke-opacity="0.04">${Array.from({ length: 22 }, (_, i) => `<path d="M${i * 56} 0V630"/>`).join('')}${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 56}H1200"/>`).join('')}</g>
  <rect x="80" y="86" width="116" height="116" rx="28" fill="url(#g)"/>
  <path d="${BOLT}" fill="#fff" transform="translate(138 144) scale(3.2) translate(-11.4 -12)"/>
  <text x="226" y="170" font-family="${FONT}" font-size="64" font-weight="800" fill="#fff" letter-spacing="-1.5">${NAME_A}<tspan fill="#38bdf8">${NAME_B}</tspan> ${NAME_C}</text>
  <text x="80" y="330" font-family="${FONT}" font-size="76" font-weight="800" fill="#ffffff" letter-spacing="-2">Live sports, movies</text>
  <text x="80" y="418" font-family="${FONT}" font-size="76" font-weight="800" fill="#38bdf8" letter-spacing="-2">and 4K streaming.</text>
  <g font-family="${FONT}" font-size="28" font-weight="700" fill="#e2e8f0">
    <rect x="80" y="468" width="230" height="56" rx="28" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18"/>
    <text x="195" y="506" text-anchor="middle">Free trial</text>
    <rect x="326" y="468" width="260" height="56" rx="28" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18"/>
    <text x="456" y="506" text-anchor="middle">Any device</text>
    <rect x="602" y="468" width="260" height="56" rx="28" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18"/>
    <text x="732" y="506" text-anchor="middle">24/7 support</text>
  </g>
  <text x="80" y="590" font-family="${FONT}" font-size="30" font-weight="600" fill="#94a3b8">${HOST}</text>
</svg>`;
write('og-default.png', await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toBuffer());

// 6) Web manifest
write('site.webmanifest', JSON.stringify({
  name: `${NAME_A}${NAME_B} ${NAME_C}`,
  short_name: `${NAME_A}${NAME_B}`,
  description: 'Live sports, movies and 4K streaming on any device.',
  start_url: '/',
  display: 'standalone',
  background_color: '#070a14',
  theme_color: '#070a14',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2));
