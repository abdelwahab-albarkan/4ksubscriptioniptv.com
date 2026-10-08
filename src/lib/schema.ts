// Structured data (schema.org JSON-LD) builder used by src/layouts/Layout.astro.
// Everything here is derived from src/data/site-config.json, so changing prices, contact details or
// social links there updates the markup on every page.

import siteConfig from '../data/site-config.json';
import { absUrl } from './url';

type Crumb = { name: string; url: string };

export interface SchemaInput {
  url: string;                    // canonical URL of this page
  path: string;                   // pathname without trailing slash ('' = home)
  title: string;
  description: string;
  image: string;                  // absolute URL
  imageAlt?: string;
  isUk: boolean;
  breadcrumbs?: Crumb[];
  pageType?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage' | 'Blog' | 'Article';
  commercial?: 'product' | 'service' | 'none';
  serviceArea?: string;           // e.g. "Los Angeles, California"
  faqSchema?: any;
  articleSchema?: any;
  extra?: any[];                  // extra schema nodes (e.g. ItemList)
  datePublished?: string;
  dateModified?: string;
}

const cfg: any = siteConfig;
const domain: string = cfg.domain;
const ids = {
  org: `${domain}/#organization`,
  site: `${domain}/#website`,
  logo: `${domain}/#logo`,
};

const clean = (o: any): any => {
  // drop empty values so the JSON-LD stays valid and compact
  if (Array.isArray(o)) return o.map(clean).filter((v) => v !== undefined);
  if (o && typeof o === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(o)) {
      const c = clean(v);
      if (c === undefined || c === '' || c === null) continue;
      if (Array.isArray(c) && c.length === 0) continue;
      out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return o;
};

export function organization() {
  const social = Object.values(cfg.social || {}).filter(Boolean) as string[];
  const phone = cfg.whatsappNumber as string;
  return {
    '@type': 'Organization',
    '@id': ids.org,
    name: cfg.siteName,
    alternateName: cfg.brandShort,
    url: absUrl('/'),
    logo: { '@type': 'ImageObject', '@id': ids.logo, url: `${domain}/logo.png`, contentUrl: `${domain}/logo.png`, width: 1200, height: 300, caption: cfg.siteName },
    image: `${domain}/og-default.png`,
    slogan: cfg.tagline,
    description: 'IPTV subscriptions, device set-up guides and reseller information for live sport, movies and 4K streaming.',
    email: cfg.supportEmail,
    telephone: phone,
    sameAs: social,
    areaServed: ['US', 'GB', 'DE', 'FR', 'ES'].map((c) => ({ '@type': 'Country', name: c })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: phone,
        email: cfg.supportEmail,
        url: absUrl('/contact'),
        availableLanguage: ['English', 'German', 'French', 'Spanish'],
        areaServed: ['US', 'GB', 'DE', 'FR', 'ES'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      },
    ],
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': ids.site,
    url: absUrl('/'),
    name: cfg.siteName,
    description: cfg.tagline,
    inLanguage: 'en',
    publisher: { '@id': ids.org },
  };
}

// Real plans from site-config.json (no invented ratings or review counts).
function offers(isUk: boolean, pageUrl: string) {
  const plans: any[] = cfg.pricing || [];
  const currency = isUk ? 'GBP' : 'USD';
  const key = isUk ? 'priceGbp' : 'priceUsd';
  const until = `${new Date().getFullYear() + 1}-12-31`;
  const list = plans.map((p) => ({
    '@type': 'Offer',
    name: `${p.duration} IPTV subscription`,
    price: Number(p[key]).toFixed(2),
    priceCurrency: currency,
    priceValidUntil: until,
    availability: 'https://schema.org/InStock',
    url: absUrl(isUk ? '/uk/pricing' : '/pricing'),
    seller: { '@id': ids.org },
  }));
  const prices = plans.map((p) => Number(p[key]));
  return {
    '@type': 'AggregateOffer',
    priceCurrency: currency,
    lowPrice: Math.min(...prices).toFixed(2),
    highPrice: Math.max(...prices).toFixed(2),
    offerCount: String(plans.length),
    offers: list,
  };
}

function returnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: ['US', 'GB', 'DE', 'FR', 'ES'],
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    merchantReturnLink: absUrl('/refund-policy'),
  };
}

