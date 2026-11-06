# SEO / GEO landing-page contract — US English

Source is the uploaded V2.0 build specification and its Appendix A keyword data, which is preserved in docs/data/V2_Keyword_Appendix_218.csv. The 218 records are a *candidate semantic pool*, not 218 independent pages, not guaranteed clicks, and not a cumulative traffic estimate.

| Intent | Route | Index condition |
|---|---|---|
| HUB / quilt calculator | /calculators/ | Project planner must calculate independent materials and share project state |
| BACK / quilt backing calculator | /quilt-backing-calculator/ | Panel orientation and full physical roll coordinates |
| BIND / quilt binding calculator | /quilt-binding-calculator/ | Straight-grain only; exclude bias terms from active SEO claims |
| BORDER / quilt border calculator | /quilt-border-calculator/ | Butted, side-first construction and actual cut pieces |
| YARD / fabric yardage calculator | /fabric-yardage-calculator/ | Actual rectangular layout rather than fabric-area shortcut |
| FABRIC / quilt fabric calculator | /quilt-fabric-calculator/ | Per-SKU cut lists and independent WOF |
| INCH / yards-to-inches | /fabric-yards-to-inches/ | One fraction converter for the full support cluster |
| BATT / quilt batting calculator | /quilt-batting-calculator/ | Single-piece roll fit |
| SASH / quilt sashing calculator | /quilt-sashing-calculator/ | Independent strips plus cornerstones |

HOLD: WOF width-equivalence converter, square-in-a-square, diagonal backing, rag quilt and generic block calculator have no indexable route. Additional HOLD-BIAS keywords in the V2 source must not be marketed as supported.

## Canonical and release safeguards

- Every approved route renders an HTML title, description, H1, independent explanation and a static image.
- Root / is brand/entry, /calculators/ owns the primary quilt calculator intent.
- Query parameters never create separate routes; there are no fraction clones.
- Preview and any pages.dev domain stay noindex.
- Do not set PUBLIC_INDEXABLE=1 until explicit production domain approval, mathematical gates, browser and physical-print QA.
- No fabricated ratings, reviews, paid products or claimed earnings.
- Appendix A does not include the original 300 competitor URL rows. These are not invented or represented as already migrated.


## Post-audit operational mapping (2026-11-05)

The original 218-row Semrush source CSV and its historical 202 approved-path mappings remain **unchanged**. A new [218-row operational worklist](data/V2_SEO_Operational_Keywords_218.csv) classifies 199 active non-brand intent mappings, **2 `REVIEW_US_SERP_INTENT`** (`how much is 1 yard` and `quilting calculator app`), **1 `EXCLUDE_OTHER_BRAND`** (`robert kaufman calculator`), and the 16 existing `HOLD_UNVALIDATED_METHOD` terms. Do not equate 202 route assignments with 202 suitable non-brand ranking targets.

Priority content now includes engine-calculated tables for backing (eight cases), straight-grain binding (six cases), and fabric-yardage WOF/rotation (five cases), plus a crawlable one-yard direct answer and 14-row fractions table. Each table clearly states sample cut dimensions and buying assumptions. No new indexed URL, untested sewing method, invented source metric, or new runtime API was introduced. Per-route social previews reuse first-party images. The preview remains noindex; production host separation and performance/field checks still require actual launch evidence.

## Updated operational decisions — 2026-11-06

- The two previously unresolved terms have been **conservatively deprioritized** using public-result examples rather than pretending to have an exact US-localized Top-10 Google SERP export: `how much is 1 yard` → `DEPRIORITIZE_AMBIGUOUS_LENGTH_PRICE` (price/linear-length ambiguity); `quilting calculator app` → `DEPRIORITIZE_NATIVE_APP_INTENT` (App Store / Google Play intent, while this site is a browser tool).
- They remain in the original provenance-preserving worklist, mapped historically to their preexisting URL, **but neither is an active SEO target**. Only `199` non-brand intent mappings are active. No other-brand, bias-binding, unverified square or WOF term is moved to active.
- Live, default bordered quilt-planner purchase text is now **engine-derived**, instead of duplicating an unrelated standalone 60 × 80 unbordered cutting example. This removes a source of confusion and allows static CI to check visible amounts against the actual V2 demo.
- Evidence and limits: [2026-11-06 public search-intent and example reconciliation](qa/SERP_INTENT_AND_EXAMPLE_PARITY_20261106.md). Full US-specific SERP export, live field Core Web Vitals and GSC ranking remain unverified. Official production domain not yet purchased; pages.dev remains noindex, without canonical or sitemap.
