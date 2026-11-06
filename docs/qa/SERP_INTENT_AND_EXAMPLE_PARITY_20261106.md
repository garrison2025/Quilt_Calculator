# Search-intent resolution and worked-example QA — 2026-11-06

**Scope:** US-English quilting calculator site, current `noindex` Cloudflare Pages preview. Original source: `docs/data/V2_Keyword_Appendix_218.csv` (historic Semrush volume/KD); derived worklist: `docs/data/V2_SEO_Operational_Keywords_218.csv`. Original numeric inputs and original source decisions were **not changed**.

## Public search samples — not a localized Google US Top-10 export

The searches below were performed through public web retrieval on 2026-11-06, rather than a logged-in US-localized Google SERP tool. We cannot verify the exact position, comprehensive top ten, query-personalization, US location pack, contemporary Google feature exposure, or share of each intent. The evidence is sufficient for conservative **deprioritization**, not for claims about complete US SERP competition or rankings.

### 1. `how much is 1 yard` — historical source US volume 1,900; KD 17

- <https://www.ezfabricinc.com/blogs/learn/how-much-is-a-yard-of-fabric> explains linear measurement (1 yd = 36 in = 91.44 cm), real bolt width, and the distinction between purchasing area and dollars per yard.
- <https://blog.treasurie.com/how-big-is-a-yard-of-fabric/> answers the fabric-size / length intent with inches and metric examples.
- <https://fabrictips.com/how-much-is-a-yard-of-fabric/> separately discusses length and pricing by fabric category; one answer is not a guaranteed price.
- **Observed mix:** generic one-yard *length / size* alongside “how much” *per-yard price*; user did not specify “fabric,” and even adding fabric can invite price intent.
- **Current response:** `/fabric-yards-to-inches/` explicitly supplies exact linear measurements, widths, fractions and a retailer-price limitation. It **does not** offer live product prices or claim that every 1-yard price query is satisfied.
- **Conservative decision:** `DEPRIORITIZE_AMBIGUOUS_LENGTH_PRICE`; preserve its historical `SUPPORT-ONE-PAGE` mapping, but exclude it from the primary **199 active nonbrand SEO targets** and do not create a second landing page.

### 2. `quilting calculator app` — historical source US volume 210; KD 25

- <https://apps.apple.com/us/app/quilt-geek-quilting-calculator/id6499062474> is a US App Store listing with native iPhone application distribution.
- <https://play.google.com/store/apps/details?hl=en_US&id=quilting.calculators> is a US-English Google Play listing for an actual Android calculator app.
- <https://quiltler.com/help/use-the-free-calculators> describes calculators available on the web **and** within an iPhone/iPad app; this demonstrates some mixed web/app intent rather than proving an exclusively native SERP.
- <https://getsashing.com/> markets both web calculators and mobile-app availability.
- **Observed mix:** downloadable mobile apps are prominent examples; a responsive website may satisfy a calculator task but is **not** an installed iOS/Android app.
- **Current response:** `/calculators/` remains the primary browser-based quilt calculator. Its FAQ describes the lack of native app distribution; titles/metadata do not falsely advertise an App Store app.
- **Conservative decision:** `DEPRIORITIZE_NATIVE_APP_INTENT`; preserve the historical `TARGET` route attribution while excluding this keyword from the **199 active nonbrand SEO targets**. No faux “download app” CTA or app-only doorway page.

**If exact US SERP Top-10 evidence is later supplied:** compare the URL/title/classification, mobile native vs browser distribution and price vs size intent; only then reconsider active targeting or landing-page requirements. No Google rankings, traffic gains or monetization claims follow from this review.

## Second audit finding: example numbers disagreed with the real default project

The live Project V2 sample has a `60 × 80 in` **center BEFORE borders**, a **3 in finished border per edge**, `66 × 86 in` **finished outside**, and a `74 × 94 in` backing rectangle after 4 in backing overage on each edge. With measured 43 in usable WOF, 1 in join take-up, no prewash length shrinkage and 1/8-yd shop increment, the engine selects **two vertical backing panels at 5.25 yd**. The old HUB editorial sample incorrectly stated **5 yd**, a figure applicable to a *different 60 × 80 finished-outside, unbordered* example.

The public HOME and HUB sample explanation now distinguish **center / outside / backing**. The HUB worked-example string is computed directly from the same V2 sample project, dimension resolver, backing seam selector and binding engine used to calculate actual shopping cuts. All dedicated backing/binding/batting *separate* 60 × 80 examples are explicitly labeled **unbordered finished-outside examples**.

### Release conditions deliberately unchanged

- 218 historical source rows, historical 202 mapped intents, 16 method HOLD rows, 1 excluded other-brand row, and **199 active non-brand search intents** are preserved.
- Index remains **off** on pages.dev; no production domain, Search Console, live US SERP Top-10 export, advertising or native app distribution has been verified.
- Human print calibration and real-fabric cutting signoff remain **manual and incomplete**. App and fabric price claims are not added without functionality.
- A future owned domain requires independent host-specific canonical/index/sitemap/robots validation before the site can accept Google indexing.