export function buildGraph(i: SchemaInput) {
  const isHome = i.path === '';
  const webPageId = `${i.url}#webpage`;
  const crumbId = `${i.url}#breadcrumb`;
  const graph: any[] = [organization(), website()];

  // ---- WebPage (typed per page kind)
  const types: Record<string, string> = { WebPage: 'WebPage', AboutPage: 'AboutPage', ContactPage: 'ContactPage', CollectionPage: 'CollectionPage', FAQPage: 'WebPage', Blog: 'CollectionPage', Article: 'WebPage' };
  const pageType = i.pageType || 'WebPage';
  graph.push({
    '@type': types[pageType] || 'WebPage',
    '@id': webPageId,
    url: i.url,
    name: i.title,
    description: i.description,
    inLanguage: i.isUk ? 'en-GB' : 'en-US',
    isPartOf: { '@id': ids.site },
    about: { '@id': ids.org },
    primaryImageOfPage: { '@type': 'ImageObject', url: i.image, caption: i.imageAlt || i.title },
    breadcrumb: isHome ? undefined : { '@id': crumbId },
    datePublished: i.datePublished,
    dateModified: i.dateModified,
  });

  // ---- Breadcrumbs
  if (!isHome && i.breadcrumbs && i.breadcrumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': crumbId,
      itemListElement: i.breadcrumbs.map((c, n) => ({
        '@type': 'ListItem',
        position: n + 1,
        name: c.name,
        item: c.url,
      })),
    });
  }

  // ---- Commercial entity
  const lang = i.isUk ? 'GB' : 'US';
  if (i.commercial === 'product' || isHome) {
    graph.push({
      '@type': 'Product',
      '@id': `${i.url}#product`,
      name: `${cfg.siteName} IPTV subscription`,
      description: i.description,
      image: i.image,
      brand: { '@type': 'Brand', name: cfg.siteName },
      category: 'IPTV streaming subscription',
      url: i.url,
      offers: { ...offers(i.isUk, i.url), hasMerchantReturnPolicy: returnPolicy() },
    });
  } else if (i.commercial === 'service') {
    graph.push({
      '@type': 'Service',
      '@id': `${i.url}#service`,
      name: i.serviceArea ? `IPTV subscription in ${i.serviceArea}` : `${cfg.siteName} IPTV subscription`,
      serviceType: 'IPTV streaming subscription',
      description: i.description,
      provider: { '@id': ids.org },
      areaServed: i.serviceArea ? { '@type': 'Place', name: i.serviceArea } : { '@type': 'Country', name: lang },
      url: i.url,
      offers: offers(i.isUk, i.url),
    });
  }

  // ---- FAQ + Article (supplied by the page)
  if (i.faqSchema?.mainEntity) graph.push({ '@id': `${i.url}#faq`, ...i.faqSchema, mainEntityOfPage: { '@id': webPageId } });
  if (i.articleSchema) {
    graph.push({
      '@id': `${i.url}#article`,
      mainEntityOfPage: { '@id': webPageId },
      image: i.image,
      inLanguage: 'en',
      publisher: { '@id': ids.org },
      author: { '@id': ids.org },
      ...i.articleSchema,
      // keep the page's own publisher/author name but link to the organization entity
      ...(i.articleSchema.publisher ? { publisher: { '@id': ids.org } } : {}),
    });
  }

  if (i.extra?.length) graph.push(...i.extra);

  return clean({ '@context': 'https://schema.org', '@graph': graph });
}

// ---- helpers used by the layout -------------------------------------------------

const SEGMENT_LABELS: Record<string, { name: string; url?: string }> = {
  uk: { name: 'United Kingdom', url: '/uk' },
  devices: { name: 'Devices', url: '/all-devices' },
  sports: { name: 'Sports', url: '/all-sports' },
  blog: { name: 'Blog', url: '/blog' },
  apps: { name: 'Apps' },
  features: { name: 'Features' },
  alternatives: { name: 'Alternatives' },
  de: { name: 'Deutsch', url: '/de' },
  es: { name: 'Español', url: '/es' },
  fr: { name: 'Français', url: '/fr' },
  iptv: { name: 'IPTV Guides', url: '/all-locations' },
};

export function shortName(title: string) {
  return title.split(/\s[|–—-]\s|:\s/)[0].replace(/\s*\(\d{4}[^)]*\)\s*$/, '').trim() || title;
}

export function autoBreadcrumbs(path: string, title: string, lastName?: string, category?: string): Crumb[] {
  const home: Crumb = { name: 'Home', url: absUrl('/') };
  if (path === '') return [home];
  const segs = path.split('/').filter(Boolean);
  const crumbs: Crumb[] = [home];
  let acc = '';
  segs.slice(0, -1).forEach((s) => {
    acc += '/' + s;
    const m = SEGMENT_LABELS[s];
    if (m && (m.url || acc)) {
      if (s === 'iptv') {
        // programmatic pages: link the matching directory instead of a non-existent /iptv index
        const hub = category === 'device' ? ['Devices', '/all-devices'] : category === 'sports' ? ['Sports', '/all-sports'] : category === 'us-geo' || category === 'uk-geo' ? ['Locations', '/all-locations'] : null;
        if (hub) crumbs.push({ name: hub[0], url: absUrl(hub[1]) });
        return;
      }
      if (m.url) crumbs.push({ name: m.name, url: absUrl(m.url) });
    }
  });
  crumbs.push({ name: lastName || shortName(title), url: absUrl(path) });
  return crumbs;
}
