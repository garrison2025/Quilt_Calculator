# Continuous Bias Binding — Inverse-Square Research Planner

**Date:** 2026-11-07
**Scope:** NOINDEX NUMERICAL RESEARCH / NOT PURCHASE READY
**Source:** V2 build specification, `docs/qa/CONTINUOUS_BIAS_TUBE_2D_DEVELOPMENT_20261106.md`, physical specimen protocol dated 2026-11-07.

## Why this is a separate lab

The existing `/quilt-binding-calculator/` is an approved **straight-grain** calculator. Its live purchasing math and cut lists are untouched. The continuous-bias-tube lab previously required a manually counted complete-band input. This separate page reverses that idealized geometry into a single square-width scenario. Inverting a mathematical model is not independent proof of real post-sewing usable length.

The new route is `/lab/continuous-bias-planner/`, forced to `noindex,follow` with no canonical or WebApplication JSON-LD, even if approved production pages are later allowed to index. All seven original HOLD-BIAS SEO keywords remain held.

## Input and explicit dimensions

| Input | Meaning |
|---|---|
| Quilt width and height | Finished outside rectangular quilt dimensions in inches |
| Total tail/joining allowance | Added exactly once, across the entire quilt perimeter |
| Extra margin percent | Applied to requested **target length only**, not to the source fabric or predicted yield; NOT a validated safety factor |
| W | Full **cut/unfolded** 45° strip width, not the double-fold finished width |
| a | Same measured perpendicular seam allowance on both independent seams; equal first-seam tip overhang is assumed |
| Usable WOF | Post-trim width AFTER prewashing, if any; do not shrink a second time |
| Prewash LENGTH shrinkage | Used only for converting one selected postwash source square into a hypothetical unwashed linear roll run |
| Retail step and USD per yard | Optional illustrated conversion and cost only, never a purchase instruction |

Rectangular straight quilt edge is `P=2(quiltWidth+quiltHeight)`. The length target is `T=(P+tail)*(1+marginPct/100)`; measured curved/scalloped quilt perimeters are not supported.

## Inverse numerical search

The standalone `calculateContinuousBiasPlan` pure function searches eighth-inch integer ticks, ascending from 6in to `min(96,usableWof)`. For each candidate source square side `S`:

```
post-first-seam face height = (S-a)/sqrt(2)
N = min(32, floor((S-a)/(sqrt(2)*W)))  // complete MODEL bands
Q = sqrt(2)*(S-3*a)
MODELED squared-end strip length = N*Q-W
```

Candidates must support at least two full modeled lanes and have positive modeled length. The first square meeting `MODELED length >= T` is returned; it is optimal **only on this discrete 1/8-inch grid under this exact modeled convention**. The cap at 32 full bands is a software model limit, not an achievable fabric fact; discarded transverse width is included in the area ledger.

The chosen candidate is independently re-evaluated by `calculateBiasTube2DDevelopment` with one-lane offset. Its two source-triangle polygons, both seam take-ups, entire tube seam matching, one-layer spiral developed bands, two terminal triangles and full source-square area closure are checked. A discrepancy fails closed.

If nothing meets the model target within WOF, return NO_MODEL_FIT and expose at most the **largest evaluated numerical scenario**, never a guess of what to purchase. If two modeled complete bands cannot exist, the result has no scenario and no downloadable numerical plan.

## Non-purchasing roll conversion

For ONE complete `S × S` postwash square taken from a bolt of usable width `F >= S`:

```
postwash bolt-run (in) = S
illustrative unwashed bolt-run (in) = S/(1-lengthShrinkPct/100)
illustrative unwashed run (yd) = previous/36
hypothetical retail-step converted yd = ceil(unwashedRunYd/step)*step
hypothetical subtotal USD = convertedYd*pricePerYard
```

These are **scenario conversions, not retail buying quantities**. The output does NOT include `purchaseYards`, `verifiedUsableLengthIn`, a trusted cutting plan, or a safety/physical-certification flag. Prewash width shrinkage cannot be inferred from length shrinkage; the user must supply a measured postwash usable WOF.

The geometry SVG depicts only the *initial source square on the usable bolt width* and its diagonal split, in a consistent inch-to-screen scale. It is not a 1:1 pattern, and it does not replace the separate sewn-face and unfolded spiral charts.

## Reproducible demonstration

For `quilt=60×80`, `tail=12`, `margin=0%`, `W=2.5`, `a=.25`, `WOF=43`, length shrinkage 0%, ⅛-yard retail step:

- Perimeter = 280in; numerical target = 292in.
- Area-only absolute square lower bound = `sqrt(292*2.5) ≈ 27.0185in` — not a usable source-square estimate.
- First eighth-inch model-fit source square = 28.625in, N=8 bands.
- Numerical squared-end length ≈312.870in. Its 20.870in modeled excess is NOT a measured safety margin.
- One postwash square requires modeled bolt run =28.625in; hypothetical raw run ≈0.7951yd; hypothetical ⅛-yd rounding =0.875yd.
- At $12/yd user-entered price, hypothetical material subtotal = $10.50.
- If length shrinkage is set to 10% but WOF remains already-postwash 43in, the square, N and modeled strip length do not change; unwashed run rises to ≈31.806in and the step-rounding rises to 1.000yd.
- Measured fabric length and true purchase requirements: **NOT VERIFIED**.

## QA gates

Unit tests verify exact sample, strict discrete minimum, monotonic target behavior, independent area/geometry reconciliation, WOF fail-closed, invalid inputs, first/second seam conventions, optional length-shrinkage isolation and forbidden purchasing contract fields.

The browser test uses 375px Chromium for the real input form, rendered geometric square diagram, calculation, 2D JSON export, input-stale revocation, length shrinkage, impossible WOF, invalid WOF and automated axe WCAG checks. Build guards require the noindex route, block canonical/JSON-LD, require truthful non-buying copy and cross-links, and continue to reject any public HOLD bias keyword landing page.

**Evidence status:** Software testing is tracked per exact branch and main SHA in GitHub Actions; do not mark the branch or live Cloudflare deploy PASS until its run is complete. Human screen-reader and physical fabric tests are NOT_RUN.

## Advancement gate

Before promoting this into a shopper-facing continuous-bias mode:
1. Record actual first/second seam allowances, tip overhangs and all line matches on multiple fabric specimens.
2. Independently record finished unstretched strip length after squaring and the actual full strip width along the spiral.
3. Demonstrate model does not overstate physical usable length, including boundary configurations and multiple operators; calibrate a defensible conservative margin if needed.
4. Confirm fabric bolt widths, width shrinkage, one-square source placement, directional restrictions and correct purchase rounding.
5. Re-run the full production binding arithmetic/export and browser suite, then explicitly approve indexable bias SEO pages separately.

Current release decision: **NOINDEX RESEARCH ONLY; buying, indexing and physical yield certification HOLD.**
