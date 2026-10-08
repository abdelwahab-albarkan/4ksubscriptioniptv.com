// Builds the location hub pages' data (src/data/hubs.json) from the enriched programmatic pages.
// Structure produced:   /all-locations  ->  /locations/usa/{state}   ->  /iptv/{city page}
//                                       ->  /locations/uk/{region}   ->  /iptv/{place page}
import { STATES, etTo, UK_REGION_CLUBS } from './seo-data.mjs';

const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = (a) => (a.length <= 1 ? a[0] || '' : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const fitStr = (c, max) => c.find((x) => x.length <= max) || c[c.length - 1].slice(0, max);
const lengthen = (t) => (t.length >= 125 ? t : (t + ' Pick your place and try it free.').length <= 158 ? t + ' Pick your place and try it free.' : t);

// stable pseudo-random pick so rebuilds do not reshuffle the text
const hash = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
const pick = (seed, arr) => arr[hash(seed) % arr.length];

export function buildHubs(pages, cfg) {
  const hubs = [];
  const pageHub = {}; // page slug -> hub {name, path}
  const PRICE_USD = cfg.pricing[0].priceUsd.toFixed(2);
  const PRICE_GBP = cfg.pricing[0].priceGbp.toFixed(2);

  // ---------------- US states ----------------
  const us = pages.filter((p) => p.category === 'us-geo');
  const byState = {};
  for (const p of us) (byState[p.stateCode] ||= []).push(p);

  for (const [code, list0] of Object.entries(byState)) {
    const st = STATES[code];
    const slug = code === 'DC' ? 'washington-dc' : slugify(st.name);
    const path = `/locations/usa/${slug}`;
    const places = {};
    for (const p of list0) { (places[p.__place] ||= {})[p.__type] = p; }
    const placeNames = Object.keys(places).sort((a, b) => a.localeCompare(b));
    const cityNames = placeNames.filter((n) => n !== st.name);
    const items = placeNames.map((name) => ({
      label: name,
      links: [
        places[name].best && { text: 'IPTV', href: `/iptv/${places[name].best.slug}` },
        places[name].firestick && { text: 'Firestick', href: `/iptv/${places[name].firestick.slug}` },
      ].filter(Boolean),
    }));
    // group by region when the state is big
    let groups;
    const regionsOf = {};
    for (const n of placeNames) { const r = (places[n].best || places[n].firestick).region || ''; (regionsOf[r] ||= []).push(n); }
    const regionKeys = Object.keys(regionsOf).filter(Boolean);
    if (placeNames.length >= 14 && regionKeys.length >= 2) {
      groups = Object.entries(regionsOf).sort((a, b) => b[1].length - a[1].length).map(([r, ns]) => ({ label: r || 'Statewide', items: items.filter((i) => ns.includes(i.label)) }));
      // merge tiny groups into "Other areas"
      const big = groups.filter((g) => g.items.length >= 3), small = groups.filter((g) => g.items.length < 3).flatMap((g) => g.items);
      groups = small.length ? [...big, { label: 'Other areas', items: small.sort((a, b) => a.label.localeCompare(b.label)) }] : big;
    } else groups = [{ label: `Cities and areas in ${st.name}`, items }];

    const early = etTo(st, 13), late = etTo(st, 16, 25);
    const sample = cityNames.slice(0, 4);
    const intro = [
      pick(code + 'a', [
        `We have ${list0.length} IPTV guides for ${st.name}, covering ${sample.length ? list(sample) : 'the state'}${cityNames.length > 4 ? ` and ${cityNames.length - 4} more places` : ''}. Pick your city to see set-up tips, the broadband providers people use there and local sport.`,
        `This is the hub for IPTV in ${st.name}. It links ${cityNames.length || 'all'} city guides, each with device set-up steps, speed advice for local broadband and a free-trial route.`,
        `Looking for IPTV in ${st.name}? Choose your area below. Every guide covers what you need to stream live TV and sport over home broadband, with notes for ${list(st.isps.slice(0, 3))} customers.`,
      ]),
      `${st.name} follows ${st.tz.label}. NFL early games start at ${early} and the late window at ${late} there. Local fans follow ${list(st.teams.slice(0, 3))}, so a channel list that includes the national sports networks matters.`,
      `Common internet providers in ${st.name} include ${list(st.isps)}. IPTV works on any of them; plan for about 8 to 10 Mbps for HD and 25 Mbps for 4K per stream.`,
    ];
    const faqs = [
      { q: `Can I use IPTV in ${st.name}?`, a: `Yes. IPTV streams over any broadband connection, including ${list(st.isps.slice(0, 3))}. A short free trial lets you test it on your own device and connection first.` },
      { q: `What speed do I need in ${st.name}?`, a: 'Plan for roughly 8 to 10 Mbps for HD and about 25 Mbps for 4K per stream, plus spare capacity for other devices.' },
      { q: `Which devices work in ${st.name}?`, a: 'Amazon Firestick, Android TV and Google TV boxes, Samsung and LG smart TVs, Apple TV, iPhone, iPad and computers all work with a compatible player.' },
    ];
    const title = fitStr([`IPTV in ${st.name}: City Guides, Plans & Trial`, `IPTV in ${st.name}: City Guides & Free Trial`, `IPTV in ${st.name}: All City Guides`], 60);
    hubs.push({
      type: 'us-state', slug, path, name: st.name, code, count: list0.length, places: placeNames.length,
      title,
      metaDescription: lengthen(fitStr([`IPTV in ${st.name}: ${placeNames.length} city and area guides, set-up steps for Firestick and smart TVs, local sport and a free trial. Plans from $${PRICE_USD}/mo.`, `Browse IPTV guides for ${st.name}: ${placeNames.length} places, device set-up, local sport and a free trial before you pay.`], 158)),
      h1: `IPTV in ${st.name}`,
      intro, facts: [
        { k: 'State', v: st.name }, { k: 'Capital', v: st.capital }, { k: 'Time zone', v: st.tz.label },
        { k: 'Common ISPs', v: list(st.isps) }, { k: 'Local teams', v: list(st.teams.slice(0, 4)) }, { k: 'Guides', v: String(list0.length) },
      ],
      groups, faqs,
      links: [{ text: 'IPTV plans and prices (USA)', href: '/pricing' }, { text: 'Free 24-hour trial', href: '/iptv-free-trial' }, { text: 'Firestick set-up guide', href: '/devices/firestick' }, { text: 'Internet speed calculator', href: '/tools/internet-speed-calculator' }],
      parent: { name: 'Locations', path: '/all-locations' },
      sibling: { region: st.tz.short },
    });
    for (const p of list0) pageHub[p.slug] = { name: st.name, path };
  }
  // neighbours: same time zone first, deterministic
  const usHubs = hubs.filter((h) => h.type === 'us-state');
  const tzOf = new Map(usHubs.map((h) => [h.slug, h.sibling.region]));
  for (const h of usHubs) {
    const same = usHubs.filter((o) => o !== h && tzOf.get(o.slug) === tzOf.get(h.slug));
    const rest = usHubs.filter((o) => o !== h && tzOf.get(o.slug) !== tzOf.get(h.slug));
    h.other = [...same.sort((a, b) => hash(h.slug + a.slug) - hash(h.slug + b.slug)).slice(0, 6), ...rest.sort((a, b) => hash(h.slug + a.slug) - hash(h.slug + b.slug)).slice(0, 2)].map((o) => ({ name: o.name, path: o.path }));
  }
  for (const h of usHubs) delete h.sibling;

  // ---------------- UK regions ----------------
  const uk = pages.filter((p) => p.category === 'uk-geo' && p.__place);
  const byRegion = {};
  for (const p of uk) (byRegion[p.__group === 'Yorkshire & Humber' ? 'Yorkshire' : p.__group] ||= []).push(p);
  for (const [region, list0] of Object.entries(byRegion)) {
    const isNations = region === 'UK Wide';
    const name = isNations ? 'UK nations' : region;
    const slug = isNations ? 'uk-nations' : slugify(region);
    const path = `/locations/uk/${slug}`;
    const places = {};
    for (const p of list0) (places[p.__place] ||= {})[p.__type] = p;
    const placeNames = Object.keys(places).sort((a, b) => a.localeCompare(b));
    const items = placeNames.map((n) => ({
      label: n,
      links: [places[n].best && { text: 'IPTV', href: `/iptv/${places[n].best.slug}` }, places[n].pl && { text: 'Premier League', href: `/iptv/${places[n].pl.slug}` }].filter(Boolean),
    }));
    const clubs = UK_REGION_CLUBS[region] || UK_REGION_CLUBS['UK Wide'];
    const sample = placeNames.slice(0, 4);
    const intro = [
      pick(region + 'a', [
        `We have ${list0.length} IPTV guides for ${isNations ? 'the nations of the UK' : name}, covering ${list(sample)}${placeNames.length > 4 ? ` and ${placeNames.length - 4} more places` : ''}. Choose your town or city for set-up tips and local football.`,
        `This is the hub for IPTV in ${isNations ? 'England, Scotland, Wales and Northern Ireland' : name}. Each guide covers devices, broadband speed and the football people follow locally.`,
        `Looking for IPTV in ${isNations ? 'the UK' : name}? Pick a place below to see how IPTV works on BT, Sky, Virgin Media and other broadband, with a free-trial route.`,
      ]),
      `Football fans here follow clubs such as ${list(clubs.slice(0, 4))}. Typical UK kick-off windows are Saturday 12:30, 15:00 and 17:30, Sunday 14:00 and 16:30 and midweek evenings, all in UK time.`,
      'Common broadband providers are BT, Sky Broadband, Virgin Media, TalkTalk, Plusnet and EE. Plan for about 8 to 10 Mbps for HD and 25 Mbps for 4K per stream.',
    ];
    const faqs = [
      { q: `Does IPTV work in ${isNations ? 'the UK' : name}?`, a: 'Yes. IPTV streams over any broadband line. A free trial lets you test it on your own connection and device first.' },
      { q: 'What internet speed do I need?', a: 'Plan for roughly 8 to 10 Mbps for HD and about 25 Mbps for 4K per stream, plus spare capacity for other devices.' },
      { q: 'Which devices can I use?', a: 'Amazon Firestick, Android TV and Google TV boxes, Samsung and LG smart TVs, Apple TV, iPhone, iPad and computers all work with a compatible player.' },
    ];
    hubs.push({
      type: 'uk-region', slug, path, name, count: list0.length, places: placeNames.length,
      title: fitStr([`IPTV in ${name}: Local Guides, Plans & Trial`, `IPTV in ${name}: Local Guides & Free Trial`, `IPTV in ${name}: All Guides`], 60),
      metaDescription: lengthen(fitStr([`IPTV in ${isNations ? 'the UK' : name}: ${placeNames.length} local guides, set-up steps, Premier League kick-off times and a free trial. Plans from £${PRICE_GBP}/mo.`, `Browse IPTV guides for ${isNations ? 'the UK' : name}: ${placeNames.length} places, devices, local football and a free trial.`], 158)),
      h1: `IPTV in ${name}`,
      intro,
      facts: [{ k: 'Area', v: name }, { k: 'Local clubs', v: list(clubs.slice(0, 4)) }, { k: 'Common ISPs', v: 'BT, Sky Broadband, Virgin Media, TalkTalk, Plusnet, EE' }, { k: 'Guides', v: String(list0.length) }],
      groups: [{ label: `Places in ${name}`, items }], faqs,
      links: [{ text: 'IPTV plans and prices (UK)', href: '/uk/pricing' }, { text: 'Free 24-hour trial', href: '/uk/iptv-free-trial' }, { text: 'Premier League on IPTV', href: '/uk/sports/premier-league' }, { text: 'Internet speed calculator', href: '/tools/internet-speed-calculator' }],
      parent: { name: 'Locations', path: '/all-locations' },
    });
    for (const p of list0) pageHub[p.slug] = { name, path };
  }
  const ukHubs = hubs.filter((h) => h.type === 'uk-region');
  for (const h of ukHubs) h.other = ukHubs.filter((o) => o !== h).sort((a, b) => hash(h.slug + a.slug) - hash(h.slug + b.slug)).slice(0, 6).map((o) => ({ name: o.name, path: o.path }));

  const index = {
    usa: usHubs.map((h) => ({ name: h.name, path: h.path, count: h.count, places: h.places })).sort((a, b) => a.name.localeCompare(b.name)),
    uk: ukHubs.map((h) => ({ name: h.name, path: h.path, count: h.count, places: h.places })).sort((a, b) => a.name.localeCompare(b.name)),
  };
  return { hubs, index, pageHub };
}
