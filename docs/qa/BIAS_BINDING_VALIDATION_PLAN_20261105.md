# Continuous bias binding — V2 method validation and release gate

**Status: METHOD_RESEARCH_ONLY · NOT IMPLEMENTED · HOLD-BIAS · NOT_RELEASED (2026-11-05).**

This file is a new assessment alongside the original V2 product specification, not a modification of the original 218-keyword sheet, its 7 bias HOLD terms or historical testing status.

## 2026-11-06 software-only area-floor improvement (not a bias method release)

The accepted `/quilt-binding-calculator/` now includes an **opt-in, explicitly non-purchasing** square-root bias area LOWER BOUND, using its already validated current binding length and full **cut** strip width. The standalone pure function `calculateBiasAreaLowerBound` computes `area = L × stripWidth`, `idealSquareSide = √area` and a display-only ⅛-inch upward area-equivalent square, plus whether **even this ideal lower-bound side** fits the current usable WOF. It returns no actual yield, usable strip length, bias sewing layout, bias purchase yards, export JSON or cutting plan.

This does **not** complete the one-round/continuous-tube 45-degree construction research listed below, and **does not** turn any `HOLD-BIAS` keyword into a launched SEO page. The original 2026-11-05 `METHOD_RESEARCH_ONLY` status below remains true **for any usable or purchase-ready 45-degree bias method**. A mathematically sound lower bound must not be read as a sufficient purchase quantity.

Source confirmation (accessed 2026-11-06): [Schenectady Quilters' PDF, "Determining the amount of fabric"](https://quiltschenectady.org/Patterns/BordersNBindings.pdf) gives `√(required binding length × full width)` as an **area method**. [TNAADO's continuous-bias reference](https://tools.tnaado.ca/calculators/general/continuous-bias-binding-fabric-calculator/) implements a comparable square-root estimate, but neither that analogy nor optional estimated waste percentages prove exact real-world post-seam yield on the current fabric.

Acceptance: test source-isolation, monotonic theoretical area, failure for impossible WOF and lack of any `purchaseYards` / `verifiedYieldIn` / `cuttingPlan` contract. Confirm real browser disclosure, existing straight-grain cut CSV and noindex preview. **No physical sewn sample is required for acceptance of these limited software claims**; physical construction itself remains unverified.

## Why the existing straight-grain engine cannot be reused

The approved `calculateStraightBinding` layout cuts full-width rectangles across the usable WOF and subtracts measured strip-join loss. Bias strips are cut at approximately 45 degrees to fabric grain; continuous bias additionally folds, joins and helically cuts a reassembled panel. Neither strip dimensions nor purchased roll length can be determined safely by silently reusing the straight-grain cutting layout.

Published construction instructions for the *continuous-square method* describe: cut a square from straight-grain material, split it diagonally into two triangles, join the triangles at the short edges using a ¼-inch seam, mark parallel bias lines at the desired strip width, join the edges with an intentional one-line offset and then cut a spiral. Source: [American Patchwork & Quilting / AllPeopleQuilt — How to Make Continuous Bias Binding](https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-make-continuous-bias-binding), updated 2025-07-28.

A separate educational square-area shortcut exists: if desired binding length is `L` inches and cut strip width is `s` inches, `sqrt(L × s)` inches is an *ideal-area square side*, before any trimmings, sewing seams, strip-width discretization or edge losses. The geometric formula appears in [Quilt Schenectady's instructional PDF](https://quiltschenectady.org/Patterns/BordersNBindings.pdf) and [Geta's quilting continuous-bias reference](https://www.getasquiltingstudio.com/pdf/tutorials/continuous-bias-binding-cheat-sheet.pdf). **It is not an accepted prediction of post-seam usable length or a safe yardage-to-buy number.** Different published instructions use different allowance conventions; do not silently fix an arbitrary universal 3-in or 10% allowance.

## Scope contract for future implementation (not approved for production)

1. Declare exactly one construction method per result: `square-tube-continuous` or `individual-45deg-strips`; do not mix geometry or seam assumptions between methods.
2. Capture binding edge length (for rectangular quilts, `2×(finishedWidth+finishedHeight)`; for scalloped/curved edges, obtain measured actual edge length), tail allowance, cut strip width, postwash usable fabric width, assembly seam allowance, tube offset, and any directionality restriction.
3. Prove every parent fabric piece fits the input WOF and roll length. Generate a physically meaningful placement/cutting path and distinguish parent-piece layout from final diagonal spiral cutting geometry.
4. Compute verified **usable** binding length after joining, corner/trimming/tube losses and any specified end allowances. Show `requiredLength`, `verifiedYield`, `cutWidth`, `sourceSquare` and `actualRollRun` as separate fields. If the construction cannot prove yield, return `METHOD_NOT_VERIFIED`, not purchase-ready yards.
5. Apply optional length-shrinkage buying adjustment and ⅛-yard purchasing step **only after** feasible raw source-fabric roll consumption is computed. No artificial globally-optimal nesting claims.
6. Keep 45-degree geometry/joins separate from the straight-grain CSV contracts. A future downloadable bias cut-list must describe the actual source square, seam/cut directions, grain and final strip, not rectangle approximations dressed up as exact bias cut coordinates.
7. Hold SEO: no indexed bias landing page, no precise bias quotation in the existing binding page and no conversion of HOLD keywords into TARGET until the model and independent tests pass.

## Evidence needed before a public bias calculator exists

| Evidence class | Required check | Current state |
|---|---|---|
| Independent derivation | Diagrammed 45-degree strip and tube construction with tolerance treatment | NOT_RUN |
| Reference fixtures | Hand-audited examples for multiple WOF, strip widths, corner seam allowances and boundary values | NOT_RUN |
| Geometry properties | No overlaps, all parent fabric cuts inside width/run, monotone purchasing, no under-yield | NOT_RUN |
| Machine-executable differential | Compare exact engine geometry with reference fixtures and exported cut records | NOT_RUN |
| Real sewn sample | Cut a square, join the tube, slit it on 45 degrees, measure resulting strip and losses | NOT_RUN |
| Product UX | Explicit distinction from straight grain, safe rejection of impossible fits, accessible mobile controls | NOT_RUN |
| SEO eligibility | Source keyword routing, unique content and independent production QA | HOLD-BIAS |

**Decision:** Keep the existing verified straight-grain calculator unchanged. When real construction evidence is available, start with a noindex engineering experiment; do not expose an unproven shopping quantity. This is a technical research gate, not a promise of a finished new calculator.
