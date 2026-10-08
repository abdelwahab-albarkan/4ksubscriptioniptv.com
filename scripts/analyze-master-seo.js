import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataImportsDir = path.join(__dirname, '../data_imports');

function parseCsv(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvLine(line);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    results.push(row);
  }
  return results;
}

function parseCsvLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const csvFiles = fs.readdirSync(dataImportsDir).filter(f => f.endsWith('.csv'));
let totalRows = 0;
const keywordsMap = new Map();

for (const file of csvFiles) {
  const filePath = path.join(dataImportsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(content);
  totalRows += rows.length;

  const isUkFile = file.toLowerCase().includes('uk');

  for (const row of rows) {
    const rawKw = row['Keyword'];
    if (!rawKw) continue;
    const kw = rawKw.toLowerCase().trim();
    const volume = parseInt(row['Volume'], 10) || 0;
    const kd = parseInt(row['Keyword Difficulty'], 10) || 0;
    const cpc = parseFloat(row['CPC (USD)']) || 0;
    const intent = row['Intent'] || 'Commercial';
    const serpFeatures = row['SERP Features'] || '';

    // Determine market
    let market = 'US';
    if (isUkFile || kw.includes('uk') || kw.includes('sky') || kw.includes('tnt sports') || kw.includes('premier league') || kw.includes('virgin media')) {
      market = 'UK';
    } else if (kw.includes('usa') || kw.includes('nfl') || kw.includes('super bowl') || kw.includes('nba') || kw.includes('espn') || kw.includes('mlb')) {
      market = 'US';
    }

    if (!keywordsMap.has(kw) || keywordsMap.get(kw).volume < volume) {
      keywordsMap.set(kw, {
        keyword: rawKw,
        market,
        intent,
        volume,
        kd,
        cpc,
        serpFeatures,
        sourceFile: file
      });
    }
  }
}

console.log(`Total CSV rows analyzed: ${totalRows}`);
console.log(`Total Unique Keywords: ${keywordsMap.size}`);

// Define Genuine Intent Clusters
const clusters = {
  'core-commercial-us': { name: 'US Core Commercial & Pricing', targetUrl: '/pricing', market: 'US', keywords: [] },
  'core-commercial-uk': { name: 'UK Core Commercial & Pricing', targetUrl: '/uk/pricing', market: 'UK', keywords: [] },
  'free-trial-us': { name: 'US IPTV Free Trial 24H', targetUrl: '/iptv-free-trial', market: 'US', keywords: [] },
  'free-trial-uk': { name: 'UK IPTV Free Trial 24H', targetUrl: '/uk/iptv-free-trial', market: 'UK', keywords: [] },
  'firestick-us': { name: 'IPTV for Firestick (USA Guide)', targetUrl: '/devices/firestick', market: 'US', keywords: [] },
  'firestick-uk': { name: 'IPTV for Firestick (UK Guide)', targetUrl: '/uk/devices/firestick', market: 'UK', keywords: [] },
  'tivimate': { name: 'TiviMate IPTV Player Setup & Provider', targetUrl: '/apps/tivimate', market: 'GLOBAL', keywords: [] },
  'smarters-pro': { name: 'IPTV Smarters Pro App Setup', targetUrl: '/apps/iptv-smarters-pro', market: 'GLOBAL', keywords: [] },
  'apple-tv': { name: 'IPTV for Apple TV 4K & iOS', targetUrl: '/devices/apple-tv', market: 'GLOBAL', keywords: [] },
  'smart-tv-samsung-lg': { name: 'IPTV for Samsung & LG Smart TVs', targetUrl: '/devices/smart-tv', market: 'GLOBAL', keywords: [] },
  'formuler-mag': { name: 'IPTV for Formuler Z11 & MAG Box', targetUrl: '/devices/formuler-mag', market: 'GLOBAL', keywords: [] },
  'implayer': { name: 'iMPlayer IPTV Setup', targetUrl: '/apps/implayer', market: 'GLOBAL', keywords: [] },
  'premier-league-uk': { name: 'Premier League 3PM Blackouts IPTV (UK)', targetUrl: '/uk/sports/premier-league', market: 'UK', keywords: [] },
  'sky-sports-uk': { name: 'Sky Sports IPTV Subscription (UK)', targetUrl: '/uk/sports/sky-sports', market: 'UK', keywords: [] },
  'tnt-sports-uk': { name: 'TNT Sports & Champions League (UK)', targetUrl: '/uk/sports/tnt-sports', market: 'UK', keywords: [] },
  'sky-f1': { name: 'Sky Sports F1 4K Live Stream', targetUrl: '/sports/formula-1', market: 'GLOBAL', keywords: [] },
  'nfl-sunday-ticket-us': { name: 'NFL Sunday Ticket & RedZone IPTV (USA)', targetUrl: '/sports/nfl-sunday-ticket', market: 'US', keywords: [] },
  'super-bowl-us': { name: 'Super Bowl 2026 4K Live Stream', targetUrl: '/sports/super-bowl', market: 'US', keywords: [] },
  'nba-league-pass': { name: 'NBA League Pass Live Stream', targetUrl: '/sports/nba-league-pass', market: 'GLOBAL', keywords: [] },
  'dazn-boxing-ufc': { name: 'UFC PPV & DAZN Boxing Live Streams', targetUrl: '/sports/ufc-boxing-ppv', market: 'GLOBAL', keywords: [] },
  'epg-catchup': { name: 'IPTV with 7-Day Catch-Up & TV Guide (EPG)', targetUrl: '/features/epg-catchup', market: 'GLOBAL', keywords: [] },
  'anti-freeze-quality': { name: 'Anti-Freeze v9.2 4K 60FPS Server Infrastructure', targetUrl: '/features/anti-freeze-4k', market: 'GLOBAL', keywords: [] },
  'cord-cutting-alternatives-us': { name: 'Best Cable TV Alternative USA (Cut The Cord)', targetUrl: '/alternatives/cable-tv-alternative', market: 'US', keywords: [] },
  'cord-cutting-alternatives-uk': { name: 'Best Sky TV & Virgin Media Alternative UK', targetUrl: '/uk/alternatives/sky-virgin-media-alternative', market: 'UK', keywords: [] }
};

// Categorize all keywords
for (const [kw, item] of keywordsMap.entries()) {
  let mapped = false;

  if (kw.includes('tivimate')) {
    clusters['tivimate'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('smarters')) {
    clusters['smarters-pro'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('implayer')) {
    clusters['implayer'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('formuler') || kw.includes('mag box') || kw.includes('mag 540') || kw.includes('mag 524')) {
    clusters['formuler-mag'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('firestick') || kw.includes('fire stick') || kw.includes('fire tv')) {
    if (item.market === 'UK' || kw.includes('uk')) {
      clusters['firestick-uk'].keywords.push(item);
    } else {
      clusters['firestick-us'].keywords.push(item);
    }
    mapped = true;
  } else if (kw.includes('apple tv') || kw.includes('ipad') || kw.includes('iphone')) {
    clusters['apple-tv'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('samsung') || kw.includes('lg tv') || kw.includes('smart tv') || kw.includes('tizen') || kw.includes('webos')) {
    clusters['smart-tv-samsung-lg'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('premier league') || kw.includes('epl') || kw.includes('3pm')) {
    clusters['premier-league-uk'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('sky sports f1') || kw.includes('f1')) {
    clusters['sky-f1'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('sky sports') || kw.includes('sky sport')) {
    clusters['sky-sports-uk'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('tnt sports') || kw.includes('champions league') || kw.includes('europa league')) {
    clusters['tnt-sports-uk'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('nfl') || kw.includes('sunday ticket') || kw.includes('redzone')) {
    clusters['nfl-sunday-ticket-us'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('super bowl')) {
    clusters['super-bowl-us'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('nba')) {
    clusters['nba-league-pass'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('dazn') || kw.includes('boxing') || kw.includes('ufc') || kw.includes('fight night') || kw.includes('ppv')) {
    clusters['dazn-boxing-ufc'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('trial') || kw.includes('free trial') || kw.includes('test')) {
    if (item.market === 'UK' || kw.includes('uk')) {
      clusters['free-trial-uk'].keywords.push(item);
    } else {
      clusters['free-trial-us'].keywords.push(item);
    }
    mapped = true;
  } else if (kw.includes('epg') || kw.includes('catchup') || kw.includes('catch up') || kw.includes('tv guide')) {
    clusters['epg-catchup'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('anti freeze') || kw.includes('buffering') || kw.includes('4k') || kw.includes('60fps')) {
    clusters['anti-freeze-quality'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('sky tv') || kw.includes('virgin media')) {
    clusters['cord-cutting-alternatives-uk'].keywords.push(item);
    mapped = true;
  } else if (kw.includes('cable') || kw.includes('cut the cord') || kw.includes('comcast') || kw.includes('spectrum')) {
    clusters['cord-cutting-alternatives-us'].keywords.push(item);
    mapped = true;
  } else if (item.market === 'UK' || kw.includes('uk')) {
    clusters['core-commercial-uk'].keywords.push(item);
    mapped = true;
  } else {
    clusters['core-commercial-us'].keywords.push(item);
    mapped = true;
  }
}

console.log('\n--- CLUSTER BREAKDOWN ---');
let totalMappedKeywords = 0;
let totalClusterVolume = 0;

for (const [id, cluster] of Object.entries(clusters)) {
  const clusterVol = cluster.keywords.reduce((sum, k) => sum + k.volume, 0);
  totalMappedKeywords += cluster.keywords.length;
  totalClusterVolume += clusterVol;
  console.log(`${cluster.name} (${cluster.targetUrl}): ${cluster.keywords.length} keywords | Volume: ${clusterVol.toLocaleString()}/mo`);
}

console.log(`\nTotal keywords mapped into clusters: ${totalMappedKeywords}`);
console.log(`Total Search Demand Volume: ${totalClusterVolume.toLocaleString()} searches/month`);
