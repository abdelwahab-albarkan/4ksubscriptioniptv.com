// Shrinks oversized images in public/images IN PLACE (same file names, so no code changes).
// Originals are copied to _image-originals/ (outside public/) before anything is overwritten.
//
//   node scripts/optimize-images.mjs            # optimize files > 400 KB
//   node scripts/optimize-images.mjs --dry      # only report
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PUB = path.join(root, 'public/images');
const BAK = path.join(root, '_image-originals');
const MIN_BYTES = 400 * 1024;
const MAX_W = { '.jpg': 1600, '.jpeg': 1600, '.webp': 1600, '.png': 1400 };
const dry = process.argv.includes('--dry');

function* walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let before = 0, after = 0, n = 0;
for (const file of walk(PUB)) {
  const ext = path.extname(file).toLowerCase();
  if (!MAX_W[ext]) continue;
  const size = fs.statSync(file).size;
  if (size < MIN_BYTES) continue;

  const input = fs.readFileSync(file); // buffer input: sharp would otherwise keep the file locked on Windows
  const meta = await sharp(input, { failOn: 'none' }).metadata();
  let pipe = sharp(input, { failOn: 'none' }).rotate();
  if (meta.width > MAX_W[ext]) pipe = pipe.resize({ width: MAX_W[ext], withoutEnlargement: true });
  if (ext === '.png') pipe = pipe.png({ compressionLevel: 9, effort: 10, palette: true, quality: 92 });
  else if (ext === '.webp') pipe = pipe.webp({ quality: 80 });
  else pipe = pipe.jpeg({ quality: 80, mozjpeg: true });

  const buf = await pipe.toBuffer();
  const rel = path.relative(PUB, file);
  if (buf.length >= size * 0.9) { console.log(`skip  ${rel} (${(size / 1024).toFixed(0)} KB, no real gain)`); continue; }

  before += size; after += buf.length; n++;
  console.log(`${dry ? 'would ' : ''}opt   ${rel}: ${(size / 1024).toFixed(0)} KB -> ${(buf.length / 1024).toFixed(0)} KB (${meta.width}px${meta.width > MAX_W[ext] ? ' -> ' + MAX_W[ext] + 'px' : ''})`);
  if (dry) continue;
  const dest = path.join(BAK, rel);
  if (!fs.existsSync(dest)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(file, dest); }
  let ok = false;
  for (let t = 0; t < 4 && !ok; t++) {
    try { fs.writeFileSync(file, buf); ok = true; } catch (e) { await new Promise((r) => setTimeout(r, 1500)); }
  }
  if (!ok) { console.log(`FAILED (file locked?) ${rel}`); before -= size; after -= buf.length; n--; }
}
console.log(`\n${n} files: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB${dry ? ' (dry run)' : ''}`);
