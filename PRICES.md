# Prices on the site: full inventory

Fill in the **"Your price"** columns, then give this file back and every place below will be wired to one source (`src/data/site-config.json`).

---

## 1. The 4 customer plans (source: `src/data/site-config.json` -> `pricing`)

These are the plans shown in the pricing section (home, `/pricing`, `/uk/pricing`, every `/iptv/*` page).

| Plan | Connections | USD now | GBP now | EUR now | "Was" price (USD) | Badge now | **Your USD** | **Your GBP** | **Your EUR** |
|---|---|---|---|---|---|---|---|---|---|
| 1 Month | 1 | $12.99 | £10.99 | €11.99 | $24.99 | Standard | | | |
| 3 Months | 1 | $29.99 | £24.99 | €27.99 | $59.99 | Save 30% | | | |
| 6 Months | 2 | $45.99 | £39.99 | €42.99 | $99.99 | Save 45% | | | |
| 12 Months | 2 (free upgrade) | $64.99 | £54.99 | €59.99 | $149.99 | BEST VALUE - SAVE 60% (popular) | | | |

Notes:
- The "was" price and the "Save X%" badges are plain text in the config, not calculated. If you change a price, the badge percentage must be changed by hand.
- Each plan also has a feature list inside the config (channel counts, "Free PPV events", "7-day money-back"...). Those are not prices but they promise things, so check them too.
- The pricing section currently shows "One-time payment" under every price.

---

## 2. Prices typed directly in the code (they do NOT follow the config)

These will keep the old number until they are changed. Several already disagree with the plans above.

| Where | What it shows now | Problem |
|---|---|---|
| `HeroSection.astro` (default) | "View All Plans ($10.00 / mo)" and £8.50 / mo | Home page hero says $10.00, but the cheapest plan is $12.99 |
| `ClusterPageTemplate.astro` | $12.99 / mo, £10.99 / mo (hard-coded, 3 places) | Used by `/pricing`, `/uk/pricing`, trial, device, sport and app pages |
| `pages-data.json` (all ~1,650 `/iptv/*` pages) | priceUsd "$12.99 / mo", priceGbp "£10.99 / mo", discount "50% OFF" | Same value on every page |
| `KeywordSeoContent.astro` | "only $10.00/month" (US) and "only £10.99/month" (UK) | $10.00 contradicts the $12.99 plan |
| `FaqAccordion.astro` | "costs only $10.00/month" | Same |
| `404.astro` | "subscriptions from $10/mo" | Same |
| `Layout.astro` (structured data) | lowPrice 5.00 / highPrice 64.99 (US), 4.00 / 55.00 (UK), offerCount 14 | Invented range; Google can compare it with the page |
| `Header.astro` (older header, not used now) | "Get 50% OFF" | Unused |
| Announcement / hero badges | "50% OFF" | Not tied to a real price |

## 3. Partner / provider prices (Providers section on the home page)

Prices of the 12 other provider sites listed in `ProviderCardsGrid.astro`. These are other businesses' prices, not yours. Decide whether to keep, hide or replace them.

| Provider | Price shown |
|---|---|
| StreamB4 | $10.00 / month |
| UK Stream 4K | £10.99 / month |
| Roku Stream | $9.99 / month |
| Ultra 8K IPTV | $11.50 / month |
| Tvnado 2026 | $10.00 / month |
| IPTV Smarters TV FR | 10.00 € / mois |
| 4K German IPTV | 10.99 € / monat |
| Germany Stream TV | 9.99 € / monat |
| Stream Germany 4K | 9.50 € / monat |
| 4K Deutsch | 9.00 € / monat |
| 4K Spain TV | 10.00 € / mes |
| Agency Fluxly | $5.00 / credit |

## 4. Reseller prices (wholesale credits and resale)

No reseller price list exists on the site. Only examples and claims are written in text:

| Where | Text now |
|---|---|
| `InteractiveFaqSection.astro` | wholesale "$2-$5/mo per sub", starter credits "$50-$100", resell at "$10-$20/month", examples "50 customers at $15/mo = $750/mo", "100 = $1,500/mo", "300 = $4,500/mo" |
| `ComparisonMatrixTable.astro` | "wholesale credit purchasing (from $2-$5/mo per sub)" |
| `ComparisonTable.astro` | IPTV "$5 - $12 / mo", cable "$120 - $180 / mo", other IPTV "$3 - $6 / mo" |
| Blog: reseller guide | many examples ($2.50, $3/mo, $4.00, $12.99, $15/mo, $18.00, $150-$750/month) |

If you sell reseller credits, you need a real reseller price table. Tell me the credit packs (for example 10 / 50 / 100 credits) and the price of each.

## 5. Savings claims (marketing numbers, not prices)

| Where | Claim |
|---|---|
| `KeywordSeoContent.astro` | Cable "$135/month", "Save over $1,400 / year"; Sky/Virgin "£95/month", "Save £900+ annually" |
| `FaqAccordion.astro` | "$135/month ($1,620/year)", "saving over $1,400" |
| `StreamingInfrastructureSection.astro` | Cable "$120 to £95 per month" |
| `ChannelSportsGrid.astro` | "Save over $1,200/year on pay-per-view" |
| `CustomerReviews.astro` | Review text: "Saved over £1,100 compared to Sky and Virgin" |

These savings are calculated against your own price. After you pick prices, the "save" figures should be recomputed so they stay true.

## 6. Also generated from the config

`scripts/enrich-seo-pages.mjs` writes "Plans start from $12.99" and "£10.99" into the `/iptv/*` pages and into their meta descriptions, reading the 1-month plan from the config. After changing the config, run `node scripts/enrich-seo-pages.mjs` and rebuild.

---

## Questions for you

1. Your 4 plan prices in USD, GBP and EUR (table in section 1).
2. Keep the "was" prices and "Save X%" badges, or remove them?
3. Is the free trial really free (24 hours)? Is the refund really 7 days?
4. Do you sell reseller credits? If yes, the packs and prices.
5. Keep the 12 partner provider prices (section 3), or hide the price lines?
