// Rewrites SEO fields and adds unique on-page content for the programmatic /iptv/* pages.
// Source of truth: src/data/pages-data.original.json  ->  output: src/data/pages-data.json (+ search index).
// Principal pages (home, pricing, devices, ...) are NOT touched by this script.
//
//   node scripts/enrich-seo-pages.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildHubs } from './build-hubs.mjs';
import {
  STATES, etTo, UK_REGION_CLUBS, UK_PLACE_CLUBS, UK_ISPS, UK_LONDON_ISPS, SPORTS,
} from './seo-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SRC = path.join(root, 'src/data/pages-data.original.json');
const OUT = path.join(root, 'src/data/pages-data.json');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-config.json'), 'utf8'));

const CHANNELS = cfg.stats.channels;                       // e.g. "25,000+"
const PRICE_USD = cfg.pricing[0].priceUsd.toFixed(2);
const PRICE_GBP = cfg.pricing[0].priceGbp.toFixed(2);
const YEAR = 2026;

// ---------- helpers ----------
const catOf = (p) => (p.category === 'uk-geo' && !p.locationName ? 'intent' : p.category);
const hash = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
function rng(seed) {
  let a = hash(seed);
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mk = (seed) => { const r = rng(seed); return { pick: (a) => a[Math.floor(r() * a.length)], pickN: (a, n) => { const c = [...a]; const o = []; while (c.length && o.length < n) o.push(c.splice(Math.floor(r() * c.length), 1)[0]); return o; }, r }; };
const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? `{${k}}`));
const list = (a) => a.length <= 1 ? (a[0] || '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
const nice = (t) => titleCase(t).replace(/\bF C\b/g, 'FC').replace(/\bFc\b/g, 'FC').replace(/\b(Epl|Ufc|Nfl|Nba|Mlb|Espn|Tv|Lg|Oled|Uefa)\b/g, (m) => m.toUpperCase()).replace(/\bMlbtv\b/g, 'MLB.tv').replace(/\b(\d+)k\b/gi, '$1K').replace(/\bVs\b/g, 'vs').replace(/\bDe\b/g, 'de').replace(/\bIpad\b/g, 'iPad').replace(/\bIphone\b/g, 'iPhone').replace(/\bHomepod\b/g, 'HomePod');
const fit = (cands, max, min = 0) => { for (const c of cands) if (c.length <= max && c.length >= min) return c; return cands.find((c) => c.length <= max) || cands[cands.length - 1].slice(0, max).replace(/\s+\S*$/, ''); };

// ---------- shared FAQ / text pools ----------
const SPEED = 'Plan for roughly 8 to 10 Mbps for HD and about 25 Mbps for 4K per stream, and add headroom if other people in the home are streaming at the same time.';
const LEGAL = (where) => `IPTV as a technology is legal. Whether a particular service is lawful depends on how its content is licensed and on the rules in ${where}, so use a provider you are comfortable with and follow local copyright law.`;
const TRIAL = 'You can ask for a short free trial on WhatsApp, which lets you test channel quality on your own device and internet connection before paying for a plan.';
const SPEEDS = [
  SPEED,
  'A good rule is 8 to 10 Mbps per HD stream and around 25 Mbps for each 4K stream, with extra headroom when several people are online.',
  'HD generally needs 8 to 10 Mbps and 4K about 25 Mbps per stream, so count the screens that might run at once.',
  'For smooth playback budget about 10 Mbps for HD and 25 Mbps for 4K on each stream, plus spare capacity for other devices.',
];
const TRIALS = [
  TRIAL,
  'Ask for a short free trial on WhatsApp so you can test the channels on your own device and broadband before you pay.',
  'A free trial on request lets you check picture quality, the guide and live sport on your own connection first.',
];

function nearbyFor(page, all) {
  const same = all.filter((p) => p.slug !== page.slug && catOf(p) === catOf(page) && p.__type === page.__type && p.__group === page.__group);
  const { pickN } = mk('near:' + page.slug);
  return pickN(same, 6).map((p) => ({ slug: p.slug, label: p.__place }));
}

// =====================================================================
// US GEO
// =====================================================================
function usContent(p, all) {
  const st = STATES[p.stateCode];
  const place = p.city || p.locationName.split(',')[0];
  const loc = place === st.name ? st.name : `${place}, ${st.code}`;
  const locName = place === st.name ? st.name : st.code === 'DC' ? 'Washington, DC' : `${place}, ${st.name}`;
  const regionP = ['South', 'West', 'Northeast', 'Midwest'].includes(p.region) ? `the ${p.region}` : p.region;
  const isFire = p.__type === 'firestick';
  const { pick, pickN } = mk('us:' + p.slug);
  const spd = pick(SPEEDS), trl = pick(TRIALS);
  const [t1, t2, t3] = pickN(st.teams, 3);
  const [i1, i2] = [st.isps[0], st.isps[1] || st.isps[0]];
  const v = { place, loc, st: st.code, state: st.name, tz: st.tz.label, tzs: st.tz.short, t1, t2: t2 || t1, i1, i2, region: regionP, cap: st.capital };
  const early = etTo(st, 13), late = etTo(st, 16, 25), snf = etTo(st, 20, 20), nba = etTo(st, 19, 30);

  const intros = isFire ? [
    `Setting up IPTV on an Amazon Firestick in {loc} takes a few minutes, and the main thing that decides the experience is your connection. Most households in {region} use {i1} or {i2}, and both can handle HD streaming comfortably.`,
    `If you live in {place} and want live TV on a Fire TV Stick, this guide covers the install, the app to use and what to check on a {i1} or {i2} line. It is written for {state} viewers watching in {tz}.`,
    `A Firestick is one of the simplest ways to watch IPTV in {place}: plug it into the TV, sideload a player with Downloader, and sign in with the details you receive. Here is how that works for {region} households, plus a few local tips.`,
    `Viewers in {loc} often start with a Firestick because it is cheap and works with most players. Below you will find the steps, the best settings for {i1} and {i2} connections and what to expect from local sport.`,
  ] : [
    `IPTV delivers live channels, sport and on-demand titles over your home internet instead of through a cable box. In {loc}, that means {i1} or {i2} broadband is all you need, plus a compatible device and a login.`,
    `Looking for IPTV in {loc}? Households across {region} are replacing cable with streaming, mainly for live sport and a bigger channel line-up. This page explains what to expect, what speed you need and how to try it first.`,
    `{place} is in {state}, where fans of {t1} and {t2} want every game on a reliable stream. Here is what an IPTV subscription involves, how the set-up works on {i1} and {i2} connections, and how to test before you commit.`,
    `Cable bills add up, which is why viewers in {loc} look at IPTV. You get live channels and sport over the internet, on the devices you already own. This guide covers plans, speed, devices and local sport for {region}.`,
  ];

  const introText = fill(pick(intros), v);
  const sections = [];
  sections.push({ h: `IPTV in ${loc}: what you need`, p: [
    `${spd} In ${place}, ${list(st.isps.slice(0, 3))} are common providers; any of them works as long as the connection is stable.`,
  ] });

  if (isFire) {
    sections.push({ h: `Firestick set-up for ${place} viewers`, ol: [
      'Go to Settings, then My Fire TV, then Developer Options, and allow apps from unknown sources for Downloader.',
      'Install Downloader from the Amazon Appstore and open it.',
      'Enter the app link supplied by your provider, install the IPTV player and open it.',
      `Sign in with the Xtream or M3U details you receive on WhatsApp, then load the channel list and the programme guide.`,
      `Set the player to hardware decoding and, on a ${i1} or ${i2} line, test one live channel before you finish.`,
    ], p: [pick([
      `A wired Ethernet adapter helps if your Wi-Fi in ${place} is crowded; otherwise use the 5 GHz band and keep the stick away from the router's blind spots.`,
      `If playback stutters, restart the Firestick, clear the player cache and test on 5 GHz Wi-Fi before changing anything else.`,
      `Fire TV sticks are compact and run warm, so keep the vents clear and use the supplied power adapter rather than a TV USB port.`,
    ])] });
  } else {
    sections.push({ h: `Choosing a plan in ${place}`, p: [
      pick([
        `Plans typically run from one month up to a year, and longer terms bring the monthly cost down. Start with a short trial in ${place}, then decide whether one or two simultaneous connections suit your household.`,
        `Most viewers in ${st.name} choose between a one-month plan to test and a longer plan once they are happy with channel quality. Two connections suit couples or families watching in different rooms.`,
        `A sensible approach in ${place} is to try the free trial on your ${i1} or ${i2} connection first, then pick the term that matches how long you expect to use it.`,
      ]),
      `Current plans start from $${PRICE_USD} per month. See the full price list on the pricing page before you order.`,
    ] });
  }

  sections.push({ h: `Live sport in ${st.name}`, p: [
    fill(pick([
      `Sport is the main reason people in {state} look at IPTV: fans follow {list}, and a wide sports line-up means you can watch them without juggling several subscriptions.`,
      `Across {state}, sport means {list} for many households. A line-up that includes the national sports networks gives you the games that are broadcast nationally.`,
      `Supporters of {t1} and {t2} across {state} usually want national and regional sport in one place. Channel availability for any single game depends on the league and the broadcaster, so confirm the line-up during your trial.`,
    ]), { ...v, list: list([t1, t2, t3].filter(Boolean)) }),
    `Kick-off times in ${place} follow ${st.tz.label}. NFL early games start at ${early}, the late window at ${late}, Sunday Night Football around ${snf} and a typical NBA tip-off is around ${nba}.`,
  ] });

  sections.push({ h: `Streaming quality on ${i1} and ${i2}`, p: [
    pick([
      `Streaming quality depends far more on your home network than on the city you live in. Put the device on Ethernet if possible, keep the router in an open spot and avoid heavy downloads during live sport in ${place}.`,
      `If your ${i1} service slows down in the evening, try a different DNS server and a wired connection first. If buffering continues only on live sport, tell support which channel and time it happened.`,
      `Many buffering problems in ${place} come from Wi-Fi rather than the internet plan itself. Restart the router, move the stream to 5 GHz and avoid running several 4K streams on the same ${i2} connection.`,
    ]),
    `Some viewers use a VPN for privacy or when their ISP interferes with video traffic. It is optional, so test with and without it.`,
  ] });

  sections.push({ h: `${place === st.name ? st.name : place} at a glance`, p: [
    pick([
      `${loc} is in ${st.name}, where the time zone is ${st.tz.label}. The state capital is ${st.capital}, and common broadband providers include ${list(st.isps)}.`,
      `For viewers in ${loc}: time zone ${st.tz.label}, typical providers ${list(st.isps)}, and a sports calendar built around ${list(st.teams.slice(0, 3))}.`,
      `${place} falls in the ${p.region} area of ${st.name} (${st.tz.short}). Broadband is mostly ${list(st.isps.slice(0, 3))}, which is what the speed advice above is based on.`,
    ]),
  ] });

  const faqPool = [
    { q: `Does IPTV work with ${i1} internet in ${place}?`, a: `Yes. IPTV streams over any broadband connection, including ${i1} and ${i2}. ${spd}` },
    { q: `What internet speed do I need in ${loc}?`, a: spd },
    { q: `Can I watch ${t1} games from ${place}?`, a: `Live sport channels carry national and regional broadcasts, but which games are available depends on the league and the broadcaster. Ask for the current channel list during your free trial.` },
    { q: `What time do NFL games start in ${place}?`, a: `In ${st.tz.label}, the early Sunday window starts at ${early}, the late window at ${late}, and Sunday Night Football at about ${snf}.` },
    { q: `How do I try IPTV in ${place} before paying?`, a: trl },
    { q: `Is IPTV legal in ${st.name}?`, a: LEGAL(st.name) },
    { q: `Which devices can I use in ${place}?`, a: 'Amazon Firestick, Android TV and Google TV boxes, Samsung and LG smart TVs, Apple TV, iPhone and iPad, Windows and macOS all work with a compatible IPTV player.' },
    { q: `How quickly can I start watching?`, a: `Login details are usually sent on WhatsApp within minutes of ordering, and set-up on a device such as a Firestick takes a few minutes.` },
    { q: `What if my stream buffers in ${place}?`, a: `Restart the device and router, move to Ethernet or 5 GHz Wi-Fi, and check that nobody else is downloading. If it continues, send support the channel name and time.` },
    { q: `Can I use IPTV on more than one TV?`, a: `That depends on the plan. Single-connection plans work on one device at a time, while two-connection plans let two screens stream at once.` },
  ];
  const faqs = pickN(faqPool, 5);

  return {
    intro: introText,
    facts: [
      { k: 'Location', v: locName },
      { k: 'Region', v: p.region },
      { k: 'Time zone', v: st.tz.label },
      { k: 'Common ISPs', v: list(st.isps) },
      { k: 'Local teams', v: list(st.teams.slice(0, 4)) },
    ],
    sections: sections.slice(0),
    faqs,
    nearby: nearbyFor(p, all),
    nearbyLabel: `More IPTV guides in ${st.name}`,
  };
}

// =====================================================================
// UK GEO
// =====================================================================
function ukParts(p) {
  const raw = p.locationName || p.city || 'United Kingdom';
  const [place, county] = raw.split(',').map((s) => s.trim());
  const reg = p.region || '';
  const nation = ['Scotland', 'Wales', 'Northern Ireland'].includes(reg) ? reg
    : ['Scotland', 'Wales', 'Northern Ireland', 'England'].includes(place) ? place : 'England';
  const isLondon = reg === 'London' || county === 'Greater London';
  const clubs = UK_PLACE_CLUBS[place] || UK_REGION_CLUBS[isLondon ? 'London' : reg] || UK_REGION_CLUBS[nation === 'England' ? 'UK Wide' : nation] || UK_REGION_CLUBS['UK Wide'];
  const isps = isLondon ? UK_LONDON_ISPS : UK_ISPS;
  const isNation = ['England', 'Scotland', 'Wales', 'Northern Ireland'].includes(place);
  return { place, county: county && county !== place ? county : '', nation, isLondon, clubs, isps, isNation, region: reg };
}

function ukContent(p, all) {
  const u = ukParts(p);
  const isPL = p.__type === 'pl';
  const { pick, pickN } = mk('uk:' + p.slug);
  const spd = pick(SPEEDS), trl = pick(TRIALS);
  const [c1, c2] = [u.clubs[0], u.clubs[1] || u.clubs[0]];
  const [i1, i2] = pickN(u.isps, 2);
  const where = u.county ? `${u.place}, ${u.county}` : u.place;
  const v = { place: u.place, nation: u.nation, c1, c2, i1, i2, county: u.county || u.nation, region: u.region };

  const intros = isPL ? [
    `Football fans in {place} follow {c1}${c2 !== c1 ? ' and {c2}' : ''} across several competitions, and the Premier League is spread across more than one broadcaster. This page explains how IPTV fits in, what kick-off times look like in {nation} and how to test a stream first.`,
    `Saturday afternoons in {place} revolve around the Premier League and the clubs people support, from {c1} to the rest of the top flight. Here is what to know about live football over IPTV, including kick-off windows and the connection you need on {i1} or {i2}.`,
    `If you are in {place} and want Premier League football without juggling subscriptions, IPTV can bring the main sports channels into one list. This guide covers fixtures windows, broadband speed on {i1} and {i2}, and a trial route.`,
  ] : [
    `IPTV sends live TV, sport and on-demand titles over your broadband instead of through an aerial or a set-top box. In {place}, {county}, a stable {i1} or {i2} line and a compatible device is all it takes to get started.`,
    `People in {place} are moving away from expensive TV bundles, mainly for football and a wider channel choice. This guide explains how IPTV works on {i1} and {i2}, which devices to use and how to try it first.`,
    `{place} is in {county}, where {c1}${c2 !== c1 ? ' and {c2}' : ''} supporters want every match on a dependable stream. Here is how an IPTV subscription works, what speed you need and how to test it for free.`,
  ];

  const introText = fill(pick(intros), v);
  const sections = [];
  sections.push({ h: isPL ? `Premier League in ${u.place}: how it works` : `IPTV in ${u.place}: what you need`, p: [
    `${spd} In ${u.place}, ${list(u.isps.slice(0, 3))} are widely used; any of them works if the connection is stable.`,
  ] });

  sections.push({ h: `Football and live sport near ${u.place}`, p: [
    fill(pick([
      `Supporters of {clubs} are well served by sports channels, and a good line-up covers the Premier League, EFL, cup football and European competitions in one place.`,
      `Local sport around {place} means {clubs}, plus the national competitions each week. A single channel list with the main sports networks avoids switching between services.`,
      `If you follow {clubs}, check that the channels you care about are in the line-up during your trial, because individual match coverage depends on the broadcaster.`,
    ]), { ...v, clubs: list(u.clubs.slice(0, 4)) }),
    `Typical UK kick-off windows are Saturday at 12:30, 15:00 and 17:30, Sunday at 14:00 and 16:30, and midweek evenings at 19:45 or 20:00, all in UK time.`,
  ] });

  if (isPL) {
    sections.push({ h: 'Premier League weekends at a glance', ul: [
      'Saturday lunchtime: the 12:30 kick-off, usually the first televised game of the weekend.',
      'Saturday afternoon: the 15:00 slot, which is not shown live on UK television.',
      'Saturday evening: the 17:30 kick-off, often a bigger fixture.',
      'Sunday: afternoon games at 14:00 and 16:30.',
      'Midweek: Champions League and league fixtures in the evening.',
    ], p: [`Check the fixtures on the official Premier League site, because dates and times change when games are moved for TV or cup runs.`] });
  } else {
    sections.push({ h: `Devices and set-up in ${u.place}`, p: [
      pick([
        `Most viewers in ${u.place} use a Firestick, an Android TV box or a smart TV. Install a player, sign in with the details you receive and load the channel list.`,
        `A Fire TV Stick, Google TV or Samsung and LG smart TVs all work. In ${u.nation}, start with the device you already own before buying anything new.`,
        `If your TV in ${u.place} is a few years old, a streaming stick is the quickest way to add IPTV without replacing the set.`,
      ]),
      `Current plans start from £${PRICE_GBP} per month.`,
    ] });
  }

  sections.push({ h: `Broadband in ${u.place}: ${i1}, ${i2} and others`, p: [
    pick([
      `Most buffering in ${u.place} comes from Wi-Fi or evening congestion, not the plan itself. Use Ethernet where you can, otherwise 5 GHz Wi-Fi, and keep other heavy downloads off during matches.`,
      `If your ${i1} line slows in the evening, try a wired connection and restart the router before blaming the stream. Full-fibre connections are the most consistent for 4K.`,
      `On ${i2}, speeds can vary by time of day. For live football, test the stream on a busy evening during your trial rather than in the quiet afternoon.`,
    ]),
    ...(u.isLondon ? ['London has full-fibre options such as Community Fibre and Hyperoptic in many areas, which suit 4K streaming well.'] : []),
  ] });

  sections.push({ h: `${u.place} at a glance`, p: [
    pick([
      `${where} is in ${u.nation}. Local football means ${list(u.clubs.slice(0, 3))}, and common broadband providers are ${list(u.isps.slice(0, 4))}.`,
      `For viewers in ${u.place}: ${u.nation}${u.region ? ', ' + u.region : ''}, typical providers ${list(u.isps.slice(0, 4))}, and clubs such as ${list(u.clubs.slice(0, 3))}.`,
      `${u.place}${u.county ? ' in ' + u.county : ''} sits in ${u.nation}. The speed advice above applies on ${list(u.isps.slice(0, 3))}, and local sport centres on ${list(u.clubs.slice(0, 2))}.`,
    ]),
  ] });

  const faqPool = [
    { q: `Does IPTV work on ${i1} in ${u.place}?`, a: `Yes. IPTV streams over any broadband line, including ${i1} and ${i2}. ${spd}` },
    { q: `What speed do I need in ${u.place}?`, a: spd },
    { q: `Can I watch ${c1} matches?`, a: `Sports channels carry the main competitions, but coverage of an individual match depends on the broadcaster. Check the channel list and the weekly fixtures during your trial.` },
    { q: `What time are Premier League games in ${u.nation}?`, a: `Common windows are Saturday 12:30, 15:00 and 17:30, Sunday 14:00 and 16:30, and midweek evenings, all in UK time.` },
    { q: `How can I try it in ${u.place}?`, a: trl },
    { q: `Is IPTV legal in the UK?`, a: LEGAL('the UK') },
    { q: `Which devices work in ${u.place}?`, a: 'Amazon Firestick, Android TV and Google TV boxes, Samsung and LG smart TVs, Apple TV, iPhone, iPad, Windows and macOS all work with a compatible player.' },
    { q: `Do I need a TV licence?`, a: `In the UK, a TV licence is needed to watch or record live TV broadcasts on any provider and to use BBC iPlayer. Check the current rules on the TV Licensing website.` },
    { q: `What if the stream buffers?`, a: `Restart the device and router, use Ethernet or 5 GHz Wi-Fi and pause other downloads. If it persists, send support the channel and time.` },
  ];
  const faqs = pickN(faqPool, 5);

  return {
    intro: introText,
    facts: [
      { k: 'Location', v: where },
      { k: 'Nation', v: u.nation },
      ...(u.region ? [{ k: 'Region', v: u.region }] : []),
      { k: 'Common ISPs', v: list(u.isps.slice(0, 5)) },
      { k: 'Local clubs', v: list(u.clubs.slice(0, 4)) },
    ],
    sections,
    faqs,
    nearby: nearbyFor(p, all),
    nearbyLabel: u.isNation ? 'More UK IPTV guides' : `More IPTV guides near ${u.place}`,
  };
}

// =====================================================================
// DEVICES
// =====================================================================
function deviceSteps(p) {
  const app = p.recommendedApp;
  const login = /Xtream/i.test(app) ? 'Choose Xtream Codes login and enter the server URL, username and password.'
    : /M3U/i.test(app) ? 'Choose M3U playlist and paste the playlist link you receive.'
    : /MAC|Device ID|Device Key/i.test(app) ? 'Note the MAC address or device ID shown in the app and send it to support so the playlist can be attached.'
    : /Portal|Stalker/i.test(app) ? 'Open the portal settings and enter the portal URL you receive.'
    : /QR/i.test(app) ? 'Scan the QR code shown in the app to load your playlist.'
    : 'Open the app and enter the login details you receive.';
  switch (p.deviceType) {
    case 'firestick': return [
      'Open Settings, My Fire TV, Developer Options and allow apps from unknown sources for Downloader.',
      'Install Downloader from the Amazon Appstore.',
      `Use Downloader to install ${app.split('/')[0].trim()} with the link supplied by your provider.`,
      login, 'Load the channel list and programme guide and test one live channel.',
    ];
    case 'smart-tv': return [
      `Open the ${p.os} app store on your ${p.deviceName.replace(/ Smart TV.*/, '')} TV.`,
      `Search for ${app.split('/')[0].trim()} and install it, or use the app your provider recommends for ${p.os}.`,
      login, 'Load the playlist and wait for the channel list to build.', 'Test a live channel, then set favourites.',
    ];
    case 'android-box': return [
      `Open the Google Play Store, or the device launcher, on your ${p.deviceName}.`,
      `Install ${app.split('/')[0].trim()} and open it.`, login, 'Load the playlist and enable the programme guide (EPG).', 'Test a live channel and a 4K title.',
    ];
    case 'mag-box': return [
      'Go to Settings, System Settings, Servers and open Portals.',
      'Enter a portal name and the portal URL you receive from support.',
      'Send the MAC address printed on the back of the box to support so your subscription can be attached.',
      'Restart the box and wait for the channel list to load.', 'Test a live channel and set favourites.',
    ];
    case 'apple': return [
      `Open the App Store on your ${p.deviceName}.`,
      `Install ${app.split('/')[0].trim()}.`, login, 'Load the playlist and wait for the channel list.', 'Test one live channel and one movie.',
    ];
    case 'pc': return [
      'Download an IPTV player such as VLC or IPTV Smarters for PC.',
      'Open it and choose to add a playlist or Xtream login.', login, 'Load the channel list and EPG.', 'Test a live channel in full screen.',
    ];
    case 'console': return [
      p.deviceName.includes('Xbox') ? 'Install the Kodi or MyIPTV Player app from the Microsoft Store.' : 'Open the PS5 web browser or media app that supports your player.',
      'Add the playlist or Xtream login you receive.', login, 'Load the channel list and EPG.', 'Test a live channel.',
    ];
    default: return [
      `Install ${app.split('/')[0].trim()} from the official store for ${p.os}.`, login, 'Load the playlist and programme guide.', 'Test one live channel and one movie.', 'Create favourites for the channels you watch.',
    ];
  }
}

function deviceContent(p, all) {
  const isUk = p.countryCode === 'GB';
  const { pick, pickN } = mk('dev:' + p.slug);
  const dn = p.deviceName;
  const app = p.recommendedApp;
  const sports = isUk ? 'Premier League, Sky Sports and TNT Sports channels' : 'NFL, NBA, MLB and college sport';
  const isps = isUk ? list(UK_ISPS.slice(0, 4)) : 'Xfinity, Spectrum, AT&T and Verizon Fios';
  const sections = [];
  sections.push({ h: `Using ${dn} for IPTV${isUk ? ' in the UK' : ' in the US'}`, p: [
    pick([
      `${dn} runs ${p.os}, and the recommended player here is ${app}. Set-up takes about ${p.setupTime}, and it works on ${isps} broadband.`,
      `If you own a ${dn}, you can have IPTV running in about ${p.setupTime}. It uses ${p.os} with ${app}, which is the combination most viewers use.`,
      `${dn} is a popular choice for IPTV. It runs ${p.os}, supports ${app} and, with a stable connection, handles live ${sports}.`,
    ]),
    SPEED,
  ] });
  const blurb = { firestick: 'Fire TV devices are inexpensive and sideloading is simple with Downloader.', 'smart-tv': 'Smart TVs need no extra hardware, but app choice depends on the TV operating system.', 'android-box': 'Android and Google TV boxes give the widest choice of players and handle 4K well.', 'mag-box': 'MAG boxes use a portal URL and your MAC address rather than an app login.', apple: 'Apple devices use players from the App Store and pair well with other Apple gear.', app: 'Player apps differ mostly in how they log in and how they show the guide.', pc: 'A PC gives you a big screen and easy troubleshooting.', console: 'Consoles are not designed for IPTV, so options are more limited than on a streaming stick.' }[p.deviceType] || '';
  sections.push({ h: `Why choose ${dn}`, p: [blurb, isUk ? 'UK viewers use it for Premier League, EFL and cup football.' : 'US viewers use it for NFL, NBA, MLB and college sport.'].filter(Boolean) });
  sections.push({ h: `Set up ${dn} step by step`, ol: deviceSteps(p), p: [`Estimated time: ${p.setupTime}. If you get stuck, send support your device model and the player you chose.`] });
  sections.push({ h: `Tips for ${dn}`, ul: pickN([
    'Use Ethernet where the device allows it, or 5 GHz Wi-Fi if not.',
    'Restart the device after installing the player so it starts with a clean cache.',
    'Turn on hardware decoding in the player settings for smoother 4K playback.',
    'Keep the player and the device software up to date.',
    'Place the device and router so there is a clear line of sight.',
    `Test on a busy evening for live ${isUk ? 'football' : 'sport'}, not only during the afternoon.`,
  ], 4) });
  const faqs = pickN([
    { q: `Which app should I use on ${dn}?`, a: `${app} is the recommended player. Other compatible players also work if you prefer them.` },
    { q: `How long does set-up take on ${dn}?`, a: `About ${p.setupTime} once you have your login details.` },
    { q: `Do I need a fast connection for ${dn}?`, a: SPEED },
    { q: `Can I try ${dn} before paying?`, a: TRIAL },
    { q: `What should I do if ${dn} buffers?`, a: 'Restart the device and router, use Ethernet or 5 GHz Wi-Fi and close other apps. If it continues, contact support with the channel name and time.' },
    { q: 'Is IPTV legal?', a: LEGAL(isUk ? 'the UK' : 'the US') },
  ], 5);
  return {
    intro: `${dn} runs ${p.os}, and this guide shows ${isUk ? 'UK' : 'US'} viewers how to set up IPTV with ${app} in about ${p.setupTime}, including the login steps, a few tips and what to do if playback stutters.`,
    facts: [{ k: 'Device', v: dn }, { k: 'Operating system', v: p.os }, { k: 'Recommended app', v: app }, { k: 'Setup time', v: p.setupTime }, { k: 'Market', v: isUk ? 'United Kingdom' : 'United States' }],
    sections, faqs,
    nearby: pickN(all.filter((x) => x.category === 'device' && x.countryCode === p.countryCode && x.deviceType === p.deviceType && x.slug !== p.slug), 6).map((x) => ({ slug: x.slug, label: x.deviceName })),
    nearbyLabel: 'More device guides',
  };
}

// =====================================================================
// SPORTS
// =====================================================================
function sportsContent(p, all) {
  const s = SPORTS[p.sportName] || { what: p.sportName, season: 'year-round', times: 'varies by event', tip: 'Check the schedule each week.' };
  const isUk = p.countryCode === 'GB';
  const { pick, pickN } = mk('sp:' + p.slug);
  const isps = isUk ? list(UK_ISPS.slice(0, 4)) : 'Xfinity, Spectrum, AT&T and Verizon Fios';
  const sections = [
    { h: `${p.sportName}: what you can watch`, p: [
      `${cap(s.what)} is part of the sports line-up that IPTV viewers ask about most. The season runs ${s.season}.`,
      `Typical broadcasters for this competition include ${p.broadcasters}. Which games are on which channel depends on the league's rights deals in ${isUk ? 'the UK' : 'the US'}, so check the channel list during your trial.`,
    ] },
    { h: `Match times and schedule${isUk ? ' (UK time)' : ''}`, p: [
      `${cap(s.times)}.`,
      s.tip,
    ] },
    { h: 'Getting a stable stream', p: [
      pick([
        `For live sport, the biggest factor is your own network. Use Ethernet or 5 GHz Wi-Fi, avoid running downloads during matches and test on ${isps} at the time you normally watch.`,
        `Sport streams are most demanding in the first and last minutes. A stable ${isps} connection, a wired device and a fresh restart before the game help avoid problems.`,
      ]),
      SPEED,
    ] },
    { h: 'Choosing a device', ul: pickN(['Amazon Firestick 4K for a low-cost, easy option', 'An Android TV or Google TV box for 4K and a smooth interface', 'A Samsung or LG smart TV with a supported app', 'Apple TV 4K for iPhone and iPad households', 'A Windows PC or laptop for a second screen'], 4) },
  ];
  const faqs = pickN([
    { q: `Can I watch ${p.sportName} live?`, a: `Live sports channels cover the main broadcasters, but availability of a specific event depends on the rights holder. Ask for the current channel list during your free trial.` },
    { q: 'What time does it start?', a: `${cap(s.times)}.` },
    { q: `Which channels show ${p.sportName}?`, a: `${p.broadcasters}. Coverage varies by event.` },
    { q: 'How do I try it first?', a: TRIAL },
    { q: 'Is IPTV legal?', a: LEGAL(isUk ? 'the UK' : 'the US') },
    { q: 'What internet speed do I need?', a: SPEED },
  ], 5);
  return {
    intro: `${cap(s.what)} is one of the most searched sports for IPTV viewers ${isUk ? 'in the UK' : 'in the US'}. This guide covers the season (${s.season}), typical broadcasters, match times and how to get a stable stream.`,
    facts: [{ k: 'Sport', v: p.sportName }, { k: 'Season', v: s.season }, { k: 'Broadcasters', v: p.broadcasters }, { k: 'Stream quality', v: p.streamQuality }],
    sections, faqs,
    nearby: pickN(all.filter((x) => x.category === 'sports' && x.countryCode === p.countryCode && x.slug !== p.slug), 6).map((x) => ({ slug: x.slug, label: x.sportName })),
    nearbyLabel: 'More sports guides',
  };
}

// =====================================================================
// INTENT (service topics + keyword landing pages)
// =====================================================================
const INTENT_SERVICE = {
  'best-anti-freeze-iptv-usa': ['Anti-freeze streaming', ['Buffering is usually caused by server load, your connection or the player, not the picture quality setting.', 'Look for servers close to you, a provider that adds capacity for big events and a player with a decent buffer.', 'Test during a busy live event, because that is when weak servers struggle.']],
  'best-4k-ultra-hd-iptv-provider': ['4K IPTV', ['Real 4K needs a 4K channel or title, a 4K device and about 25 Mbps per stream.', 'Many channels are HD or upscaled, so ask which channels are native 4K.', 'Hardware decoding on the player gives smoother 4K playback.']],
  'iptv-24-hour-free-trial-instant': ['IPTV free trial', ['A trial lets you test channel quality, the programme guide and your own connection before paying.', 'Test on your usual device at the time you normally watch.', 'Check live sport, a movie and the channels your household watches most.']],
  'cheap-iptv-uk-5-pound': ['Cheap IPTV in the UK', ['Very low prices usually come with limits such as one connection or fewer channels.', 'Compare the monthly cost across longer terms rather than only the headline price.', 'Test before you pay, and avoid long commitments with an untested service.']],
  'multi-device-iptv-2-3': ['Multi-device IPTV', ['Plans differ on how many screens can stream at once.', 'Two connections suit couples, three or more suit larger households.', 'Each 4K stream needs its own bandwidth, so check your broadband.']],
  'best-iptv-with-catchup-and-epg': ['IPTV with catch-up and EPG', ['An EPG shows what is on now and next; catch-up lets you go back on selected channels.', 'Catch-up windows vary by channel, commonly a few days.', 'A good player makes the guide fast and searchable.']],
  'instant-m3u-playlist-xtream-codes-api': ['M3U and Xtream Codes', ['M3U is a playlist link; Xtream Codes is a login with server URL, username and password.', 'Xtream login is easier for most apps because it loads the guide and VOD too.', 'Keep your credentials private and do not share them.']],
  'best-cable-tv-alternative-usa-cut': ['Cable TV alternatives', ['Compare the full monthly cost of cable, including box rental, regional sports fees and taxes.', 'Streaming bundles and IPTV are both options; the right one depends on the channels you watch.', 'Run both in parallel for a month before cancelling cable.']],
  'best-sky-tv-virgin-media-alternative': ['Alternatives to Sky and Virgin Media', ['List the channels you actually watch before comparing prices.', 'Check contract end dates and early termination fees.', 'Test an alternative on your own broadband before cancelling.']],
  'iptv-service-with-adult-channels-pin': ['Parental controls and PIN', ['Many players let you lock categories behind a PIN.', 'Set the PIN in the player and keep it private.', 'Adult content is for viewers aged 18 and over only.']],
  'buy-iptv-with-paypal-crypto-credit': ['Payment options', ['Check which payment methods are offered before ordering.', 'Use methods that give buyer protection where possible.', 'Keep your order confirmation and credentials.']],
  'best-vpn-friendly-iptv-service-usa': ['IPTV and VPNs', ['A VPN encrypts traffic between your device and the VPN server.', 'It can help if your ISP interferes with video, but it can also add latency.', 'Test with and without it and choose a fast server near you.']],
  'reliable-iptv-provider-for-sports-lovers': ['Reliable IPTV for sport', ['Ask which sports channels are included and test during a live event.', 'Check support hours, as problems tend to appear at match time.', 'Use a wired connection for important games.']],
};

const CLUBS = [
  [/chelsea/, 'Chelsea', 'Premier League'], [/real-madrid|madrid|r-madrid|albacete|futbol-at-madrid/, 'Real Madrid', 'La Liga'],
  [/barcelona|barca|bar-a/, 'FC Barcelona', 'La Liga'], [/man-city|manchester-city/, 'Manchester City', 'Premier League'],
  [/sevilla/, 'Sevilla', 'La Liga'],
];
const COMPS = [
  [/laliga|la-liga|primera|posiciones|partidos-de-la-liga|tabla/, 'La Liga'], [/epl|premier/, 'Premier League'],
  [/championship/, 'EFL Championship'], [/europa/, 'Europa League'], [/champions|uefa/, 'Champions League'],
];
const LOW_VALUE = /^(samsung-tv-samsung-tv-samsung-tv|smart-tv-smart-tv-smart-tv|smart-tv-en|bar-a|league-uefa|al-all-stars-vs-nl-all|la-liga-take|lg-a-tv|tv-for-on-sale|tv-for-sale|samsung-televizor|lg-televize|tabla-de-la-liga-espa-ola|tabla-de-posiciones-de-la-liga|laliga-posiciones|posiciones-de-la-liga|partidos-de-la-liga|partidos-de-champions-league|fight-night|friday-night-fives|f1-news-f1|sport-news|sports-news|best-tv|tv)$/;
const OFFTOPIC = /fridge|refrigerator|jane-the-virgin|homepod|pink-ipad|apple-products|apple-tv-movies/;

const angleOf = (slug) => /standings|table|posiciones|tabla/.test(slug) ? 'Standings & Where to Watch' : /schedule|calendar|fixtures|calendario|partidos/.test(slug) ? 'Schedule & Where to Watch' : /players/.test(slug) ? 'Players & Where to Watch' : /stats|lineups/.test(slug) ? 'Stats & Where to Watch' : /scores/.test(slug) ? 'Scores & Where to Watch' : /game|vs/.test(slug) ? 'Game Day Guide' : 'Live Stream Guide';
function cleanTopic(p) {
  let t = p.targetKeyword || p.slug.replace(/-/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function intentContent(p, all) {
  const slug = p.slug;
  const { pick, pickN } = mk('in:' + slug);
  const topic = cleanTopic(p);
  const Topic = nice(topic);
  const sections = [];
  let kind = 'generic', entity = Topic, intro = '', facts = [];

  if (INTENT_SERVICE[slug]) {
    kind = 'service';
    const [name, pts] = INTENT_SERVICE[slug];
    entity = name;
    intro = `${name}: what to look for, what to test and how to try it before you commit.`;
    sections.push({ h: `${name}: key points`, ul: pts });
    sections.push({ h: 'How to test it yourself', ol: ['Request a free trial.', 'Install a player on your usual device.', 'Test a live sports channel, a movie and the guide.', 'Check how it behaves at the busiest time of day.'] });
  } else if (OFFTOPIC.test(slug)) {
    kind = 'offtopic';
    intro = `You searched for "${Topic}". This site is about IPTV streaming, so here is what we can help with.`;
    sections.push({ h: 'What this site covers', p: [`We cover IPTV subscriptions, set-up guides for streaming devices and live sports. We do not sell or review ${Topic}.`, 'If you are setting up a TV or streaming device, the guides below cover Firestick, Android TV, Samsung, LG and Apple TV.'] });
  } else {
    const club = CLUBS.find(([re]) => re.test(slug));
    const comp = COMPS.find(([re]) => re.test(slug));
    const vs = slug.match(/^(.*)-vs-(.*)$/);
    const isLogin = /login|^nfl-app|mlbtv|mlb-network|fox-sports-1|livetv|streameast|apps-for-espn|nbabite/.test(slug);
    const isDevice = /(^|-)(tv|tvs|ipad|firestick|fire-stick|fire-tv|firetv|downloader|samsung|lg|oled|apple|smart-tv)(-|$)|inch/.test(slug) && !isLogin;
    const isNews = /news|standings|table|fixtures|schedule|scores|stats|calendar|lineups|players|games?$/.test(slug);
    const isUS = /nfl|nba|mlb|ufc|fight|vikings|steelers|lions|packers|eagles|buccaneers|ravens|dolphins|bills|panthers|chiefs|raiders|patriots|all-star|super-bowl|f1|friday-night/.test(slug);

    if (club || comp) {
      kind = 'football';
      const ent = club ? club[1] : comp[1];
      const league = club ? club[2] : ent;
      entity = ent;
      intro = `Looking for ${Topic}? Here is how to watch ${ent} live with IPTV, and where to find official ${isNews ? 'tables, fixtures and results' : 'schedules'}.`;
      sections.push({ h: `Watching ${ent} live`, p: [
        pick([`${ent} games are shown across several broadcasters depending on where you live, which is why viewers look at IPTV for a single channel list that includes the main sports networks.`, `Following ${ent} usually means more than one subscription. A channel list with the major sports channels gives you ${league} coverage in one app.`]),
        `Which match is on which channel changes by country and round, so check the line-up during a free trial.`,
      ] });
      const CLUB_FACTS = { Chelsea: ['Stamford Bridge', 'London', 'Premier League, FA Cup, EFL Cup, Champions League'], 'Real Madrid': ['Santiago Bernabéu', 'Madrid', 'La Liga, Copa del Rey, Champions League'], 'FC Barcelona': ['Camp Nou (Spotify Camp Nou)', 'Barcelona', 'La Liga, Copa del Rey, Champions League'], 'Manchester City': ['Etihad Stadium', 'Manchester', 'Premier League, FA Cup, EFL Cup, Champions League'], Sevilla: ['Ramón Sánchez-Pizjuán', 'Seville', 'La Liga, Copa del Rey, Europa League'] };
      const cf = CLUB_FACTS[ent];
      const ANGLE = {
        'Standings & Where to Watch': 'A league table changes every matchday, so the only reliable source is the competition\'s official site or app. Use it to see where the team stands, then use your channel list to watch the games that decide the table.',
        'Schedule & Where to Watch': 'Fixtures are published by the league and move when games are picked for television or when cup runs add dates. Check the official fixture list a few days ahead, then confirm the channel for that round in your trial.',
        'Players & Where to Watch': 'Squad lists, transfers and injuries change often and are best checked on the club\'s official site. What an IPTV line-up adds is the live match, so you can follow those players on the day.',
        'Stats & Where to Watch': 'Match statistics and line-ups come from official match centres. IPTV does not provide data feeds; it provides the live channel, so keep a stats app open on a second screen if you like numbers.',
        'Scores & Where to Watch': 'Live scores belong to the league and score apps. If you would rather see the game itself, check that the broadcaster showing it is in your channel list before kick-off.',
        'Game Day Guide': 'On game day plan the basics: kick-off time converted to your time zone, the channel that has the rights that round, and a quick restart of your device before the whistle.',
        'Live Stream Guide': 'Start with the broadcaster list for your country, test the sport channels on your own connection, and keep the free trial for the busiest match you care about.',
      };
      if (cf) facts.push({ k: 'Stadium', v: cf[0] }, { k: 'City', v: cf[1] }, { k: 'Main competitions', v: cf[2] });
      sections.push({ h: angleOf(slug).replace(' & Where to Watch', '') + ' and ' + ent + ': how to use this page', p: [ANGLE[angleOf(slug)]] });
      if (isNews) sections.push({ h: 'Tables, fixtures and results', p: [`We do not publish live ${league} tables or results. For standings, fixtures and scores, use the official ${league} website or a sports app. IPTV is for watching the matches themselves.`] });
      sections.push({ h: 'Season and kick-off times', p: [league === 'La Liga' ? 'La Liga runs from August to May with games from lunchtime to late evening Spanish time.' : league === 'Premier League' ? 'The Premier League runs from August to May, with kick-offs on Saturday, Sunday and midweek evenings in UK time.' : `${league} fixtures are scheduled throughout the season, often on weekends and midweek evenings.`, SPEED] });
    } else if (vs && isUS) {
      kind = 'matchup';
      const a = titleCase(vs[1].replace(/-/g, ' ')), b = titleCase(vs[2].replace(/-/g, ' '));
      entity = `${a} vs ${b}`;
      intro = `How to watch ${a} vs ${b} live: broadcast windows, kick-off times and how IPTV fits in.`;
      sections.push({ h: `Watching ${a} vs ${b}`, p: [
        'NFL games are shown in national windows on Thursday, Sunday and Monday and in regional windows on Sunday afternoon, so the channel depends on the game.',
        'Check the official NFL schedule for the date, time and broadcaster, then confirm that the channel is in your IPTV line-up during a free trial.',
      ] });
      sections.push({ h: 'Typical kick-off times', ul: [`Sunday early: ${etTo(STATES.NY, 13)} ET`, `Sunday late: ${etTo(STATES.NY, 16, 25)} ET`, `Sunday Night: ${etTo(STATES.NY, 20, 20)} ET`, 'Convert to your own time zone before kick-off.'] });
    } else if (isLogin) {
      kind = 'login';
      intro = `Searching for "${Topic}"? Here is what this page can and cannot help with.`;
      sections.push({ h: 'About this topic', p: [`${Topic} is a third-party service or app that we do not operate, so we cannot help with its account or login. Use the official site or app for sign-in and billing.`, 'What we cover is IPTV: live channels and sport streamed to your devices, and how to try it with a free trial.'] });
      sections.push({ h: 'Where IPTV fits', p: ['If you want several sports and entertainment channels in one list, IPTV can replace juggling multiple apps. Confirm which channels are included during your trial.'] });
    } else if (isDevice) {
      kind = 'device';
      const size = slug.match(/(\d{2})-inch/);
      intro = size ? `Planning to watch IPTV on a ${size[1]}-inch TV? Here is what to check, from viewing distance to app and connection.` : `Using IPTV on ${Topic}: compatibility, apps and what to check before you buy.`;
      sections.push({ h: size ? `IPTV on a ${size[1]}-inch TV` : `IPTV on ${Topic}`, p: [
        size ? `On a ${size[1]}-inch screen, 4K shows far more detail than HD from normal viewing distance, so a 4K-capable player and about 25 Mbps of bandwidth are worth having.` : `${Topic} works with an IPTV player as long as it runs a supported operating system. Check the app store for a compatible player.`,
        SPEED,
      ] });
      sections.push({ h: 'What to check', ul: ['The TV or device operating system and its app store', 'Whether it supports hardware decoding for 4K', 'Wired Ethernet or a good 5 GHz Wi-Fi signal', 'A player that supports Xtream or M3U playlists'] });
    } else {
      kind = 'generic';
      intro = `${Topic}: a guide to watching live sport and TV with IPTV, what to test and how to try it first.`;
      sections.push({ h: `About ${Topic}`, p: [`If you searched for ${Topic}, you are probably looking for live viewing options. IPTV streams live channels and sport over your internet, and a free trial lets you test it on your own devices.`, SPEED] });
      sections.push({ h: 'What to test in a trial', ul: ['Live sports channels at match time', 'Channel guide and favourites', 'Movies and series on demand', 'Behaviour at the busiest time of day'] });
    }
  }

  if (!['offtopic'].includes(kind)) sections.push({ h: 'Before you commit', p: [TRIAL, LEGAL('your country')] });

  const faqs = pickN([
    { q: `Can I try IPTV for ${entity}?`, a: TRIAL },
    { q: 'What internet speed do I need?', a: SPEED },
    { q: 'Which devices work?', a: 'Amazon Firestick, Android TV and Google TV boxes, Samsung and LG smart TVs, Apple TV, iPhone, iPad, Windows and macOS.' },
    { q: 'Is IPTV legal?', a: LEGAL('your country') },
    { q: 'How do I get my login?', a: 'Login details are usually sent on WhatsApp within minutes of ordering.' },
  ], 4);

  return {
    intro,
    facts: [{ k: 'Topic', v: kind === 'service' ? entity : Topic }, ...facts],
    sections, faqs,
    nearby: pickN(all.filter((x) => catOf(x) === 'intent' && x.slug !== p.slug && x.__kind === kind && (kind === 'offtopic' || x.__kind !== 'offtopic')), 6).map((x) => ({ slug: x.slug, label: x.__label })),
    nearbyLabel: 'More guides',
    __kind: kind, __entity: entity, __topic: Topic, __angle: angleOf(slug),
  };
}

// =====================================================================
// SEO FIELDS
// =====================================================================
function seoFor(p) {
  const { pick } = mk('seo:' + p.slug);
  const out = {};
  const ch = CHANNELS;
  if (catOf(p) === 'us-geo') {
    const st = STATES[p.stateCode]; const place = p.__place; const s = p.stateCode; const loc = place === st.name ? st.name : `${place}, ${s}`; const locName = place === st.name ? st.name : s === 'DC' ? 'Washington, DC' : `${place}, ${st.name}`;
    const [t1, t2] = [st.teams[0], st.teams[1] || st.teams[0]];
    const isFire = p.__type === 'firestick';
    const tl = isFire
      ? [`Firestick IPTV in ${loc}: Setup Guide (${YEAR})`, `IPTV on Firestick in ${loc}: Install Guide`, `Firestick IPTV ${loc}: Setup & Trial`, `${loc} Firestick IPTV Setup`]
      : [`IPTV in ${loc}: Plans, Channels & Trial`, `Best IPTV Service in ${loc} (${YEAR})`, `${loc} IPTV: 4K Live TV & Sports`, `IPTV Subscription in ${loc}`, `IPTV in ${loc} (${YEAR})`];
    const first = pick(tl);
    out.title = fit([first, ...tl.filter((x) => x !== first), `IPTV in ${loc}`], 60);
    const ml = isFire
      ? [`Install IPTV on a Firestick in ${loc}: Downloader steps, the best player and tips for ${st.isps[0]} and ${st.isps[1] || st.isps[0]} connections. Try a free trial.`,
         `Firestick IPTV guide for ${locName}: set-up in minutes, ${st.name} sport and fixes for buffering. Ask for a 24-hour trial.`]
      : [`IPTV for ${loc}: live sport from the NFL to college, ${ch} channels, 4K movies. Works on ${st.isps[0]} and ${st.isps[1] || st.isps[0]}. Free trial.`,
         `Compare IPTV plans in ${locName}: ${ch} channels, live sport, set-up on any device and a 24-hour free trial. Plans from $${PRICE_USD}/mo.`,
         `Cut the cable bill in ${loc}. IPTV with live sport, movies and 4K on Firestick, Android and smart TVs. Test free before you pay.`];
    out.metaDescription = fit([pick(ml), ...ml], 156, 100);
    out.h1 = isFire ? `IPTV on Firestick in ${locName}` : `IPTV Service in ${locName}`;
    out.targetKeyword = isFire ? `iptv firestick ${place} ${s}` : `iptv ${place} ${s}`;
    out.secondaryKeywords = isFire
      ? [`firestick iptv ${place}`, `how to install iptv on firestick ${place}`, `iptv downloader code ${st.name}`, `best iptv app firestick ${s}`, `iptv firestick ${st.name}`]
      : [`iptv subscription ${place}`, `best iptv ${st.name}`, `iptv free trial ${place} ${s}`, `nfl live stream ${st.name.toLowerCase()}`, `cable alternative ${place}`];
  } else if (catOf(p) === 'uk-geo') {
    const u = ukParts(p); const place = u.place;
    const isPL = p.__type === 'pl';
    const tl = isPL
      ? [`Premier League IPTV in ${place}: Kick-offs & Set-up`, `Watch Premier League in ${place} with IPTV`, `${place} Premier League IPTV Guide (${YEAR})`, `Premier League on IPTV in ${place}`]
      : [`IPTV in ${place}: Plans, Channels & Free Trial`, `Best IPTV Subscription in ${place} (${YEAR})`, `${place} IPTV: Live Sport, Movies & 4K`, `IPTV UK ${place}: Set-up & Trial`, `IPTV in ${place} (${YEAR})`];
    const first = pick(tl);
    out.title = fit([first, ...tl.filter((x) => x !== first), `IPTV in ${place}`], 60);
    const c = list(u.clubs.slice(0, 2));
    const ml = isPL
      ? [`Premier League IPTV in ${place}: Saturday, Sunday and midweek kick-off times, sports channels and set-up on ${u.isps[0]} or ${u.isps[1]}. Free trial available.`,
         `Follow ${c} and the Premier League from ${place}: how IPTV works, what speed you need and how to test it free.`]
      : [`IPTV in ${place}${u.isNation ? '' : ', ' + u.nation}: live football for ${c} fans, ${ch} channels and 4K movies. Works on ${u.isps[0]} and ${u.isps[1]}. Free trial.`,
         `Compare IPTV in ${place}: plans from £${PRICE_GBP}/mo, live sport, set-up on any device and a 24-hour free trial.`,
         `IPTV for ${place} viewers: Firestick, Android and smart TV set-up, Premier League and EFL coverage and a free trial before you pay.`];
    out.metaDescription = fit([pick(ml), ...ml], 156, 100);
    out.h1 = isPL ? `Premier League IPTV in ${place}${u.isNation ? '' : ', ' + u.nation}` : `IPTV Service in ${place}${u.isNation ? '' : ', ' + u.nation}`;
    out.targetKeyword = isPL ? `premier league iptv ${place}` : `iptv ${place}`;
    out.secondaryKeywords = isPL
      ? [`premier league live ${place}`, `watch ${u.clubs[0]} live`, `sky sports alternative ${place}`, `premier league kick-off times`, `football iptv ${u.nation}`]
      : [`iptv subscription ${place}`, `best iptv uk ${place}`, `iptv free trial ${place}`, `${u.clubs[0]} live stream`, `sky alternative ${place}`];
  } else if (catOf(p) === 'device') {
    const dn = p.deviceName; const isUk = p.countryCode === 'GB'; const m = isUk ? 'UK' : 'US';
    const tl = [`IPTV on ${dn}: Setup Guide (${m})`, `How to Set Up IPTV on ${dn} (${m})`, `${dn} IPTV Setup: Steps & App (${m})`, `Install IPTV on ${dn} (${m} ${YEAR})`];
    out.title = fit(tl, 60);
    out.metaDescription = fit([`Set up IPTV on ${dn}: ${p.recommendedApp} on ${p.os}, step-by-step in about ${p.setupTime}, with tips for ${isUk ? 'UK' : 'US'} broadband and a free trial option.`, `${dn} IPTV guide for ${m}: install ${p.recommendedApp.split('/')[0].trim()}, sign in and start watching in ${p.setupTime}, with tips for ${isUk ? 'UK' : 'US'} broadband.`], 156, 90);
    out.h1 = `How to Set Up IPTV on ${dn} (${m} Guide)`;
    out.targetKeyword = `iptv ${dn.toLowerCase()}`.slice(0, 80);
    out.secondaryKeywords = [`${dn} iptv app`, `install iptv ${dn}`, `${p.recommendedApp.split('/')[0].trim()} setup`, `best iptv ${dn}`, `${dn} iptv ${m.toLowerCase()}`];
  } else if (catOf(p) === 'sports') {
    const isUk = p.countryCode === 'GB'; const m = isUk ? 'UK' : 'US'; const n = p.sportName.replace(/\s*\([^)]*\)/g, '').replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
    const short = n.length > 38 ? n.slice(0, 38).replace(/\s+\S*$/, '') : n;
    out.title = fit([`Watch ${n} on IPTV (${m} Guide)`, `${n}: IPTV Guide (${m})`, `Watch ${short} Live (${m})`, `${short} on IPTV`], 60);
    const s = SPORTS[p.sportName];
    out.metaDescription = fit([`How to watch ${n} with IPTV in the ${m}: season, broadcasters (${p.broadcasters}), match times and tips for a stable stream. Free trial available.`, `${n} live in the ${m}: schedule, channels and set-up for a reliable stream. ${s ? 'Season: ' + s.season + '.' : ''}`], 156, 90);
    out.h1 = `Watch ${n} Live with IPTV (${m})`;
    out.targetKeyword = `${n.toLowerCase().replace(/[()&,]/g, '')} iptv ${m.toLowerCase()}`.replace(/\s+/g, ' ').slice(0, 80);
    out.secondaryKeywords = [`${short.toLowerCase()} live stream`, `watch ${short.toLowerCase()} online`, `${short.toLowerCase()} schedule`, `${short.toLowerCase()} channel`, `${short.toLowerCase()} ${m.toLowerCase()}`];
  } else if (catOf(p) === 'intent') {
    const kind = p.__kind;
    const T = kind === 'service' ? p.__entity : p.__topic;
    const E = p.__entity;
    const ang = angleOf(p.slug);
    const tl = {
      service: [`${T}: What to Check Before You Buy`, `${T}: Guide & Free Trial`, `${T} Explained (${YEAR})`, `${T}: What to Know`],
      football: [`${T}: ${ang}`, `Watch ${T} Live with IPTV`, `${T} on IPTV: Channels & Set-up`, `How to Watch ${T} Live (${YEAR})`, `${T} Live: IPTV Guide`, `${T} (${YEAR}): Where to Watch`],
      matchup: [`Watch ${T} Live: Times & Channels`, `${T}: How to Watch Live`, `${T} Live Stream Guide`, `${T}: Kick-off & Channels`],
      login: [`${T}: Login Help & IPTV Alternative`, `${T} vs IPTV: What to Know`, `${T}: Where to Sign In, and IPTV`, `${T} Help & IPTV Options`],
      device: [`IPTV on ${T}: Compatibility & Setup`, `${T} and IPTV: What to Check`, `Using IPTV on ${T} (${YEAR})`, `${T}: IPTV Set-up Guide`],
      offtopic: [`${T}: Looking for IPTV? Start Here`, `${T}: IPTV Help & Guides`, `Searching for ${T}? IPTV Guides`],
      generic: [`${T}: IPTV Guide & Free Trial`, `${T} and IPTV: What to Know`, `${T} (${YEAR}): IPTV Guide`, `${T}: Watch Live with IPTV`],
    }[kind] || [`${T}: IPTV Guide`];
    const first = pick(tl);
    const cands = [first, ...tl.filter((x) => x !== first)].filter((x) => x.length <= 60);
    out.title = cands[0] || fit([`${T.slice(0, 45)}: IPTV Guide`], 60);
    out._tc = [...cands, `${T.slice(0, 42)}: IPTV Guide`, `${T.slice(0, 38)}: Watch & Set-up`];
    const ml = {
      service: [`${T} explained: what to look for, how to test it yourself and how to try IPTV with a free trial before you commit.`],
      football: [`How to watch ${E} live with IPTV: broadcasters, season and kick-off times, plus where to find official tables and fixtures.`, `${E} on IPTV: which channels to look for, when games are played and how to test a stream before you pay.`, `Where to watch ${E}: how IPTV brings the main sports channels into one list, with a free trial to test first.`],
      matchup: [`How to watch ${T} live: typical kick-off windows, broadcasters and how to confirm your IPTV channel before the game.`, `${T}: kick-off times, national and regional broadcasts, and a free trial to test your stream before game day.`],
      login: [`Looking for ${T}? That service is run by a third party. Here is where to sign in, plus how IPTV can bring sports into one list.`, `${T} is a third-party service we do not run. Find out where to sign in and how IPTV can combine sports channels.`],
      device: [`IPTV on ${T}: what to check, which apps work, the speed you need and how to test with a free trial.`, `Using IPTV on ${T}: compatible apps, connection speed and a free trial so you can test before you pay.`],
      offtopic: [`You searched for ${T}. This site is about IPTV streaming. Find set-up guides for Firestick, Android TV, Samsung, LG and Apple TV.`],
      generic: [`${T} and IPTV: what to know, what to test and how to try a free trial first.`, `Searching for ${T}? See how IPTV brings live sport and TV together and how to test it free.`],
    }[kind];
    out.metaDescription = fit([pick(ml), ...ml], 156, 60);
    out._mc = [...ml, ...ml.map((x) => x.replace(/.$/, '') + ' (' + YEAR + ').')];
    out.h1 = (out._tc[1] || out.title).replace(/ (d{4})/, '');
    const kw = {
      football: [`watch ${E.toLowerCase()} live`, `${E.toLowerCase()} live stream`, `${E.toLowerCase()} iptv`, `how to watch ${E.toLowerCase()}`],
      matchup: [`${T.toLowerCase()} live stream`, `watch ${T.toLowerCase()}`, `${T.toLowerCase()} kick off time`],
      login: [`${T.toLowerCase()}`, `sports iptv`, `iptv free trial`],
      device: [`${T.toLowerCase()} iptv`, `iptv app ${T.toLowerCase()}`, `iptv setup`],
      service: [`${T.toLowerCase()}`, `iptv free trial`, `best iptv`],
      offtopic: [`${T.toLowerCase()}`, `iptv guides`],
      generic: [`${T.toLowerCase()} live`, `iptv free trial`],
    }[kind] || [`${T.toLowerCase()} iptv`];
    out.secondaryKeywords = kw.filter((v, i, arr) => arr.indexOf(v) === i);
    out.targetKeyword = p.targetKeyword;
  }
  return out;
}

// =====================================================================
// MAIN
// =====================================================================
let pages = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// ---- Merges: near-duplicate keyword pages are folded into one canonical page (redirected) ----
const MERGES = {
  chelsea: {
    from: ['chelsea-fc', 'chelsea-f-c'],
    title: 'Watch Chelsea Live with IPTV: Channels & Kick-offs',
    h1: 'Watch Chelsea FC Live with IPTV',
    meta: 'How to watch Chelsea live with IPTV: Premier League and cup broadcasters, kick-off windows, what speed you need and a free trial to test first.',
  },
  'chelsea-standings': {
    from: ['chelsea-football-club-standings'],
    title: 'Chelsea Standings: Where to Follow & Watch Live',
    h1: 'Chelsea Standings and How to Watch Every Match',
    meta: 'Looking for Chelsea standings? Use the official Premier League table, then see how to watch the matches live with IPTV and test it free.',
  },
  'real-madrid-vs': {
    from: ['madrid-vs', 'madrid-game', 'r-madrid-game', 'real-madrid-games', 'real-madrid-fc-football', 'futbol-at-madrid', 'play-for-real-madrid'],
    title: 'Watch Real Madrid Live with IPTV: Games & Channels',
    h1: 'Watch Real Madrid Games Live with IPTV',
    meta: 'How to watch Real Madrid games live with IPTV: La Liga and Champions League broadcasters, kick-off times and a free trial to test your stream.',
  },
  'real-madrid-schedule': {
    from: ['calendar-of-real-madrid'],
    title: 'Real Madrid Schedule: Fixtures & How to Watch Live',
    h1: 'Real Madrid Schedule and How to Watch Live',
    meta: 'Find the Real Madrid schedule on the official sites, then see which channels and kick-off windows matter and how to try IPTV free.',
  },
  'fc-barcelona-vs-real-madrid-stats': {
    from: ['real-madrid-vs-fc-barcelona-stats'],
    title: 'Barcelona vs Real Madrid Stats: How to Watch El Clasico',
    h1: 'Barcelona vs Real Madrid: Stats and How to Watch El Clasico',
    meta: 'For Barcelona vs Real Madrid stats use the official La Liga data, and see how to watch El Clasico live with IPTV and test a free trial first.',
  },
};
const REDIRECTS = {};
const mergeSet = new Set();
for (const [to, m] of Object.entries(MERGES)) for (const f of m.from) { mergeSet.add(f); REDIRECTS['/iptv/' + f] = '/iptv/' + to; }
const mergedKw = {};
for (const [to, m] of Object.entries(MERGES)) mergedKw[to] = m.from.map((f) => (pages.find((x) => x.slug === f) || {}).targetKeyword).filter(Boolean);
pages = pages.filter((x) => !mergeSet.has(x.slug));

// annotate
for (const p of pages) {
  if (catOf(p) === 'us-geo') {
    p.__type = p.slug.startsWith('best-iptv-for-firestick') ? 'firestick' : 'best';
    p.__place = p.city || p.locationName.split(',')[0]; p.__group = p.stateCode;
    if (!STATES[p.stateCode]) throw new Error('Unknown state ' + p.stateCode + ' for ' + p.slug);
  } else if (catOf(p) === 'uk-geo') {
    p.__type = p.slug.startsWith('premier-league') ? 'pl' : 'best';
    const u = ukParts(p); p.__place = u.place; p.__group = u.region || u.nation;
  } else if (p.category === 'device') { p.__place = p.deviceName; p.__group = p.countryCode; p.__type = p.deviceType; }
  else if (p.category === 'sports') { p.__place = p.sportName; p.__twin = true; }
}

// intent: precompute kind so "nearby" and SEO can use it
const draft = {};
for (const p of pages.filter((x) => catOf(x) === 'intent')) {
  const c = intentContent(p, pages);
  draft[p.slug] = c; p.__kind = c.__kind; p.__entity = c.__entity; p.__topic = c.__topic; p.__label = c.__topic;
}

// ---- Keep titles >= 32 chars and descriptions >= 125 chars by appending a useful, short clause
const TITLE_TAILS = [': Plans & Free Trial', ': Guide & Free Trial', ': Set-up & Trial'];
const META_TAILS = [' Works on Firestick, Android TV and smart TVs.', ' Set up in minutes on any device.', ' Ask for a free 24-hour trial before you pay.'];
function padTitle(t, seed) {
  if (t.length >= 32) return t;
  const { pick } = mk('pad:' + seed);
  const base = t.replace(/ \(\d{4}\)$/, '');
  for (const tail of [pick(TITLE_TAILS), ...TITLE_TAILS]) { const c = base + tail; if (c.length >= 32 && c.length <= 60) return c; }
  return t;
}
function padMeta(m, seed) {
  if (m.length >= 125) return m;
  const { pick } = mk('padm:' + seed);
  for (const tail of [pick(META_TAILS), ...META_TAILS]) { const c = m + tail; if (c.length >= 125 && c.length <= 158) return c; }
  return m;
}
const titles = new Set(); const metas = new Set();
const bySlug = {};
for (const p of pages) {
  let content;
  if (catOf(p) === 'us-geo') content = usContent(p, pages);
  else if (catOf(p) === 'uk-geo') content = ukContent(p, pages);
  else if (catOf(p) === 'device') content = deviceContent(p, pages);
  else if (catOf(p) === 'sports') content = sportsContent(p, pages);
  else content = intentContent(p, pages);
  delete content.__kind; delete content.__entity; delete content.__topic; delete content.__angle;

  const seo = seoFor(p);
  // guarantee uniqueness
  if (seo._tc) { const c = seo._tc.find((x) => x.length <= 60 && !titles.has(x)); if (c) seo.title = c; }
  if (seo._mc) { const c = seo._mc.find((x) => x.length <= 160 && !metas.has(x)); if (c) seo.metaDescription = c; }
  delete seo._tc; delete seo._mc;
  seo.title = padTitle(seo.title, p.slug);
  seo.metaDescription = padMeta(seo.metaDescription, p.slug);
  let t = seo.title, n = 2; while (titles.has(t)) { t = fit([`${seo.title.replace(/ \(\d{4}.*$/, '')} #${n}`], 60); n++; }
  titles.add(t); seo.title = t;
  let m = seo.metaDescription;
  if (m.length > 160) m = m.slice(0, 156).replace(/s+S*$/, "").replace(/[.,;:]+$/, "") + ".";
  if (metas.has(m)) {
    // same entity, different query: make the description specific to this page's topic
    const kw = String(p.targetKeyword || p.slug.replace(/-/g, ' ')).slice(0, 45);
    const tail = ` Topic: ${kw}.`;
    const base = m.slice(0, 158 - tail.length).replace(/s+S*$/, '').replace(/[.,;:]+$/, '') + '.';
    m = base + tail;
  }
  if (m.length > 160) m = m.slice(0, 156).replace(/\s+\S*$/, '').replace(/[.,;:]+$/, '') + '.';
  metas.add(m); seo.metaDescription = m;

  Object.assign(p, seo, { content });
  p.priceUsd = `$${PRICE_USD} / mo`;
  p.priceGbp = `£${PRICE_GBP} / mo`;
  const NON_LATIN = /[^\u0000-\u024F\u2000-\u206F]/;
  if (p.__kind === 'offtopic' || NON_LATIN.test(String(p.targetKeyword || ''))) p.noindex = true;
  // Class D (audit): pages with no standalone value. Third-party login queries (the page can only say "we cannot help"),
  // malformed/repeated slugs and non-English slugs whose body is English. They stay reachable (noindex, follow) and out of the sitemap.
  if (p.__kind === 'login' || LOW_VALUE.test(p.slug)) p.noindex = true;
  const mg = MERGES[p.slug];
  if (mg) {
    p.title = mg.title; p.h1 = mg.h1; p.metaDescription = mg.meta;
    const extra = (mergedKw[p.slug] || []).filter((k) => !p.secondaryKeywords.includes(k));
    p.secondaryKeywords = [...p.secondaryKeywords, ...extra].slice(0, 10);
  }
  titles.add(p.title); metas.add(p.metaDescription);
  bySlug[p.slug] = p;
}

// relatedPages: nearby geo + same-location counterpart; others keep list but refresh titles
for (const p of pages) {
  const rel = new Map();
  for (const n of p.content.nearby || []) if (!bySlug[n.slug]?.noindex || p.noindex) rel.set(n.slug, true);
  if (catOf(p) === 'us-geo' || catOf(p) === 'uk-geo') {
    const other = pages.find((x) => x.slug !== p.slug && catOf(x) === catOf(p) && x.__place === p.__place && x.__type !== p.__type && x.__group === p.__group);
    if (other) rel.set(other.slug, true);
  }
  if (p.category === 'device' || p.category === 'sports') {
    const twin = pages.find((x) => x.slug !== p.slug && x.category === p.category && x.__place === p.__place);
    if (twin) rel.set(twin.slug, true);
  }
  for (const r of p.relatedPages || []) if (bySlug[r.slug] && (!bySlug[r.slug].noindex || p.noindex) && rel.size < 8) rel.set(r.slug, true);
  p.relatedPages = [...rel.keys()].filter((s) => s !== p.slug && bySlug[s]).slice(0, 8)
    .map((s) => ({ slug: s, title: bySlug[s].title, h1: bySlug[s].h1, country: bySlug[s].country }));
}

// ---------- hubs + contextual internal links ----------
const { hubs, index: hubIndex, pageHub } = buildHubs(pages, cfg);

const SPORT_PAGES = [
  [/premier league/i, '/uk/sports/premier-league', 'Premier League on IPTV'], [/sky sports/i, '/uk/sports/sky-sports', 'Sky Sports on IPTV'],
  [/tnt sports|champions league|europa/i, '/uk/sports/tnt-sports', 'TNT Sports and European football'], [/nfl sunday|super bowl|nfl/i, '/sports/nfl-sunday-ticket', 'NFL on IPTV'],
  [/nba/i, '/sports/nba-league-pass', 'NBA on IPTV'], [/ufc|boxing|wwe|aew/i, '/sports/ufc-boxing-ppv', 'UFC and boxing PPV'], [/formula 1|f1|motogp/i, '/sports/formula-1', 'Formula 1 on IPTV'],
];
const DEVICE_PAGES = { firestick: ['/devices/firestick', 'Firestick set-up guide'], 'smart-tv': ['/devices/smart-tv', 'Smart TV set-up guide'], apple: ['/devices/apple-tv', 'Apple TV set-up guide'], 'mag-box': ['/devices/formuler-mag', 'MAG and Formuler set-up guide'], 'android-box': ['/all-devices', 'All device set-up guides'], pc: ['/all-devices', 'All device set-up guides'], console: ['/all-devices', 'All device set-up guides'] };

function contextLinks(p) {
  const { pick } = mk('links:' + p.slug);
  const isUk = p.countryCode === 'GB' || catOf(p) === 'uk-geo';
  const L = [];
  const add = (href, texts) => { if (href !== '/iptv/' + p.slug && !L.some((l) => l.href === href)) L.push({ href, text: Array.isArray(texts) ? pick(texts) : texts }); };
  const cat = catOf(p);
  if (cat === 'device') {
    const d = DEVICE_PAGES[p.deviceType];
    if (/tivimate/i.test(p.deviceName)) add('/apps/tivimate', 'TiviMate set-up guide');
    else if (/smarters/i.test(p.deviceName)) add('/apps/iptv-smarters-pro', 'IPTV Smarters Pro set-up guide');
    else if (/implayer/i.test(p.deviceName)) add('/apps/implayer', 'iMPlayer set-up guide');
    else if (d) add(d[0], d[1]);
    add('/blog/how-to-fix-iptv-buffering-isp-throttling', ['Fix IPTV buffering step by step', 'What to do if the stream buffers']);
    add('/blog/how-to-setup-iptv-firestick-2026', 'Step-by-step Firestick tutorial');
    add('/tools/internet-speed-calculator', ['Check how much internet speed you need', 'Internet speed calculator for streaming']);
    add(isUk ? '/uk/pricing' : '/pricing', ['See current IPTV plans and prices', 'Compare 1, 3, 6 and 12 month plans']);
    add(isUk ? '/uk/iptv-free-trial' : '/iptv-free-trial', ['Ask for a 24-hour free trial', 'How the free trial works']);
  } else if (cat === 'sports') {
    const sp = SPORT_PAGES.find(([re]) => re.test(p.sportName));
    if (sp) add(sp[1], sp[2]);
    add('/all-sports', 'All sports guides');
    add(isUk ? '/uk/devices/firestick' : '/devices/firestick', ['Set up on a Firestick', 'Firestick set-up guide']);
    add('/tools/internet-speed-calculator', ['How much internet speed do you need for live sport?', 'Internet speed calculator']);
    add(isUk ? '/uk/pricing' : '/pricing', ['See current IPTV plans and prices', 'Compare plans']);
    add(isUk ? '/uk/iptv-free-trial' : '/iptv-free-trial', ['Ask for a 24-hour free trial', 'Test the stream for free']);
  } else if (cat === 'us-geo' || cat === 'uk-geo') {
    add(isUk ? '/uk/pricing' : '/pricing', ['See current IPTV plans and prices', 'Compare 1, 3, 6 and 12 month plans', isUk ? 'IPTV pricing in the UK' : 'IPTV pricing in the USA']);
    add(isUk ? '/uk/iptv-free-trial' : '/iptv-free-trial', ['Ask for a 24-hour free trial', 'How the free trial works']);
    add(isUk ? '/uk/devices/firestick' : '/devices/firestick', ['Firestick set-up guide', 'How to install IPTV on a Fire TV Stick']);
    add('/tools/internet-speed-calculator', ['Check how much internet speed you need', 'Internet speed calculator for streaming']);
    add('/blog/how-to-fix-iptv-buffering-isp-throttling', ['Fix IPTV buffering step by step', 'What to do if the stream buffers']);
    if (isUk) add('/uk/sports/premier-league', 'Premier League on IPTV'); else add('/sports/nfl-sunday-ticket', 'NFL on IPTV');
  } else {
    add(isUk ? '/uk/pricing' : '/pricing', ['See current IPTV plans and prices', 'Compare plans']);
    add(isUk ? '/uk/iptv-free-trial' : '/iptv-free-trial', ['Ask for a 24-hour free trial', 'How the free trial works']);
    if (p.__kind === 'football') add('/uk/sports/premier-league', 'Premier League on IPTV');
    if (p.__kind === 'matchup') add('/sports/nfl-sunday-ticket', 'NFL on IPTV');
    if (/super-bowl/.test(p.slug)) add('/sports/super-bowl', 'Super Bowl on IPTV');
    if (/nba/.test(p.slug)) add('/sports/nba-league-pass', 'NBA games on IPTV');
    if (/ufc|fight/.test(p.slug)) add('/sports/ufc-boxing-ppv', 'UFC and boxing PPV on IPTV');
    if (/(^|-)f1(-|$)/.test(p.slug)) add('/sports/formula-1', 'Formula 1 on IPTV');
    if (/smart-tv|samsung|^lg-|oled|inch/.test(p.slug)) add('/devices/smart-tv', 'Smart TV set-up guide');
    if (/apple|ipad/.test(p.slug)) add('/devices/apple-tv', 'Apple TV set-up guide');
    if (/fire|downloader/.test(p.slug)) add('/devices/firestick', 'Firestick set-up guide');
    if (p.__kind === 'device') add('/all-devices', 'All device set-up guides');
    add('/blog/what-is-iptv-beginners-guide', ['New to IPTV? Start here', 'What is IPTV? A beginner guide']);
    add('/tools/internet-speed-calculator', 'Internet speed calculator');
    add('/blog/how-to-fix-iptv-buffering-isp-throttling', 'Fix IPTV buffering step by step');
  }
  return L.slice(0, 6);
}

for (const p of pages) {
  const h = pageHub[p.slug];
  if (h) p.content.hub = { label: 'All IPTV guides in ' + h.name, name: h.name, path: h.path };
  p.content.links = contextLinks(p);
}
const TOPIC_LABELS = { service: 'IPTV basics and buying guides', football: 'Football: teams and competitions', matchup: 'NFL matchups and game days', device: 'TVs, devices and set-up', login: 'Apps, accounts and logins', generic: 'More topics' };
const topicGroups = Object.keys(TOPIC_LABELS).map((k) => ({
  key: k,
  label: TOPIC_LABELS[k],
  items: pages.filter((p) => catOf(p) === 'intent' && !p.noindex && p.__kind === k).map((p) => ({ label: p.__label || p.h1, href: '/iptv/' + p.slug })).sort((a, b) => a.label.localeCompare(b.label)),
})).filter((g) => g.items.length);
for (const p of pages) if (catOf(p) === 'intent' && !p.noindex) p.content.hub = { label: 'All IPTV topic guides', name: 'Guides', path: '/guides' };
fs.writeFileSync(path.join(root, 'src/data/hubs.json'), JSON.stringify({ hubs, index: hubIndex, topics: topicGroups }, null, 2));
console.log(`Hubs: ${hubs.length} (${hubIndex.usa.length} US states, ${hubIndex.uk.length} UK regions)`);

// strip helper fields
for (const p of pages) for (const k of Object.keys(p)) if (k.startsWith('__')) delete p[k];

fs.writeFileSync(OUT, JSON.stringify(pages, null, 2));
fs.writeFileSync(path.join(root, 'src/data/redirects.json'), JSON.stringify(REDIRECTS, null, 2));
console.log(`Merged ${mergeSet.size} pages into ${Object.keys(MERGES).length} canonical pages; ${pages.filter((x) => x.noindex).length} pages set to noindex`);
console.log(`Wrote ${pages.length} pages -> ${path.relative(root, OUT)}`);

// search index
const mini = pages.filter((p) => !p.noindex).map((p) => ({ slug: p.slug, title: p.title, category: p.category.replace('-', ' ').toUpperCase() }));
fs.mkdirSync(path.join(root, 'public/data'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/data/pages-mini.json'), JSON.stringify(mini));
console.log(`Wrote search index (${mini.length})`);
