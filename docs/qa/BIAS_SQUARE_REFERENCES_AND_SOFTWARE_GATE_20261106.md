# Square-in-a-Square reference chart and safe bias area preview — 2026-11-06

**Engineering aim:** Expand *working calculations* grounded in actual quilting references before launching any more keyword URLs. This change does not require fabricated physical measurements, independent production certification, or a purchased domain.

## Square-in-a-Square one-round calculation

Existing /lab/square-in-square/ remains intentionally **noindex** and clearly provisional as a sewn-fabric construction. The implemented software model uses an ON-POINT center square plus FOUR corner half-square triangles cut from exactly TWO corner parent squares. One round only, NOT stitch-and-flip and NOT the two-round economy block. Fixed ¼-in seam and ⅛-in upward cutting ruler grid.

For finished outside size B:

- Center parent square CUT side = ceil-to-⅛ (B / √2 + ½ in).
- Each of TWO corner parent square CUT sides = ceil-to-⅛ (B/2 + ⅞ in + user-selected oversize).
- Split each corner parent square along a diagonal **once**: exactly four triangles per block.
- Expected unfinished outside side = B + ½ in, checked from user-reported ruler readings if provided, not assumed to be physically produced.

The new visible 6-row chart uses **zero** extra corner-square trim allowance, so it agrees with independently published examples and does not silently substitute the default oversize trial margin:

| Finished B (in) | Center parent square (in) | 2× corner parent squares (in) | Target unfinished (in) |
|---:|---:|---:|---:|
| 4 | 3⅜ | 2⅞ | 4½ |
| 6 | 4¾ | 3⅞ | 6½ |
| 8 | 6¼ | 4⅞ | 8½ |
| 10 | 7⅝ | 5⅞ | 10½ |
| 12 | 9 | 6⅞ | 12½ |
| 16 | 11⅞ | 8⅞ | 16½ |

Sources, observed 2026-11-06: [QuiltBlockAtlas — chart of square-in-a-square cutting sizes](https://quiltblockatlas.com/blocks/square-in-a-square/), [QuiltCalcs — one-round 1/√2 and B/2+7/8 method](https://quiltcalcs.com/square-in-a-square-quilt-block/), [Quiltler Help — distinct stitch-and-flip variation](https://quiltler.com/help/make-square-in-a-square). The last shows **a different method using four corner squares**, not an interchangeable formula. Do not claim the different method's results are equivalent.

Chart buttons explicitly set finished B and reset the *extra* corner margin to **zero** before recalculating. The cutting CSV continues to list only physically placed **parent squares** and two independent usable fabric rolls; no false separate original-roll rectangles are emitted for the four post-split triangles.

**Boundary:** Published dimensional parity validates the **software calculation model**; it does not independently prove that manually sewn bias edges, point clearances or trimming match the theoretical result. That physical gate remains `MANUAL_NOT_RUN` without blocking the owner's accepted software-scope milestone.

## Bias true-45-degree area lower bound

In the existing straight-grain `/quilt-binding-calculator/`, an optional collapsed disclosure computes **lossless area only** from length including tail allowance and **full cut strip width**, then shows area, ideal square-equivalent side and ⅛-in upward *lower-bound ruler equivalent*:

- At a separate unbordered 60 × 80 in outside quilt, 12 in tail, 2½ in cut width: length 292 in, ideal area **730 in²**, ideal side **√730≈27.0185 in**, ⅛-in floor **27⅛ in**.
- The default full project has a 60 × 80 in CENTER plus a 3-in finished border per side → 66 × 86 in OUTSIDE. Its binding required length is **316 in**, ideal area **790 in²**, rounded lower-bound equivalent **28⅛ in**.
- Actual continuous bias spiral/tube construction, diagonal joins, seam loss, cutting offsets and trimming are **NOT modeled**. These values can **never be read as adequate starting-square cuts, verified usable yield, a safe amount to buy, shopping cart price or real bias cutting CSV**.
- The optional disclosure does not modify the V2 saved project, purchase quantities, printable plans, source cut geometry or source JSON.

Reference: [Schenectady Quilters — Borders and Bindings, p.6](https://quiltschenectady.org/Patterns/BordersNBindings.pdf). The existing `docs/qa/BIAS_BINDING_VALIDATION_PLAN_20261105.md` retains the full geometry/yield HOLD scope.

## SEO decisions and pending validation

- The original **218-row historic US Semrush input is unchanged**: **199 active mapped nonbrand**, 2 deprioritized, one competitor brand excluded, 16 method HOLD. No volume, CPC, KD or new ranking claim was invented.
- `square in a square quilt block calculator` historical **US Volume 70 / KD 6** remains HOLD; the reference chart enriches a **noindexed** lab but does **not** create `/square-in-a-square-calculator/`.
- `bias binding calculator` historical **US Volume 590 / KD 15**, plus related bias variants, remain HOLD. Only a transparent educational area preview is added to the existing Binding intent; it is not a fully functional bias yardage calculator.
- To promote either topic as an indexable standalone URL, independently verify US intent/SERP competitors, current nonbrand keyword metrics, algorithm-specific acceptance, and useful differentiated complete user outcomes; do not duplicate a content-only keyword landing page.
- The Cloudflare `pages.dev` preview retains **noindex**, no production canonical and no production sitemap until owned domain/explicit launch authorization.

## CI gates

Required: static build + noindex/SEO-HOLD tests, 6 published parent square fixtures, one-way grain and source isolation for current straight-grain binding, bias bound unit/property tests, real browser taps on chart and disclosure, no false CSV output, 375px keyboard accessibility and WebKit/Android emulation. CI is engineering evidence, not physical fabric certification.
