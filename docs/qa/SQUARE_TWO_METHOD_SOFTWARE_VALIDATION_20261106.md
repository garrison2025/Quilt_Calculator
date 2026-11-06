# Square-in-a-Square software verification — distinct on-point vs stitch-and-flip methods

**2026-11-06 | Status:** Both formula implementations are software-test candidates on the existing **noindex** `/lab/square-in-square/` experiment. Neither the old `HOLD-SQUARE` keyword, nor the new method-specific keyword variations, nor the original 218 historic US Semrush records have been promoted or modified. No purchased domain, no GSC indexing and no real sewn block measurements.

## Why these must NOT share one cut list

**A. One-round ON-POINT center with triangles** (existing):
- The visible center square is diagonal/on-point.
- To produce FINISHED outer block side B with ¼-inch seam, cut 1 center parent square of ceil⅛(B/√2 + ½) and 2 background parent squares of ceil⅛(B/2 + ⅞ + optional trim-margin).
- Each background parent square is cut diagonally **before sewing** to yield 4 separate triangles. One finished block requires 1+2 = 3 initial cloth squares, not 5.
- Sew corner triangles around the center. The margin changes the intended oversize cut and requires trimming, not a guaranteed sewn result.
- Confirmed independent tables: [QuiltBlockAtlas one-round chart](https://quiltblockatlas.com/blocks/square-in-a-square/), [QuiltCalcs one-round method](https://quiltcalcs.com/square-in-a-square-quilt-block/).

**B. STITCH-AND-FLIP / Quick-corners** (new):
- The single base square is upright, **not** initially turned on point. Cut 1 base square of ceil⅛(B + ½) and **4 intact** corner squares of ceil⅛(B/2 + ½), same fixed ¼-inch seam.
- Mark diagonals on the four small squares; sew to the four base corners, flip and trim as specified by the tutorial. **Do not pre-cut the small squares diagonally.** There are **no source-roll half-square triangles** at this stage.
- Exactly 1 + 4 = 5 initial cloth squares per block; both material rolls retain independent SKUs and exact parent-square coordinates.
- The optional on-point oversize-triangle side adjustment does NOT apply; passing any nonzero oversize parameter to this method throws a validation error. Changing the method in the UI resets that parameter to zero and disables it.
- Independent examples: [Generations Quilt Patterns' folded corners](https://www.generations-quilt-patterns.com/square-in-square-quilt-block.html), [Scissortail Quilting's quick-corner table](https://scissortailquilting.com/quilt-block-library/square-in-a-square/), [Quiltler's 8-in 1+4 example](https://quiltler.com/help/make-square-in-a-square).

For **B = 8 inches FINISHED**, these are different and equally method-specific:
- ON-POINT: 6¼-inch center parent ×1; 4⅞-inch background parent ×2; split each once => 4 triangles.
- STITCH-AND-FLIP: 8½-inch base ×1; 4½-inch intact corner squares ×4, sewn before cutting any excess.

For **B = 12 inches FINISHED**:
- ON-POINT: 9-inch center ×1; 6⅞-inch corners ×2 (pre-split).
- STITCH-AND-FLIP: 12½-inch base ×1; 6½-inch uncut corners ×4.

## Implementation and safety

- `src/lib/quilt/square-lab.ts` has **separate pure software engines**: `calculateSquareLab` and `calculateFoldedCornerSquareLab`, each with distinct results tagged by construction method. Both verify the separate fabric-roll rectangular source cut geometry before quoting source-rectangle run length and rounded source purchase, **not a promise about actual sewing yield**.
- UI method switch, on-point chart buttons and folded chart buttons reset stale export and user-entered measurements before recalculating. Downloaded CSV labels and filename identify selected method; the 2-vs-4 corner-parent counts are never silently conflated.
- `src/components/SquareAudit.astro` six-point manual test worksheet only makes sense for the ON-POINT center-diamond process. It is hidden under Stitch-and-Flip, with a visible explanation; **no artificial measured physical data** are supplied.
- All page scenarios remain noindex with no canonical, no sitemap entry, and no standalone Square keyword URL. The source historic `square in a square quilt block calculator` (US Volume 70, KD 6) is an *unverified search opportunity*, not evidence that a new indexed page will rank.
- The software-only test can PASS on 1–200 blocks, count/size/ruler rounding, separate source-roll fit, source-specific CSV and actual Chromium + simulated Safari/Android user flows. It does not certify seam placement, folded corners, pressing, fabric stretching or physical cutting.

## Bias Binding independent of Square

The continuous 45-degree bias source cutting method is STILL `HOLD-BIAS`: `√(binding length×strip width)` is an **ideal area lower bound only**, with no verified seam/tube yield. Do not reuse either Square engine for bias binding; neither guarantees effective bias strip length after spiral cutting. Bias purchase / keyword release requires separate method-specific yield model and independent mathematical fixtures. Software-scope approval never means invented fabric testing results.
