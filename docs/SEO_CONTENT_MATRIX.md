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
