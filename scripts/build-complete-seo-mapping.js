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

console.log('Reading and parsing all 37 Semrush CSV files from data_imports...');

const csvFiles = fs.readdirSync(dataImportsDir).filter(f => f.endsWith('.csv'));
const keywordsMap = new Map();

for (const file of csvFiles) {
  const filePath = path.join(dataImportsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(content);

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

console.log(`Parsed ${keywordsMap.size} unique keywords from Semrush!`);

// Define Complete Master Page Clusters
const clusterDefinitions = [
  {
    id: 'core-commercial-us',
    url: '/pricing',
    market: 'US',
    priority: 'P0',
    pageType: 'Commercial Hub',
    primaryKeyword: 'best iptv subscription',
    title: 'Best IPTV Subscription USA (2026) - 25,000+ 4K Channels & Anti-Freeze',
    metaDescription: 'Get the top-rated IPTV subscription in USA for 2026. Stream 25,000+ live HD/4K channels, NFL Sunday Ticket, NBA, ESPN & 100k+ VODs. Instant 3-min activation.',
    h1: 'Best IPTV Subscription & Provider in USA (2026)',
    targetFilter: (kw, item) => !kw.includes('uk') && (kw.includes('subscription') || kw.includes('provider') || kw.includes('buy iptv') || kw.includes('service') || kw.includes('best iptv'))
  },
  {
    id: 'core-commercial-uk',
    url: '/uk/pricing',
    market: 'UK',
    priority: 'P0',
    pageType: 'Commercial Hub',
    primaryKeyword: 'best iptv uk',
    title: 'Best IPTV Subscription UK (2026) - Sky Sports, TNT & Premier League 4K',
    metaDescription: 'Discover the #1 IPTV subscription in the UK. Stream Sky Sports, TNT Sports, 3PM Premier League football, BBC & 25,000+ channels with Anti-Freeze v9.2 in GBP £.',
    h1: 'Best IPTV Subscription in United Kingdom (2026 Edition)',
    targetFilter: (kw, item) => item.market === 'UK' && (kw.includes('uk') || kw.includes('cheap iptv uk') || kw.includes('iptv subscription uk') || kw.includes('best iptv uk'))
  },
  {
    id: 'free-trial-us',
    url: '/iptv-free-trial',
    market: 'US',
    priority: 'P0',
    pageType: 'Conversion Trial Funnel',
    primaryKeyword: 'iptv free trial',
    title: '24-Hour IPTV Free Trial USA (2026) - Instant Test Access No Credit Card',
    metaDescription: 'Request an instant 24-hour IPTV free trial in the USA. Test 25,000+ live channels, sports & VOD movies before subscribing. Zero commitment, 3-min setup.',
    h1: '24-Hour IPTV Free Trial (Instant Activation USA)',
    targetFilter: (kw, item) => !kw.includes('uk') && (kw.includes('trial') || kw.includes('free trial') || kw.includes('test'))
  },
  {
    id: 'free-trial-uk',
    url: '/uk/iptv-free-trial',
    market: 'UK',
    priority: 'P0',
    pageType: 'Conversion Trial Funnel',
    primaryKeyword: 'iptv free trial uk',
    title: '24-Hour IPTV Free Trial UK (2026) - Test Sky Sports & TNT Free',
    metaDescription: 'Get a 24-hour IPTV free trial in the UK. Test all Sky Sports channels, TNT Sports, 3PM Premier League football and movies. Instant delivery to WhatsApp.',
    h1: '24-Hour IPTV Free Trial in United Kingdom',
    targetFilter: (kw, item) => item.market === 'UK' && (kw.includes('trial') || kw.includes('free trial'))
  },
  {
    id: 'devices-firestick-us',
    url: '/devices/firestick',
    market: 'US',
    priority: 'P0',
    pageType: 'Device Setup Guide',
    primaryKeyword: 'iptv for firestick',
    title: 'Best IPTV for Amazon Firestick USA (2026 Complete Setup Guide)',
    h1: 'Best IPTV Service for Amazon Firestick 4K & Cube (USA)',
    metaDescription: 'Complete step-by-step guide to install and stream IPTV on Amazon Firestick 4K in USA. Downloader codes, TiviMate & Smarters Pro configuration for zero lag.',
    targetFilter: (kw, item) => item.market === 'US' && (kw.includes('firestick') || kw.includes('fire stick') || kw.includes('fire tv') || kw.includes('downloader'))
  },
  {
    id: 'devices-firestick-uk',
    url: '/uk/devices/firestick',
    market: 'UK',
    priority: 'P0',
    pageType: 'Device Setup Guide',
    primaryKeyword: 'best iptv for firestick uk',
    title: 'Best IPTV for Amazon Firestick UK (2026 Installation & Review)',
    h1: 'Best IPTV Subscription for Amazon Firestick in the UK',
    metaDescription: 'Easily watch Sky Sports, TNT Sports & live Premier League on your UK Amazon Firestick. Instant Downloader setup code, M3U playlist & Xtream Codes login.',
    targetFilter: (kw, item) => item.market === 'UK' && (kw.includes('firestick') || kw.includes('fire stick'))
  },
  {
    id: 'apps-tivimate',
    url: '/apps/tivimate',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Player Setup Guide',
    primaryKeyword: 'tivimate iptv provider',
    title: 'Best IPTV Provider for TiviMate Premium (2026 Xtream API Guide)',
    h1: 'Best IPTV Subscription for TiviMate IPTV Player',
    metaDescription: 'Looking for the best IPTV service optimized for TiviMate Premium? Enjoy ultra-fast EPG loading, catch-up, multi-screen, and zero buffering on Android TV.',
    targetFilter: (kw, item) => kw.includes('tivimate')
  },
  {
    id: 'apps-smarters-pro',
    url: '/apps/iptv-smarters-pro',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Player Setup Guide',
    primaryKeyword: 'iptv smarters pro subscription',
    title: 'IPTV Smarters Pro Setup Guide & Subscription (2026 Official)',
    h1: 'Best IPTV Service for IPTV Smarters Pro (iOS, Android, Firestick)',
    metaDescription: 'Connect to 25,000+ live channels on IPTV Smarters Pro using Xtream Codes API. High bitrate 4K streams with instant automated delivery.',
    targetFilter: (kw, item) => kw.includes('smarters')
  },
  {
    id: 'apps-implayer',
    url: '/apps/implayer',
    market: 'GLOBAL',
    priority: 'P2',
    pageType: 'Player Setup Guide',
    primaryKeyword: 'implayer iptv',
    title: 'iMPlayer IPTV Player Setup & Provider (2026 Xtream Codes)',
    h1: 'Best IPTV Provider for iMPlayer TV (Android TV & Firestick)',
    metaDescription: 'Setup iMPlayer with our premium high-speed IPTV server. Full cloud sync, advanced EPG, recording, and 4K Ultra HD channel playback.',
    targetFilter: (kw, item) => kw.includes('implayer')
  },
  {
    id: 'devices-apple-tv',
    url: '/devices/apple-tv',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Device Setup Guide',
    primaryKeyword: 'iptv apple tv 4k',
    title: 'Best IPTV for Apple TV 4K & iOS (2026 tvOS 18 Guide)',
    h1: 'Best IPTV Subscription for Apple TV 4K, iPhone & iPad',
    metaDescription: 'Stream premium 4K IPTV on Apple TV 4K using IPTVX, GSE Smart IPTV, and Smarters Player Lite. Crystal clear 60FPS sports and 100k+ VOD movies.',
    targetFilter: (kw, item) => kw.includes('apple tv') || kw.includes('ipad') || kw.includes('iphone')
  },
  {
    id: 'devices-smart-tv',
    url: '/devices/smart-tv',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Device Setup Guide',
    primaryKeyword: 'iptv samsung smart tv',
    title: 'IPTV for Samsung & LG Smart TVs (2026 Tizen & webOS Setup)',
    h1: 'Best IPTV Service for Samsung & LG Smart TVs',
    metaDescription: 'How to install IPTV on Samsung Smart TV (Tizen) and LG Smart TV (webOS) using Smart IPTV, IBO Player, and Nanomid. No external box needed.',
    targetFilter: (kw, item) => kw.includes('samsung') || kw.includes('lg tv') || kw.includes('smart tv') || kw.includes('tizen') || kw.includes('webos')
  },
  {
    id: 'devices-formuler-mag',
    url: '/devices/formuler-mag',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Device Setup Guide',
    primaryKeyword: 'formuler z11 iptv',
    title: 'IPTV for Formuler Z11 Pro & MAG Box (2026 Stalker & MOL3)',
    h1: 'Best IPTV Provider for Formuler (MOL3) & MAG Boxes (Stalker)',
    metaDescription: 'Dedicated portal URL and MAC address activation for Formuler Z11 Pro Max, MyTVOnline 3 (MOL3), and MAG 540 / 524 set-top boxes.',
    targetFilter: (kw, item) => kw.includes('formuler') || kw.includes('mag box') || kw.includes('mag 540') || kw.includes('mag 524') || kw.includes('mag 322')
  },
  {
    id: 'sports-premier-league-uk',
    url: '/uk/sports/premier-league',
    market: 'UK',
    priority: 'P0',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'premier league iptv uk',
    title: 'Watch Premier League 3PM Matches IPTV (2026 UK Live Stream 4K)',
    h1: 'Watch Every Premier League 3PM Blackout Match in 4K',
    metaDescription: 'Stream every Premier League fixture live, including Saturday 3PM blackout kickoffs. Zero buffering on Sky Sports, TNT Sports & 4K UHD international feeds.',
    targetFilter: (kw, item) => kw.includes('premier league') || kw.includes('epl') || kw.includes('3pm') || kw.includes('chelsea') || kw.includes('manchester city') || kw.includes('barcelona') || kw.includes('la liga')
  },
  {
    id: 'sports-sky-sports-uk',
    url: '/uk/sports/sky-sports',
    market: 'UK',
    priority: 'P0',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'sky sports iptv subscription',
    title: 'Sky Sports IPTV Subscription UK (2026) - All 11 Sky Channels in 4K',
    h1: 'Stream All Sky Sports Channels Live in 4K UHD 50FPS',
    metaDescription: 'Get full access to Sky Sports Main Event, Premier League, Football, F1, Cricket, Golf & Action in uncompressed 4K 50FPS for just £10.99/mo.',
    targetFilter: (kw, item) => kw.includes('sky sports') && !kw.includes('f1')
  },
  {
    id: 'sports-tnt-sports-uk',
    url: '/uk/sports/tnt-sports',
    market: 'UK',
    priority: 'P0',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'tnt sports iptv',
    title: 'TNT Sports & UEFA Champions League IPTV (2026 Live Stream)',
    h1: 'Stream TNT Sports 1, 2, 3, 4 & Ultimate 4K Live',
    metaDescription: 'Watch all UEFA Champions League, Europa League, Serie A, and Premiership Rugby matches on TNT Sports in 4K HDR with zero lag.',
    targetFilter: (kw, item) => kw.includes('tnt sports') || kw.includes('champions league') || kw.includes('europa league')
  },
  {
    id: 'sports-nfl-sunday-ticket-us',
    url: '/sports/nfl-sunday-ticket',
    market: 'US',
    priority: 'P0',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'nfl sunday ticket iptv',
    title: 'NFL Sunday Ticket & RedZone IPTV (2026 Live Streams in 60FPS)',
    h1: 'Stream NFL Sunday Ticket & RedZone Live with Zero Blackouts',
    metaDescription: 'Watch every touchdown from every NFL game every Sunday afternoon. Full access to CBS, FOX, NBC Sunday Night Football, ESPN Monday Night Football in 60FPS.',
    targetFilter: (kw, item) => kw.includes('nfl') || kw.includes('sunday ticket') || kw.includes('redzone') || kw.includes('eagles') || kw.includes('steelers') || kw.includes('ravens')
  },
  {
    id: 'sports-super-bowl-us',
    url: '/sports/super-bowl',
    market: 'US',
    priority: 'P1',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'super bowl iptv',
    title: 'Watch Super Bowl 2026 Live Stream on IPTV - Native 4K UHD',
    h1: 'Stream Super Bowl 2026 Live in 4K Ultra HD & HDR',
    metaDescription: 'Watch Super Bowl 2026 live without cable. Direct uncompressed 4K feed with halftime show and US commercials. Instant setup on all devices.',
    targetFilter: (kw, item) => kw.includes('super bowl')
  },
  {
    id: 'sports-nba-league-pass',
    url: '/sports/nba-league-pass',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'nba league pass iptv',
    title: 'NBA League Pass & Playoffs Live Stream (2026 60FPS IPTV)',
    h1: 'Watch Every NBA Game Live with NBA League Pass IPTV',
    metaDescription: 'Stream out-of-market NBA games, NBA Playoffs, and the NBA Finals in silky-smooth 60FPS. Includes home and away broadcast feeds and regional networks.',
    targetFilter: (kw, item) => kw.includes('nba') || kw.includes('nbabite')
  },
  {
    id: 'sports-ufc-boxing-ppv',
    url: '/sports/ufc-boxing-ppv',
    market: 'GLOBAL',
    priority: 'P0',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'ufc ppv iptv',
    title: 'Watch UFC PPV & DAZN Boxing Live Streams (2026 All Events Included)',
    h1: 'Stream UFC Numbered PPVs & World Championship Boxing',
    metaDescription: 'Every UFC Main Card, Fight Night, DAZN Boxing clash, and Queensberry PPV included with your subscription at zero extra cost. Stream in 4K 60FPS.',
    targetFilter: (kw, item) => kw.includes('ufc') || kw.includes('dazn') || kw.includes('boxing') || kw.includes('fight night') || kw.includes('ppv')
  },
  {
    id: 'sports-sky-f1',
    url: '/sports/formula-1',
    market: 'GLOBAL',
    priority: 'P1',
    pageType: 'Sports Broadcast Hub',
    primaryKeyword: 'sky sports f1 iptv',
    title: 'Watch Formula 1 Live on Sky Sports F1 4K (2026 Grand Prix Streams)',
    h1: 'Stream Every Formula 1 Grand Prix Live in 4K 50FPS',
    metaDescription: 'Watch all F1 Practice, Qualifying, Sprint races, and Sunday Grand Prix live on Sky Sports F1 4K and F1 TV Pro with zero ads during live racing.',
    targetFilter: (kw, item) => kw.includes('sky sports f1') || (kw.includes('f1') && !kw.includes('fight'))
  },
  {
    id: 'alternatives-cable-tv-us',
    url: '/alternatives/cable-tv-alternative',
    market: 'US',
    priority: 'P1',
    pageType: 'Alternative / Cord Cutting',
    primaryKeyword: 'best cable tv alternative',
    title: 'Best Cable TV Alternative USA (2026) - Save $1,500/Year with IPTV',
    h1: 'Replace Comcast, Spectrum & DirecTV with Premium IPTV',
    metaDescription: 'Cut the cord and save over 90% per month. Get all 25,000+ local, sports, movie, and news channels without annual contracts, equipment fees, or hidden charges.',
    targetFilter: (kw, item) => kw.includes('cable') || kw.includes('cut the cord') || kw.includes('comcast') || kw.includes('spectrum') || kw.includes('sling')
  },
  {
    id: 'alternatives-sky-virgin-uk',
    url: '/uk/alternatives/sky-virgin-media',
    market: 'UK',
    priority: 'P1',
    pageType: 'Alternative / Cord Cutting',
    primaryKeyword: 'sky tv alternative uk',
    title: 'Best Sky TV & Virgin Media Alternative UK (2026) - Save £1,200/Year',
    h1: 'Best Alternative to Sky TV & Virgin Media in the UK',
    metaDescription: 'Tired of paying £100+/month for Sky TV and Virgin Media? Get all Sky Sports, TNT Sports, Sky Cinema & 25,000+ HD channels for just £10.99/mo.',
    targetFilter: (kw, item) => kw.includes('sky tv') || kw.includes('virgin media') || kw.includes('sky alternative')
  },
  {
    id: 'features-anti-freeze-4k',
    url: '/features/anti-freeze-4k',
    market: 'GLOBAL',
    priority: 'P2',
    pageType: 'Feature / Infrastructure',
    primaryKeyword: 'anti freeze iptv',
    title: 'Anti-Freeze v9.2 Protocol & 4K 60FPS Streaming Servers (2026 SLA)',
    h1: 'Anti-Freeze Protocol v9.2: Dedicated 10Gbps Server Network',
    metaDescription: 'Explore our enterprise streaming infrastructure. Load-balanced 10Gbps servers across US and UK guarantee 99.99% uptime with zero buffering during peak sports.',
    targetFilter: (kw, item) => kw.includes('anti freeze') || kw.includes('buffering') || kw.includes('4k') || kw.includes('60fps')
  },
  {
    id: 'features-epg-catchup',
    url: '/features/epg-catchup',
    market: 'GLOBAL',
    priority: 'P2',
    pageType: 'Feature / Infrastructure',
    primaryKeyword: 'iptv with epg',
    title: 'IPTV with 7-Day Catch-Up & TV Guide EPG (2026 Electronic Guide)',
    h1: 'Real-Time EPG TV Guide & 7-Day Interactive Catch-Up',
    metaDescription: 'Never miss a show or football match. Our IPTV service includes an accurate XMLTV Electronic Program Guide (EPG) and 7-day replay on major US & UK channels.',
    targetFilter: (kw, item) => kw.includes('epg') || kw.includes('catchup') || kw.includes('catch up') || kw.includes('tv guide')
  }
];

// Map all 48,591 keywords into the clusters
const masterKeywordMapping = [];
const clusterStats = {};

for (const def of clusterDefinitions) {
  clusterStats[def.id] = {
    id: def.id,
    url: def.url,
    title: def.title,
    h1: def.h1,
    metaDescription: def.metaDescription,
    primaryKeyword: def.primaryKeyword,
    market: def.market,
    priority: def.priority,
    pageType: def.pageType,
    totalVolume: 0,
    keywordCount: 0,
    topKeywords: []
  };
}

for (const [kw, item] of keywordsMap.entries()) {
  let matchedClusterId = 'core-commercial-us'; // default fallback

  for (const def of clusterDefinitions) {
    if (def.targetFilter(kw, item)) {
      matchedClusterId = def.id;
      break;
    }
  }

  const isPrimary = kw === clusterStats[matchedClusterId].primaryKeyword.toLowerCase();
  
  const mappedEntry = {
    keyword: item.keyword,
    market: item.market,
    intent: item.intent,
    volume: item.volume,
    kd: item.kd,
    cpc: item.cpc,
    serpFeatures: item.serpFeatures,
    cluster: matchedClusterId,
    primary: isPrimary,
    url: clusterStats[matchedClusterId].url,
    pageType: clusterStats[matchedClusterId].pageType,
    priority: clusterStats[matchedClusterId].priority
  };

  masterKeywordMapping.push(mappedEntry);

  clusterStats[matchedClusterId].totalVolume += item.volume;
  clusterStats[matchedClusterId].keywordCount += 1;
  clusterStats[matchedClusterId].topKeywords.push({
    keyword: item.keyword,
    volume: item.volume,
    kd: item.kd,
    cpc: item.cpc,
    intent: item.intent
  });
}

// Sort top keywords inside each cluster by search volume
for (const id in clusterStats) {
  clusterStats[id].topKeywords.sort((a, b) => b.volume - a.volume);
  // Keep top 30 for on-page SEO integration
  clusterStats[id].supportingKeywords = clusterStats[id].topKeywords.slice(0, 30);
}

// Write master keyword map
const seoDir = path.join(__dirname, '../src/data/seo');
fs.mkdirSync(seoDir, { recursive: true });

const keywordMapPath = path.join(seoDir, 'keyword-map.json');
fs.writeFileSync(keywordMapPath, JSON.stringify(masterKeywordMapping, null, 2), 'utf-8');

const clusterDefPath = path.join(seoDir, 'cluster-definitions.json');
fs.writeFileSync(clusterDefPath, JSON.stringify(clusterStats, null, 2), 'utf-8');

console.log(`Saved master keyword mapping (${masterKeywordMapping.length} records) to ${keywordMapPath}`);
console.log(`Saved cluster definitions (24 canonical pages) to ${clusterDefPath}`);
