// One URL policy for the whole site (permalinks).
// src/data/site-config.json -> "trailingSlash": false  => https://site.com/pricing
//                              "trailingSlash": true   => https://site.com/pricing/
// Canonicals, sitemap, hreflang, schema and all internal links are built with the same rule
// (internal links in the built HTML are rewritten by scripts/postbuild.mjs).
import siteConfig from '../data/site-config.json';

export const domain: string = (siteConfig as any).domain;
export const trailingSlash: boolean = !!(siteConfig as any).trailingSlash;

/** Apply the slash policy to a site-relative path ("/pricing", "/uk/pricing?x=1#y"). */
export function withPolicy(path: string): string {
  if (!path || path === '/') return '/';
  const m = path.match(/^([^?#]*)(.*)$/)!;
  let p = m[1];
  const last = p.split('/').filter(Boolean).pop() || '';
  if (/\.[a-z0-9]{2,5}$/i.test(last)) return path; // real files (.xml, .png ...) are never touched
  p = p.replace(/\/+$/, '');
  if (trailingSlash) p += '/';
  return (p || '/') + m[2];
}

/** Absolute URL for a site-relative path. Home is always `${domain}/`. */
export function absUrl(path: string): string {
  const p = withPolicy(path || '/');
  return p === '/' ? `${domain}/` : `${domain}${p}`;
}

/** Normalise an absolute URL that already points at this site. Other hosts are returned unchanged. */
export function normalizeAbs(u: string): string {
  if (!u.startsWith(domain)) return u;
  return absUrl(u.slice(domain.length) || '/');
}
