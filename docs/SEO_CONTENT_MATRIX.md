# Quilt Studio — source-keyword and published-content matrix
2026-11-04 · Source: `docs/data/V2_Keyword_Appendix_218.csv` (the original supplied Semrush snapshot).
Numbers are **historical research inputs**, not current ranking, guaranteed traffic, revenue, or real-time keyword metrics.

| Intent and canonical path | V2 mapped terms | Main query from original source | Source US monthly volume / KD | Dedicated server-rendered content |
|---|---:|---|---|---|
| `/calculators/` | 7 | quilt calculator | 1,600 / 18 | Independently measured materials, SKU separation, purchase rounding and construction limits |
| `/quilt-backing-calculator/` | 28 | quilt backing calculator | 2,400 / 0 | Sewn panel counts, 60×80 example, 43/108 usable WOF, joining constraints |
| `/quilt-binding-calculator/` | 17 | quilt binding calculator | 1,900 / 15 | 292-in perimeter-plus-tail example, 8 strips, straight-grain scope |
| `/quilt-border-calculator/` | 10 | quilt border calculator | 720 / 7 | Side-first butted borders, sewing allowance and layer expansion |
| `/fabric-yardage-calculator/` | 14 | fabric yardage calculator | 1,300 / 26 | 20 rectangles, 43-in WOF, allowed rotation, cut vs finished dimensions |
| `/quilt-fabric-calculator/` | 14 | quilt fabric calculator | 880 / 19 | Two-SKU model, independently rounded purchases, physical cut CSV |
| `/fabric-yards-to-inches/` | 107 | how big is a yard of fabric | 3,600 / 18 | 14-row exact length chart incl. thirds, yards as length vs WOF width, area-equivalence cautions |
| `/quilt-batting-calculator/` | 2 | quilt batting calculator | See original CSV | 68×88 single-piece fit vs too-narrow rolls |
| `/quilt-sashing-calculator/` | 3 | quilt sashing calculator | See original CSV | 4×5 grid, 16/15/12 counts, cornerstones and cut dimensions |
| **Total published intent mappings** | **202** | | | **9 distinct tool pages** |

## Source HOLD decisions — 16 terms
- **7 bias-binding terms** — original `HOLD-BIAS`; straight-grain binding is not equivalent to bias binding.
- **5 fabric-width/yardage-conversion terms** — original `CONDITIONAL` but `HOLD_NO_INDEX`; a physical-fit-aware WOF model is not released.
- **4 quilt square/Square-in-a-Square terms** — original `TARGET` but `HOLD_NO_INDEX`; the source research classification does not authorize publishing an unverified square construction.

Do not create a separate doorway page for each fraction. The 107 related conversion variants have a shared intent and one substantive answer page.

## Release and evidence rules
- Mapping is not proof that the keyword appears literally on a page, has a suitable SERP, ranks, or generates clicks. The new guides deliberately address *concepts* instead of repeating source keyword variations.
- Preserve the source dataset unchanged. Update only after an evidence-backed keyword review, never silently change the original Semrush volume/KD.
- Static checks: `npm run build && node scripts/check-build.mjs`; mathematical checks: `npm test`; Chromium smoke checks through GitHub Actions.
- Production domain and Google indexing remain unapproved. The `.pages.dev` deployment must stay `noindex,follow`, without production canonical/sitemap.
- Further work: real-world cutting certification, original 39 golden CSV/24-property/47-gate source files, live SERP audits and full keyboard/screen-reader review.

- All nine tool page H1 headings now state their primary distinct calculator intent, rather than relying on generic promotional slogans. This is a clarity improvement; it is not proof of any SERP position.


## SEO implementation update — 2026-11-05

- **Preserved provenance:** `218` original US Semrush rows, `202` historical page mappings, `16` HOLD, `9` distinct tool intents. The original CSV was not rewritten.
- **Operational targeting:** `199` mapped non-brand active; `2` ambiguous US SERP intents for review; `1` competing-brand search intent excluded; `16` HOLD. [Full 218-row operational CSV](data/V2_SEO_Operational_Keywords_218.csv).
- **Search-intent depth:** Backing has eight engine-computed 43/108-in WOF examples; straight binding has six strip-width examples; yardage has five real cut-piece/WOF/rotation examples. Assumptions, nonoptimality and no real-fabric sign-off are disclosed.
- **Quick answer:** The existing `/fabric-yards-to-inches/` renders `1 yd = 36 in` plus concrete quarter/half/1.5/4-yard conversions before the calculator, still sharing one page across its 107 conversions.
- **Media/navigation:** real matching page-level `og:image`/`twitter:image` and more specific contextual link labels; no artificial extra pages or fake author/date tags.
- **Evidence:** Dedicated [4-case SEO-reference regression](../tests/seo-reference.test.ts), full static source and social-image checks, mobile Chromium QA, independent [Lighthouse lab workflow](../.github/workflows/lighthouse.yml). Lab is not CrUX/field INP and indexed rankings are still unknown.

