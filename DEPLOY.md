# Deploying 4KSubscriptionIPTV

The site is a static Astro build. `npm run build` produces the whole site in `dist/` (about 1,700 pages). No server and no database are needed.

## 1. Before the first deploy (5 minutes)

Fill the blanks in **`src/data/site-config.json`** (empty values are simply skipped):

| Key | What to put |
|---|---|
| `domain` | Final domain, no trailing slash. Now: `https://4ksubscriptioniptv.com` |
| `supportEmail` | A mailbox that really exists |
| `analytics.ga4MeasurementId` / `plausibleDomain` / `clarityProjectId` | Your analytics ID (any one of them) |
| `googleSiteVerification` | The code Google Search Console gives you |
| `social.*` | Full profile URLs (Instagram, Facebook, Telegram, YouTube, X). They appear in the footer and in the Organization schema |
| `pricing[]` | Plan prices (see `PRICES.md`). Prices in text, hero, schema and generated pages follow it |
| `trailingSlash` | `false` = `/pricing`, `true` = `/pricing/`. Leave as is unless your host forces slashes |

After changing prices or contact data run `node scripts/enrich-seo-pages.mjs` once (it rewrites the text on the ~1,650 `/iptv/*` pages), then build.

## 2. Build locally

```bash
npm install
npm run build        # builds dist/, normalises links, writes _redirects + vercel.json
npm run check        # SEO + pre-deploy checks (must print "All checks passed")
npm run preview      # look at the real build on http://localhost:4321
```

## 3. Pick a host (all free tiers work)

### Cloudflare Pages (recommended)
1. Pages -> Create project -> connect the Git repo (or "Direct upload" and drop the `dist/` folder).
2. Build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION=20`.
3. Add the custom domain. `_redirects` and `_headers` are picked up automatically.

### Netlify
1. Add new site -> import the repo. `netlify.toml` already holds the settings.
2. Domain settings -> add the custom domain. `_redirects` and `_headers` are picked up automatically.

### Vercel
1. Import the repo. Framework preset "Astro" (or "Other") with build command `npm run build`, output `dist`.
2. `vercel.json` (generated at build time) sets clean URLs, the slash policy, redirects and headers.

## 4. Right after the site is live

1. **Search Console**: add the domain, paste the verification code in `site-config.json` (or verify by DNS), submit `https://YOUR-DOMAIN/sitemap.xml`.
2. Open https://search.google.com/test/rich-results with the home page, `/pricing` and one `/iptv/...` page. Organization, WebSite, BreadcrumbList, Product / Service and FAQ should appear without errors.
3. Share one page on WhatsApp / Facebook to check the social preview image (`og-default.png`).
4. Open `/robots.txt`, `/sitemap.xml`, `/favicon.ico` and a made-up URL (must show the 404 page).
5. Run Lighthouse on the home page on mobile.

## 5. Everyday editing

| I want to... | Edit |
|---|---|
| Change a page's meta title / description / canonical / noindex / social image | `src/data/seo/page-overrides.json` |
| Add a 301 redirect (renamed or removed page) | `src/data/seo/redirects.manual.json` |
| Change plan prices, phone, email, social links, analytics | `src/data/site-config.json` |
| Re-generate the programmatic `/iptv/*` pages' text | `node scripts/enrich-seo-pages.mjs` |
| Re-generate logo, favicons, OG image | `node scripts/generate-brand-assets.mjs` |
| Shrink new large images | `node scripts/optimize-images.mjs` (originals go to `_image-originals/`) |

Always finish with `npm run build && npm run check`.

## 6. Things to know

- The pricing section, hero and FAQ texts read the plans from `site-config.json`. Partner-provider cards on the home page show those sites' own prices and are written by hand in `ProviderCardsGrid.astro`.
- `PRICES.md` lists every price and saving claim in the project.
- 9 off-topic keyword pages are set to `noindex` and 12 near-duplicate pages are 301-redirected to a main page (see `scripts/enrich-seo-pages.mjs`, `MERGES`).
- The newsletter and contact forms open WhatsApp / the mail app with the message filled in. They do not store anything.
- If you enable analytics for visitors in the EU, add a cookie-consent banner.

## 7. Performance pipeline (automatic on every `npm run build`)

| Step | What it does |
|---|---|
| `scripts/build-redirects.mjs` | writes `public/_redirects` and `vercel.json` from the redirect lists |
| `scripts/build-assets.mjs` | copies the self-hosted Inter and Outfit fonts, builds a Font Awesome subset with only the icons used in `src/`, makes a `.webp` copy of every JPG and PNG in `public/images` |
| Astro build | static pages and bundled CSS and JS |
| `scripts/postbuild.mjs` | normalises internal links to the URL policy, switches `<img>` to WebP, adds `width`, `height` and `decoding="async"`, and removes images that no page references from `dist/` (set `PRUNE_IMAGES=0` to keep them) |

Notes:
- There are no third-party requests: fonts, icons and flags are served from the site itself.
- To add an image, put it in `public/images/` and use it in a page. Unused images are not shipped.
- To use a new icon, write `fa-solid fa-name` (or `fa-brands` / `fa-regular`) in any file under `src/`. Pro-only icons do not exist in the free set and are ignored with a warning.
- Report the page weight with `node scripts/perf-report.mjs /path`.
