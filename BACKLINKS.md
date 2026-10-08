# Backlink plan for 4KSubscriptionIPTV

Backlinks (links from other sites to yours) cannot be created by editing the website. They come from other people choosing to link, or from profiles and content you publish elsewhere. This file gives you a plan you can execute, the on-site assets that make linking easy, and ready-to-send messages.

## 0. Ground rules

Do:
- Earn links with useful assets (tools, guides, data) and real relationships.
- Keep the anchor text natural and varied.
- Link to the page that fits the reader, not always the home page.

Do not:
- Buy links, join link networks (PBNs) or exchange links in bulk.
- Spam comments, forums or profiles with links.
- Use the exact keyword "buy IPTV" as the anchor for most links. A page whose links nearly all say the same commercial phrase looks manipulated.

Niche warning: IPTV sits close to piracy in the eyes of many sites and of Google. Reputable publishers, universities and big communities often refuse to link to IPTV sellers. Focus on **informational assets** (the calculators, the guides, "is IPTV legal") and on people who write about cord-cutting, home networking and streaming devices. Expect a slow, selective campaign, not hundreds of links.

## 1. Linkable assets already on the site

| Asset | URL | Who might link and why |
|---|---|---|
| Internet speed calculator | `/tools/internet-speed-calculator` | Streaming and home-network bloggers, forums answering "how much speed do I need" |
| Cable savings calculator | `/tools/cable-savings-calculator` | Cord-cutting and money-saving blogs, deal sites |
| Plain-English guides | `/blog/what-is-iptv-beginners-guide`, `/blog/is-iptv-legal-us-uk-guide`, `/blog/m3u-vs-xtream-codes-explained` | Resource lists and "how it works" posts |
| Device tutorials | `/blog/how-to-setup-iptv-firestick-2026`, Samsung/LG, Apple TV, Android TV guides | Device forums and tech-help sites |
| Local hubs | `/locations/usa/{state}`, `/locations/uk/{region}` | Local community sites, regional blogs |
| Brand and press kit | `/brand` | Anyone who mentions you and needs a logo and a link snippet |

## 2. Where to get links, by effort

### A. Your own profiles (an hour, low value but needed)
- Create profiles with the same name, logo and description and link to the home page: Instagram, Facebook page, Telegram channel, YouTube channel, X, LinkedIn page, Pinterest.
- Put the profile URLs in `src/data/site-config.json` under `social` so they appear in the footer and in the Organization schema (`sameAs`).
- Business listings that accept online services: Crunchbase, Trustpilot (claim the profile and invite real customers to review), AlternativeTo (if you list as software), Product Hunt for the calculators.

### B. Content you publish elsewhere (best value for time)
- **YouTube tutorials** for each device (Firestick, Samsung, Apple TV). Put the matching guide URL in the description and pin a comment with it.
- **Guest posts** on tech, streaming and cord-cutting blogs: offer a data-led piece (for example "what speed you really need per screen") with a link to the calculator.
- **Answers on Quora, Reddit and device forums** where the question is exactly what a guide answers. Read each community's rules first. Many ban promotion. Be helpful, disclose who you are, and link only when it genuinely answers the question.
- **Infographics and screenshots** (bandwidth table, set-up steps) shared on Pinterest and with a "use with credit" link.

### C. Outreach (steady work, highest quality)
1. **Resource-page outreach.** Search Google for: `"cord cutting" resources`, `"streaming devices" guide`, `"home network" speed guide`. Find pages that list tools and suggest the calculators.
2. **Broken-link outreach.** Find dead links on those pages (a link checker helps) and offer your matching page as the replacement.
3. **Competitor and neighbour gap.** In Semrush (you already use it): Backlink Gap with 3 to 5 competitors. Look at sites that link to two or more of them but not to you. Pick the informational ones.
4. **Expert quotes.** Services such as Connectively (the successor to HARO), Qwoted and Featured connect journalists with sources. Answer questions about streaming, cord-cutting and home internet.
5. **Local angle.** Each state and region hub is a local resource. Local bloggers and community sites sometimes link to a local guide.

## 3. Anchor text mix (aim for this across all links)

| Type | Share | Example |
|---|---|---|
| Brand | 40 to 50 % | "4KSubscriptionIPTV", "4ksubscriptioniptv.com" |
| Page title or topic | 20 to 30 % | "internet speed calculator for IPTV" |
| Naked URL | 10 to 15 % | `https://4ksubscriptioniptv.com/tools/...` |
| Generic | 5 to 10 % | "this guide", "read more" |
| Exact commercial keyword | under 5 % | "IPTV subscription" |

## 4. Outreach templates

**Resource page**

> Subject: Suggestion for your cord-cutting resources page
>
> Hi {name},
>
> I found your page "{page title}" while looking for streaming resources, and it is a useful list. I run 4KSubscriptionIPTV and we built a free calculator that tells people how many Mbps they need for streaming based on the number of screens and the picture quality: {URL}.
> It might be a good fit for the section on {section}. No pressure at all, and thank you for the work you put into the page.
>
> {your name}

**Broken link**

> Subject: Broken link on "{page title}"
>
> Hi {name}, while reading "{page title}" I noticed the link to {dead URL} no longer works. We have a guide on the same topic that you could use instead: {URL}. Either way, thanks for a helpful page.

**Guest post**

> Subject: Guest article idea: how much internet speed you really need per screen
>
> Hi {name}, I read your post on {topic}. I would like to write an original article for your readers titled "{title}", with a simple table and worked examples. I would credit {your site} with one link in the author bio. If it is a fit, I can send an outline this week.

**Thank-you to someone who mentioned you without linking**

> Hi {name}, thank you for mentioning {brand} in {article}. Could you add a link to {URL} so readers can find it? Our press kit with logos is here: {brand page URL}.

## 5. 30-day starter plan

| Week | Do |
|---|---|
| 1 | Create all social profiles, fill `social` in `site-config.json`, claim Trustpilot, submit the sitemap in Search Console |
| 2 | Record two YouTube tutorials (Firestick, Samsung TV) with guide links; publish one guest post pitch list of 20 sites |
| 3 | Outreach round 1: 20 resource pages and 10 broken links, tracked in `backlinks-tracker.csv` |
| 4 | Answer 10 real questions on forums and Q and A sites; follow up on week 3 emails once; review results in Search Console (Links report) |

## 6. Tracking and measuring

- Use `backlinks-tracker.csv` (same folder) to log every contact, date, link URL and status.
- In Google Search Console, open **Links** to see who already links to you and the top linked pages.
- In Semrush, set up a Backlink Audit and a monthly report. Disavow only if you find clearly spammy links you did not create. A disavow is rarely needed.
- Judge success by referring domains of good quality and by growth in impressions for the pages you promote, not by raw link count.