## Search-intent / live-demo correction — 2026-11-06

- Public web-result samples show `quilting calculator app` contains native iOS/Android app intent. This site is **browser-only**, not a native store download. Status: `DEPRIORITIZE_NATIVE_APP_INTENT`; original keyword source route and numeric values are preserved but it is not one of the 199 active targets.
- `how much is 1 yard` mixes linear dimensions and a potential per-yard price question. This site supplies exact **36-in length** and fabric-width context, **not** a live retailer quote. Status: `DEPRIORITIZE_AMBIGUOUS_LENGTH_PRICE`; keep one length-conversion page rather than a thin doorway page.
- These decisions reflect publicly retrieved examples on 2026-11-06, **not** a complete US-localized Google Top-10 SERP export. Evidence URLs and the actual scope of verification: [SERP intent and worked-example audit](qa/SERP_INTENT_AND_EXAMPLE_PARITY_20261106.md). Both can be reconsidered with independently reproduced regional search results.
- The shared live Project Planner example is 60 × 80 **center** + 3-in border per edge = 66 × 86 **outside**, producing 74 × 94 backing at 4-in overage, and **5¼ yd** for the auto-selected vertical seam using 43-in WOF. The obsolete **5 yd** public HUB sample referred to an unrelated unbordered quilt and has been replaced by an engine-derived sample string. Independent unbordered examples on individual tool pages are now labeled accordingly.
- **Counts unchanged:** 218 historical records; 202 previously attributed to existing landing pages; 199 active nonbrand; 2 explicitly deprioritized pending regional SERP export; 1 brand exclusion; 16 unsupported-method HOLD. There are still 9 primary tools, not 199 new URLs. Preview stays noindex.


## Search-intent refinement — 2026-11-08

- Public search samples identified `border fabrics for quilting` (historical US Volume 590 / KD 8) as fabric-shopping/product-listing intent rather than a calculator task. Its original source row, values, TARGET label and historical route attribution remain unchanged; only the derived operational status is now `DEPRIORITIZE_PRODUCT_INTENT`.
- Current operational counts: 218 original rows; 202 historical route assignments; **198 active non-brand intents; 3 deprioritized; 1 other-brand exclusion; 16 unsupported-method HOLD**. Do not present these as rankings, current keyword metrics or expected traffic.
- Public competitor review clarified scope boundaries: straight-grain binding only; butted borders only; batting roll single-piece fit only; sashing with internal cornerstones only; repeated-rectangle yardage without automatic motif-repeat matching; multiple rectangles/SKUs on the separate Quilt Fabric page.
- Titles/H1/FAQs were refined to match those implemented boundaries and put the high-volume `how big is a yard of fabric` query first on the existing conversion URL. No new URL or algorithm was added.
- Evidence and limitations: [2026-11-08 content and SERP audit](qa/CONTENT_SERP_AUDIT_20261108.md). This remains a public-web sample, not a US-localized Google Top-10 or fresh Semrush export. GSC remains deferred.

- Added an engine-derived 68 × 86 in illustrative twin-size binding reference (8 strips and ⅝ yd under disclosed assumptions) for the existing 70-volume / KD 14 long-tail query; the copy explicitly says this is not a universal twin standard.

- Existing long-tail intent `how much fabric for a queen size quilt` (historical US snapshot 110 / KD 2) now has a reproducible 90 × 90 in two-SKU quilt-top example. Each 72-piece 8 × 8 in SKU uses 3⅜ yd at 43 in usable WOF; 6¾ yd total covers the top only. The example is explicitly pattern-specific, not a universal queen-size estimate. See [2026-11-08 content/SERP audit](qa/CONTENT_SERP_AUDIT_20261108.md).
