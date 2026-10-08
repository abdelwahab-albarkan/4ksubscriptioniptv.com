import fs from 'fs';
import path from 'path';

const userDomains = [
  'streamb4.com',
  'ukstream4k.com',
  'rokustream.com',
  'ultra8kiptv.org',
  'tvnado2026.com',
  'iptvsmarters-tv.fr',
  '4kgermaniptv.com',
  'germanystreamtv.com',
  'streamgermany4k.com',
  '4kdeutsch.com',
  '4kanbieteriptv.de',
  '4kiptvfr.com',
  '4kspaintv.com',
  'agencyfluxly.com',
  'puroiptv.stream'
];

const competitorKeywords = [
  'trexiptv', 'trex iptv', 'dinoiptv', 'dino iptv', 'skyglass', 'dream4k', 'strongiptv',
  'crystaliptv', 'crystal iptv', 'megaiptv', 'megaott', 'ottplatinum', 'ott platinum',
  'iptvusa.app', 'ukiptv.app', 'iptveurope.net', 'iptv-canada.app', 'iptvaustralia.app',
  'smarter8k', '5glive', 'cyberiptv', 'cyber iptv', 'b1giptv', 'b1g iptv', 'hotiptv', 'hot iptv',
  'iptvresellerpanel.store', '8kiptv.io'
];

function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.astro') {
        scanDir(filePath, fileList);
      }
    } else if (/\.(astro|js|ts|json|md|html)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = scanDir('./src');

console.log('--- SCANNING FOR COMPETITOR KEYWORDS & SUSPICIOUS URLS IN SRC ---');
const findings = [];

for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf-8');
  // check competitor keywords
  for (const kw of competitorKeywords) {
    if (content.toLowerCase().includes(kw)) {
      findings.push({ file: f, keyword: kw });
    }
  }

  // check all http/https occurrences
  const urlMatches = content.match(/https?:\/\/[^\s"'`<>]+/g) || [];
  for (const url of urlMatches) {
    const isAllowed = 
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com') ||
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('schema.org') ||
      url.includes('sitemaps.org') ||
      url.includes('w3.org') ||
      url.includes('wa.me') ||
      url.includes('whatsapp.com') ||
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('astro.build') ||
      userDomains.some(d => url.includes(d));

    if (!isAllowed) {
      findings.push({ file: f, suspiciousUrl: url });
    }
  }
}

console.log('Total findings:', findings.length);
findings.forEach(item => console.log(JSON.stringify(item)));
