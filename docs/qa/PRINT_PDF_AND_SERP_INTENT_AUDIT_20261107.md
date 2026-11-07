# Quilt Studio · 2026-11-07 print-PDF and search-intent review

## Scope and evidence boundaries

Reviewed the current nine approved tool intents and their historic source keyword routing against accessible public competitor and publisher pages on **2026-11-07**. This is a **public-web search SAMPLE, not a geo-locked Google US Top-10, Ahrefs/Semrush live keyword refresh or ranking measurement**. Search result order, impressions, keyword Vol/KD/CPC and competitor revenue were **not established**. Do not alter historical volume, KD, the 218 original rows or the 199 active nonbrand / 2 deprioritized / 1 excluded brand / 16 HOLD decisions because of this sample.

The user approved improvements to the **existing** calculators and full printable cutting sheets, without a purchased domain or indexable production launch.

## Source → user question → our validated behavior

| Public source (sample, 2026-11-07) | What the source visibly presents | Our response and boundary |
|---|---|---|
| [AllPeopleQuilt — Plan Your Quilt Back and Determine Yardage](https://www.allpeoplequilt.com/how-to-quilt/finishing/plan-your-quilt-back-and-determine-yardage) | Backing seams may run horizontally or vertically; width and size influence which is advantageous | Our backing engine already verifies **both allowed orientations**. Added a clearly labeled independent editorial method reference. This publisher does **not** certify our engine or its examples. |
| [Fat Quarter Shop — Backing Reference Chart](https://www.fatquartershop.com/media/wysiwyg/pdf/QuiltBacking-Guide.pdf) | Published chart uses 42-inch-width material, explicitly recommends recalculation for 108-inch material, removes selvages and specifies method-specific overage/seams | Added explicit user-readable warning that **advertised 44 / 108 inches ≠ automatically usable WOF**; measure the actual usable width, do not hardcode their yardage or overage as universal. |
| [The Craft Mat — Quilt Backing Calculator](https://thecraftmat.com/quilting/quilt-backing-calculator/) | Common-size inputs, adjustable overage/selvage, both seam orientations, cut panels and 108-inch backing | Our current tool already has project size examples, overage/grain controls, physical cut coordinates and read-only alternate backing WOF. Added direct comparison instructions, avoiding extra thin URL. |
| [QuiltHelper — Backing Calculator](https://quilthelper.com/quilt-backing-calculator/) | Backing size examples, seam directions, wide-back choice, actual versus rounded purchase | Our guide now clarifies **narrow-vs-wide cost comparison is calculated with separately entered $/yd prices**, not inferred from fewer yards. |
| [QuiltingCalculator — project and binding tools](https://quiltingcalculator.com/) | Backing/binding/batting/border in a shared project, plus bias and miter variants | Existing Quilt Studio Project Planner is already shared. Their inclusion of bias/miter methods does not validate ours; current lab bias, diagonal backing, mitered borders and related original keywords stay **HOLD**. |
| [Pattern Tiler — How big is a yard?](https://patterntiler.com/guides/how-big-is-a-yard-of-fabric) | 36-inch fixed linear length and width varying by fabric | Our converter already answers this in crawlable HTML plus 14 rows; no new cloned quarter-yard pages required. |

## Implemented on existing landing pages

1. `/quilt-backing-calculator/`: visible crawlable explanation of postwash **usable WOF** versus advertised bolt width; a realistic but **non-universal** 44-inch → 42-inch illustrative trim scenario; explicit comparison of narrow/wide backing material costs, using separately user-entered prices. Adds two relevant, accurately limited FAQ answers. Source-backed editorial context links out; never equates external publisher's numbers with the tested engine.
2. `/quilt-fabric-calculator/`: the printable user workflow now distinguishes a **45-row paged on-screen cut table**, a **short schematic in-page print**, the **complete offline HTML cut sheets**, and the **whole-project review gate** (which is stricter than the separate fabric-only tool). Adds exact FAQ.
3. `/calculators/` Project Planner: describes complete per-roll offline HTML print sheets instead of suggesting the shorter built-in Print view is complete.
4. No new URLs, false buyer readiness, fake real-user metrics, fake author or unsupported sewing functionality; no change in keyword routing or indexability.

## Full printable HTML → real PDF acceptance (new CI)

Existing PR #41 verified 2,000 real HTML rows by DOM parsing but **did not paginate them to a generated PDF**. The new quality gate adds Chromium PDF generation from the exact **downloaded HTML** in an **offline** browser context, then checks its actual PDF bytes with poppler tools (`pdfinfo`, `pdftotext`, `pdftoppm`).

The gate validates US Letter landscape paper, page count, repeated table headers, an original project fingerprint, **all 2,000 unique labels from 30 separate physical rolls** in printed PDF text, no repeated/dropped pieces, no remote resources and a rendered middle-page PNG. The browser's on-screen 45-row limit and 180-piece SVG illustration limit remain independent of full CSV/HTML/PDF. The emitted PDF and PNG are CI QA artifacts, not new runtime downloads or claimed printer-scale calibration.

**Do not mark the above PASS until the exact branch and main runs finish green.** A generated PDF cannot certify actual paper size or real textile cutting. See `docs/qa/PRINT_SCALE_PHYSICAL_SIGNOFF.md` for manual signoff.

## Still open before a search launch

- Buy and approve a real domain. Verify **both** production host and `pages.dev` live robots, X-Robots-Tag, canonical, redirect, sitemap and HEAD/GET/HTTP behavior; run approved-domain dual-host preflight. Never flip the preview to `index` now.
- Real US location-targeted SERP evidence, current Semrush volume/KD/CPC and full competitor keyword export remain unavailable. The historical 218-row worklist is unchanged; 199 active is **intent allocation, not rankings**.
- Physical paper, fabric and human screen-reader/400% zoom checks remain manual; GSC, field Core Web Vitals, indexed search impressions/clicks and AdSense conversion do not exist yet.
