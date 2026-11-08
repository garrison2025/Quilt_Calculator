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
2. **Binding:** title/H1 explicitly say straight-grain, avoiding an implication that bias binding is supported. The active long-tail query `standard twin quilt size dimensions binding yardage` (historical 70 / KD 14) now has an engine-derived 68 × 86 in illustrative example (8 strips; ⅝ yd at 2½ in strip width, 43 in usable WOF, 12 in tail and 2½ in join loss). It is labeled as an example, not a universal twin-size standard.
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


## Queen-size quilt-top intent — 2026-11-08

The original operational keyword snapshot contains `how much fabric for a queen size quilt` at **110 US searches/month, KD 2**, mapped to `/quilt-fabric-calculator/`. This is an existing active query, not a newly researched volume or ranking claim.

Public result samples show why a single generic yardage answer would be misleading:
- StitchTested (updated 2026-10-16) explicitly separates backing/binding/batting from the quilt top, and says the top depends on the pattern; its worked top example uses a 90 × 100 in layout of 10-in squares.
- QuiltCalcs publishes a queen example at 90 × 95 in and a mixed-piece top assumption.
- QuiltLab's calculator derives fabric for square patchwork from finished size, square size, fabric count and usable width, and labels the top as separate from backing, binding and borders.
- The Craft Mat likewise separates top yardage from backing, binding and border totals.

The site now adds one **engine-derived, explicitly defined** 90 × 90 in two-colour checkerboard top: 12 × 12 finished 7½-in squares; 144 total pieces; 72 cut 8 × 8 in squares per SKU (¼-in seam allowance on every edge); 43 in usable WOF per SKU; 5 pieces across; 15 rows; 120 in cut run per SKU; 0% length shrinkage; upward ⅛-yd purchase rounding. The calculator engine returns **3⅜ yd per SKU and 6¾ yd total for the quilt top only**.

This is not presented as a universal queen-size dimension or yardage standard. It excludes backing, batting, borders, binding, prewash shrinkage and automatic motif-repeat matching. The FAQ says that a real purchase must use the user's actual pattern cut list. A two-row table displays each SKU separately, so different fabrics are not incorrectly combined into one physical roll.

Public references checked:
- `https://stitchtested.com/how-much-fabric-for-a-quilt/`
- `https://quiltcalcs.com/fabric-yardage-calculator/`
- `https://www.quiltlab.co/quilting-calculators/fabric-yardage`
- `https://thecraftmat.com/quilting/quilt-calculator/`

No new route, generic size chart, unsupported calculation, or change to the 218-row original keyword source is introduced.


## Production release and 12-URL mobile lab — 2026-11-08

- PR #53 was merged as `d5e88f90f31b31f3fd3c47c18aae2d5ba2d3f65a`. The exact-commit Cloudflare Pages public interaction smoke passed, and the production host audit verified all 12 approved URLs as indexable on the owned domain while the Pages mirror remained HTTP `noindex`; QA/research routes remain excluded from the sitemap.
- Full type/math/build/static SEO/Chromium interaction/download/print/WebKit/iPhone touch and Android Chrome checks passed in the quality workflow.
- Mobile Lighthouse now covers **all 12 indexable URLs**, not just three samples. All 12 scored **100 Performance and 100 SEO**, with no weighted SEO audit failures. Lab LCP ranged **903–1,663 ms**, CLS was **0.000** on all 12, and TBT was **0–1 ms**. This is simulated mobile lab data; it is not field CrUX, field INP or real-user CWV.
- Evidence: [production build and host verification](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42459354647), [exact Cloudflare public interaction smoke](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42459354691), [12-URL mobile Lighthouse lab and artifact](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42459354705).
- Remaining evidence gaps are unchanged: Google Search Console property verification/submission and live query/impression/click/CTR/position data; exact US-localized SERP exports; fresh Semrush Volume/KD/CPC; field CWV; and the optional `www` DNS/redirect alias. No organic ranking or revenue claim is made.
