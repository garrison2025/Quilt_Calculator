# Reverse block-size planning on existing Quilt Sashing route — 2026-11-06

## Scope and source evidence

The source keyword `quilt square size calculator` has historical **US monthly Volume 210, KD 9** in the user-supplied `docs/data/V2_SEO_Operational_Keywords_218.csv`. It is **currently HOLD_UNVALIDATED_METHOD**. Those historical metrics are not live Google Search Console results, nor evidence of November 2026 traffic.

Contemporary public competing workflows found (feature evidence, **not** revenue or accurate US localized SERP Top-10 rank):

- https://hemandthimble.com/quilt-block-size-calculator/ starts with target finished quilt dimensions and derives block size from row/column counts, sashing and borders.
- https://quiltcalcs.com/quilt-size-calculator/ goes forward from finished block dimensions, count, sashing and borders, and separately links reverse planning.
- https://getsashing.com/guides/how-to-calculate-sashing-and-cornerstones/ documents straight-set, **internal sashing** math and warns that an outside sashing frame changes the equation.

Retrieved 2026-11-06. These competitor sites show users genuinely ask for a reverse planning workflow. **No new indexing route is created:** `/quilt-sashing-calculator/` already owns block-grid and sashing content. A separate `/quilt-square-size-calculator/` is **not** authorized merely by this implementation. HOLD remains until the exact query's US localized intent, competing ranking URLs and nonbrand Volume/KD/CPC are verified.

## Implemented formula and data contracts

Let `R` be finished-block rows and `C` finished-block columns; `S` is the **finished internal** sash width (in inches); `W,H` are the **finished quilt CENTER before any borders**.

```
finished block width  = (W - (C - 1) * S) / C
finished block height = (H - (R - 1) * S) / R
```

For `R=4`, `C=5`, `S=2`, `W=60`, `H=80`, results are **10.4 × 18.5 in FINISHED block sizes**, not cut sizes. The existing forward `calculateSashing` engine returns the exact `60 × 80 in` center, with **existing 3-in border** (if configured) adding to **66 × 86 in outside**. Seam/cutting allowances on sashing pieces are handled separately by that same forward engine; no extra allowance is silently added to finished blocks.

Data scope: straight-set rectangles with internal sashing and cornerstones **only**, no outside sash frame, on-point/angled blocks, ornamental joins, seam shrinkage, or inferred colored-fabric cut list. A sashing grid may be rectangular; it is not necessarily a grid of squares. The model refuses zero/nonfinite target sizes, counts out of range, and targets consumed by the sashing gaps. The applied block measurements are validated as real Project V2 fields without rounding; displayed decimals are informational. Unsupported material fit also blocks the UI Apply action.

The screen presents an explicit **two-step choice**:

1. **Reverse block planning** updates only the Sashing `finished blockWidth / blockHeight`, preserving quilt center/outside, border layers, roll SKUs, cut piece quantities, previous purchase settings and manual fabric data. Any earlier quilt-top cut-list review is revoked. Previewing target dimensions alone makes no changes to V2 exports.
2. **Use this sashing grid as quilt CENTER** (existing separate action) optionally updates the quilt's dimension basis and center after the finished-grid calculation. It does not manufacture a new pattern or certify physical fabric.

No local service, user account, external API or new SEO URL.

## Acceptance tests

The PR must run TS lint; 22+ test files with reverse solver and forward/reverse parity; static site SEO/sitemap/noindex gates; end-to-end Chromium scenario with invalid target and downloaded JSON source isolation; WebKit/Chromium mobile touch and WCAG checks. CI verifies mathematics **only**, not physical seams or ruler calibration. Physical state stays `MANUAL_NOT_RUN`, not a blocker to software acceptance.

Production release remains **NOINDEX PREVIEW** at `https://quilt-calculator-566.pages.dev/` until a custom domain and explicit indexing consent are available. The original 218-row source file is immutable and no automatic keyword promotion is claimed.
