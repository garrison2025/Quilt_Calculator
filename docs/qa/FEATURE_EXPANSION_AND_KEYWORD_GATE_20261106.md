# Quilt Calculator — feature expansion and search-intent gate · 2026-11-06

**Scope:** improve the nine accepted, existing US-English calculator routes without pretending that an unaudited keyword warrants its own SEO page. This is new **software** work only. The preview remains `noindex` and production host/domain decisions remain separate.

## Implemented, engine-backed features

1. **Finished OUTSIDE size examples** on Project Planner, Backing, Binding, Borders, Batting and multi-SKU Fabric: Baby/crib 36×52, Throw 60×72, Twin 68×86, Queen 90×100, King 104×100 (inches). These are **editable illustrative presets, not universal US quilt or mattress standards**. Applying a preset sets the meaning to `includes-borders`, subtracts existing border layers for the derived center and resets prior top-cut review; material SKUs and counts are **not** fabricated or overwritten. If an existing border is too large, the preset is rejected without changing the project.
2. **Current usable WOF versus alternate backing WOF** on `/quilt-backing-calculator/`: reuse the same `calculateBacking` and `selectBackingOption` model, including grain restriction, owner-selected seam orientation, backing overage, shrinkage and purchase step. Show both panel counts, joins, buy yards and conditional `rounded purchase × user-entered USD/yd` totals. Alternate width and price are expressly **hypothetical read-only inputs**; they do not enter Project V2, shopping, printed plan, JSON or cut CSV. Missing prices do **not** imply an absolute winner; taxes/labor/shipping not included.
3. **Sashing grid → Project Planner CENTER** on `/quilt-sashing-calculator/`: reuse the already-built `calculateSashing` row/column/strip model, then apply its width/height as `before-borders` center. The project’s original borders still add outside, while existing fabric/color cut groups are unchanged and top-cut review is revoked. A block-grid sketch is not a complete quilt-top pattern.
4. **Crawlable explanations on existing pages**: a direct explanation of finished-size examples in the Planner, regular vs wide backing pricing on Backing, and a worked 4×5-grid → 58×46-in center on Sashing. The original 9 primary page titles/intent owners remain unchanged; no thin pages added.

## What current competitive pages actually show

Publicly accessible pages retrieved **2026-11-06** (not a US-localized complete Google Top-10 search result):

| Competitor page | Observed feature | What we implemented differently |
|---|---|---|
| https://thecraftmat.com/quilting/quilt-backing-calculator/ | Crib/Throw/Twin/Queen/King presets; cotton and 108-in wide-back controls | Versioned **shared multi-tool** quilt project, explicit finished-size basis and no lost top-fabric review |
| https://quiltingcalculator.com/ | Finished quilt size presets and separate 44/108-in backing chart | Both backing widths computed from actual entered **usable** WOF and same cut geometry, not a fixed chart |
| https://tools.tnaado.ca/calculators/general/quilt-backing-calculator/ | Vertical and horizontal seam yardages, one 108-in scenario | Current vs hypothetical compare including user-entered USD/yard material prices; separate exported source |
| https://www.sewingpath.com/blog/quilt-sizes-chart | Illustrative finished-size *ranges* varying by quilt type | Presets clearly labeled **nonstandard examples**, never mattress-fit or universal-size guarantees |

**Caveat:** these pages show features and user intent; they prove **neither traffic volume nor earnings** and do not justify exact new keyword counts.

## Keyword evidence and what remains unbuilt

- Source `docs/data/V2_Keyword_Appendix_218.csv`: historic US Semrush research **218 terms**, **202 historical route assignments**, **199 active mapped nonbrand**, **2 deprioritized**, **1 other-brand exclusion**, **16 HOLD**. Do not change those totals merely because a user interface enhancement is shipped.
- Further competitors to reverse-check **before** creating any new keyword landing URL: source pages for `quilt size calculator`, `half square triangle calculator`, `flying geese calculator`, `jelly roll calculator`, and the existing HOLD `quilt square size calculator` / `bias binding calculator`.
- **Missing commercial/SEO proof**: their independently measured, geo-specific (US) nonbrand **Volume, KD, CPC, ranking URL, search-feature / SERP intent, actual relevant competitors**, and validation dates. Do not invent values or claim a traffic/ranking win. The 16 source HOLD keywords remain HOLD; no bias/tape/square cutting math is elevated to supported production without a verified software model.
- The source `199` active mapping is a **keyword-to-intent worklist**, not the number of indexed or ranking terms. A single meaningful conversion tool already handles 107 related variations; no fractional clone pages.

## Acceptance and SEO launch checklist

- Test suite must verify size-basis integrity and no fabric cut/SKU mutations; the alternate backing comparison must be source-isolated, price-aware and grain-safe; sashing center transfer must preserve borders and revoke review.
- Browser test must verify all three controls with actual clicks, a downloaded current cut JSON free of hypothetical WOF, and shared JSON/localStorage continuity.
- Run `npm run lint`, `npm test`, `npm run build`, `node scripts/check-build.mjs` and Chromium/print/mobile browser regression on the exact PR head; verify Cloudflare main and public preview after merge.
- The `pages.dev` preview must **continue** to render `noindex,follow` without production canonical/sitemap. `PUBLIC_INDEXABLE` must not be enabled just for these features.
- **Before purchased domain approval:** validate true custom host and pages.dev **separately**, including HTTPS and host redirects, `X-Robots-Tag` / meta robots, canonical, sitemap, robots, path redirects, rendered structured data, real image paths, production asset loads, Lighthouse and security advisory audit. Do not infer pass from a local-only preview script.
- **After real indexing:** validate GSC queries × landing pages, nonbrand performance and newly collected actual US SERP; no GSC performance or AdSense revenue is pre-established.

**Milestone:** the software implementation is independently acceptable without a physical quilt sample. Real cloth calibration/print testing retains `MANUAL_NOT_RUN` but does not block the software stage.
