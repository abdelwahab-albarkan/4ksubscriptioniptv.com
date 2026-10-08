import pagesData from '../data/pages-data.json';
import siteConfig from '../data/site-config.json';
import hubData from '../data/hubs.json';
import { articles } from '../data/articles.mjs';
import { normalizeAbs } from '../lib/url';
import clusterDefs from '../data/seo/cluster-definitions.json';

export async function GET() {
  // Only articles have a real publication date; for every other URL we omit <lastmod> instead of inventing one.
  const realDates = Object.fromEntries(articles.map((a) => [`${siteConfig.domain}/blog/${a.slug}`, a.datePublished]));
  const domain = siteConfig.domain;
  const today = new Date().toISOString().split('T')[0];

  // Core canonical hub pages
  const canonicalClusterUrls = Object.values(clusterDefs).map(c => ({
    url: `${domain}${c.url}`,
    priority: c.priority === 'P0' ? '1.0' : (c.priority === 'P1' ? '0.9' : '0.8'),
    changefreq: 'daily'
  }));

  const coreDirectoryUrls = [
    { url: `${domain}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${domain}/uk`, priority: '1.0', changefreq: 'daily' },
    { url: `${domain}/de`, priority: '0.9', changefreq: 'weekly' },
    { url: `${domain}/fr`, priority: '0.9', changefreq: 'weekly' },
    { url: `${domain}/es`, priority: '0.9', changefreq: 'weekly' },
    { url: `${domain}/blog`, priority: '0.9', changefreq: 'daily' },
    { url: `${domain}/blog/how-to-setup-iptv-firestick-2026`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/blog/best-iptv-apps-comparison-tivimate-vs-smarters`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/blog/how-to-fix-iptv-buffering-isp-throttling`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/blog/start-iptv-reseller-business-guide`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/all-locations`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/all-devices`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/all-sports`, priority: '0.8', changefreq: 'weekly' },
    { url: `${domain}/about`, priority: '0.5', changefreq: 'monthly' },
    { url: `${domain}/faq`, priority: '0.7', changefreq: 'monthly' },
    { url: `${domain}/refund-policy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${domain}/cookie-policy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${domain}/contact`, priority: '0.5', changefreq: 'monthly' },
    { url: `${domain}/privacy-policy`, priority: '0.3', changefreq: 'yearly' },
    { url: `${domain}/terms-of-service`, priority: '0.3', changefreq: 'yearly' }
  ];

  // Location hubs, new articles and tools
  const hubUrls = hubData.hubs.map((h) => ({ url: `${domain}${h.path}`, priority: '0.8', changefreq: 'weekly' }));
  const articleUrls = articles.map((a) => ({ url: `${domain}/blog/${a.slug}`, priority: '0.7', changefreq: 'monthly' }));
  const toolUrls = ['/tools', '/tools/internet-speed-calculator', '/tools/cable-savings-calculator', '/brand', '/guides'].map((p) => ({ url: `${domain}${p}`, priority: p === '/tools' ? '0.6' : '0.7', changefreq: 'monthly' }));

  // Supporting long-tail pages
  const supportingPageUrls = pagesData.filter(page => !page.noindex).map(page => ({
    url: `${domain}/iptv/${page.slug}`,
    priority: '0.7',
    changefreq: 'weekly'
  }));

  // Deduplicate URLs
  const urlMap = new Map();
  for (const item of [...coreDirectoryUrls, ...canonicalClusterUrls, ...hubUrls, ...articleUrls, ...toolUrls, ...supportingPageUrls]) {
    if (!urlMap.has(item.url)) {
      urlMap.set(item.url, item);
    }
  }

  const allUrls = Array.from(urlMap.values()).map((u) => ({ ...u, url: normalizeAbs(u.url) }));

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    ${realDates[u.url] ? `<lastmod>${realDates[u.url]}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
