# Quilt Cut Planner — content and search-intent audit (2026-11-08)

## Scope and evidence boundaries

This is a second-stage review of the live production content on `https://quiltcutplanner.com`, the current source-controlled route/FAQ copy, the 218-row original US Semrush snapshot, and public competitor pages retrievable on 2026-11-08.

The competitor checks are a **public-web sample**, not a location-locked Google US Top-10 export, current Semrush/Ahrefs refresh, or ranking measurement. Search result presence does not prove traffic or revenue. Preserve all original source volume/KD values. Google Search Console remains explicitly deferred; no account access, verification, or sitemap submission occurred.

## Operational keyword correction

The original phrase `border fabrics for quilting` has historical Semrush values of **590 US searches/month and KD 8**, and was previously classified TARGET for `/quilt-border-calculator/`. Public search samples on 2026-11-08 returned fabric-retail categories, border-print fabric listings and product-shopping pages (including Spotlight, Etsy and Shabby Fabrics), not a calculator task.

- Preserve the original row, source values, original TARGET decision and historical route attribution.
- Change only the derived operational status to `DEPRIORITIZE_PRODUCT_INTENT`.
- Do not build a product directory, add shopping affiliate claims, or count this query as an active calculator opportunity.

Updated operational totals: **218 original records; 202 historical route assignments; 198 active non-brand intents; 3 deprioritized intents; 1 other-brand exclusion; 16 unsupported-method HOLD**. These are classifications of the supplied historical keyword list, not rankings or expected traffic.

## Public competitor sample and content boundaries

| Intent | Public pages/features observed | Our supported scope and action |
|---|---|---|
| Backing | FiberTools, The Craft Mat, QuiltHelper and QuiltClarity show panel count/direction, overage and/or wide-back comparisons. | Existing backing calculator already compares permitted panel directions and usable WOF. Retain its explicit limits on diagonal backing and directionality. No new feature justified by this sample. |
| Binding | Public quilt calculators and sewing references distinguish straight-grain and bias binding; some competitor tools advertise both. | Our calculator computes **straight-grain only**. Make that boundary explicit in H1/title; keep bias-related keywords and cutting methods HOLD. |
| Borders | QuiltMeasure presents up to five border layers, strip counts and yardage; Quiltler also documents butted and mitered corner options. | Our engine supports up to five **butted, side-first** layers, not mitered or pieced borders. Make the supported construction explicit in H1/title and retain the no-miter FAQ. Do not implement mitered yardage from a search sample alone. |
| Batting | QuiltMeasure covers one-piece roll width/orientation; FiberTools and QuiltLab also discuss packaged batting sizes. | Our tool checks a **single-piece cut from a roll**. It does not select or compare packaged batting products and does not calculate joins. Clarify this in the FAQ; users should compare the actual package dimensions themselves. |
| Sashing | Quiltler and QuiltCalcs describe both cornerstone and no-cornerstone long-strip arrangements; some also offer outside-edge sashing. | Our engine models internal sashing **with a cornerstone at every intersection** and no outer sashing. Clarify the unsupported alternatives; do not present the current strip count as universal for other layouts. |
| Repeated-piece yardage | FabricYardageCalculator and Fabric Formula advertise pattern-repeat inputs, allowances and/or custom mixed-piece lists. | Our `/fabric-yardage-calculator/` is for repeated rectangles and does not automatically match pattern repeats. The separate `/quilt-fabric-calculator/` handles multiple rectangular cut groups and separate SKUs, but also does not compute motif-repeat alignment. Tell users to enter cut dimensions after allowing for repeat matching. |
| Yard-to-inch conversion | Public pages commonly answer the exact linear length and distinguish it from bolt width. | The existing single conversion page already provides the direct 36-inch answer and a fraction/centimeter table. Put the highest-volume source query `how big is a yard of fabric` first in its title/H1; keep one page, not fraction clones. |

### Public sources checked

- `https://quiltmeasure.com/tools/batting-calculator/`
- `https://quiltmeasure.com/tools/quilt-border-yardage-calculator/`
- `https://quiltler.com/help/work-out-borders`
- `https://quiltler.com/help/work-out-sashing`
- `https://quiltcalcs.com/quilt-sashing-calculator/`
- `https://www.fabricyardagecalculator.com/`
- `https://fabricformula.com/fabric-yardage-calculator/`
- `https://www.quiltlab.co/quilting-calculators/batting-size`
- `https://fibertools.app/quilting/batting-calculator`
- `https://www.spotlightstores.com/en-sg/c/animals-birds-quilting-fabric`
- `https://www.etsy.com/market/border_print_fabric`
- `https://www.shabbyfabrics.com/c80/fabrics/fabrics-by-type/border-prints`

## Copy and FAQ refinements in this release

1. **Yards-to-inches:** title/H1 now lead with `How big is a yard of fabric?` while retaining the existing `fabric yards to inches` primary intent; the quick-answer heading supplies the direct 36-inch answer and distinguishes length from width. The hero and Open Graph image alt now correctly describe the generated fraction-conversion chart instead of calling it a cutting-layout diagram.
2. **Binding:** title/H1 explicitly say straight-grain, avoiding an implication that bias binding is supported.
3. **Borders:** title/H1 explicitly say butted, avoiding an implication that mitered corners are supported.
4. **Fabric Yardage:** H1 says repeated rectangular cuts; FAQ explains pattern-repeat/motif matching is not automatic and points mixed-piece or multi-SKU projects to the separate Quilt Fabric Calculator.
5. **Quilt Fabric:** FAQ explains that repeat/motif alignment must be included in entered cut dimensions.
6. **Batting:** FAQ explains that the tool checks one-piece roll cuts, not packaged-size selection or joins.
7. **Sashing:** FAQ explains that cornerstones are required in this implementation and outside/no-cornerstone layouts are not modeled.

No calculator formula, cut-layout algorithm, purchase amount, project schema, route, canonical, robots policy, or sitemap URL is changed. No new indexable page is created. The 218-row original appendix is unchanged.

## Remaining SEO evidence gaps

- The supplied Volume/KD values are a historical Semrush snapshot; no new Volume, KD or CPC is claimed.
- Exact US-localized Google SERP Top-10 exports and competitor domain-level organic keyword exports are not available in this audit.
- Google rankings, indexed query coverage, impressions, clicks and CTR are unknown because GSC remains deferred.
- No new claim is made about AdSense, revenue, or actual user Core Web Vitals.
