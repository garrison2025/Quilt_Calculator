# Individual 45° Bias Strips — exact geometry software gate (2026-11-06)

**Scope:** one explicit *individual 45° strip* construction from a straight-grain square, cut into **FULL-WIDTH, SQUARE-ENDED bias rectangles**, joined with simple **CROSSWISE ¼-inch seams** or another explicitly entered straight crosswise seam allowance. This is **NOT continuous bias from an offset tube**, and is **NOT the common diagonal/end-to-end bias-strip joining method**. These constructions have different loss formulas.

**Release status:** accepted code is **noindex research lab**, not an additional public ranking URL. `HOLD-BIAS` remains HOLD, and the site’s existing `/quilt-binding-calculator/` shopping/cutting/export model stays 100% straight-grain. The existing 218 Semrush keyword observations are not changed. No independent physical seam, cloth, or printed-scale test is asserted.

## Independent construction evidence

- [APQS, *A Guide to Bias Binding*](https://www.apqs.com/a-guide-to-bias-binding/) explicitly separates **Method 1: Cut individual bias strips** from **Method 2: Bias tube**, and explains cutting at 45° and joining separate lengths. This establishes a viable *method category* but NOT the site-specific conservative rectangular nesting yield.
- [American Patchwork & Quilting, *How to Make Bias Binding*](https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-cut-bias-binding-step-step-guide) documents diagonal individual strips from a 45° cut, then seaming them into one long binding.
- [Sewing & Craft Alliance, *Making Bias and Bias Binding*](https://www.sewing.org/files/guidelines/9_230_making_bias_and_bias_binding.pdf), p.2: says diagonal strip joins are flatter and generally preferred, while a plain crosswise join is possible but bulkier. The model **deliberately chooses the simple CROSSWISE join** because its effective length is exactly the sum of raw rectangular lengths less two chosen end allowances per join. Do NOT use its result for the more common diagonal-join style.
- [APQS, *Bias Binding Chart*](https://www.apqs.com/wp-content/uploads/2021/02/21_APQS_0171_BiasBindingChart_020221.pdf) provides external *rule-of-thumb* square sizes, not an independent proof that our geometric method gives the same yield. We do not fit the algorithm to this retail chart.

These references **do not** validate actual precision of 45° cuts, fabric stretch, sewing, shrinkage, or how much an offset tubular spiral produces; the latter remains `METHOD_RESEARCH_ONLY`.

## Exact mathematical construction

Assume a source square `0≤x≤S`, `0≤y≤S`, x/y along straight grain. Rotate coordinates:

```
u = (x+y) / sqrt(2)     [strip length direction, +45°]
v = (y-x) / sqrt(2)     [strip transverse direction, -45°]
x = (u-v) / sqrt(2)
y = (u+v) / sqrt(2)
```

The source square is equivalent to `|v| ≤ u ≤ sqrt(2)×S−|v|`. For each nonoverlapping, full-cut-width band of width `W`, `v0=(k−½)W` to `v1=(k+½)W` for integer `k`, set `M=max(|v0|,|v1|)`. The *entire inscribed rotated rectangle* from `u=M` to `u=√2×S−M` is inside the source square, with exact **full-width** strip length `Lk=√2×S−2M`. Its four source vertices, transformed with the inverse equations, are exported individually in the CSV.

The algorithm drops corner slivers which cannot form a full-width rectangle and also drops very short pieces with `Lk≤2a`, where `a` is the declared crosswise seam allowance at each joined end. It creates all the remaining disjoint centered bias bands; the construction is **fixed and deterministic, not an optimal nesting algorithm**. Every result is audited independently for vertex containment, exact rectangle dimensions, disjoint `v` intervals, summed area, and honest totals.

Raw full-width strip length `Lraw=∑Lk` comes from **actual source-square polygons** (within floating-point tolerance). The **conditional** crosswise-joined length is `Lcrosswise=Lraw−2a(N−1)` for N strips and a plain square-ended end-to-end seam. One seam is not added at either external free end; the user-entered required binding length must already include any tail allowance. This number is a **software-modeled length conditional on that join style**, not a physically measured guarantee.

For a stated required length `T`, `findSmallestIndividualBiasSquare` visits source squares on a ⅛-inch ruler grid, starting at the ideal area-only lower bound `√(T×W)` and progressing to `min(96,post-trim usable WOF)`. The *first* candidate satisfying the selected modeled construction is reported; this **is not the global minimum** for all alternative cutting layouts. If none fits, state **NO GEOMETRIC MATCH**, not an arbitrary extra percentage or fabricated store yardage.

## Independent software fixture

| Input or result | Tested value |
|---|---:|
| Source straight-grain square | 30 × 30 in |
| Post-trim usable WOF | 43 in |
| Full cut width | 2.5 in |
| Plain crosswise seam allowance at EACH end | 0.25 in |
| Required length | 316 in including user's final tail |
| Full-width, 45° rectangular strips | 15 |
| Calculated individual crosswise joins | 14 |
| Sum of exact unjoined full-width strips | 318.8961030679 in |
| Total two-ended join take-up | 7.0 in |
| Conditional crosswise-joined length | 311.8961030679 in |
| Target 316 in met by the 30-in square? | **NO** |
| First exact ⅛-in source-square candidate meeting 316-in target | **30¼ in** |
| Its conditional modeled joined length | 317.1994039268 in |
| The loss-free area-only square `√(316×2.5)` | ≈28.107 in; **NOT SUFFICIENT evidence of full-width individual joined strips** |

**Important:** an alternative seam geometry (diagonal joins), narrower usable WOF, different cut-width, fabric directional pattern or shrinkage changes the result. These calculations establish only the full-width 45° source rectangles plus the specified simple crosswise seam loss, **not physical construction approval**.

## Tests and release boundaries

- `tests/individual-bias-geometry.test.ts` — numerical fixtures, 1/8-in candidate search, different WOF limits, source-polygon containment and area, no-overlap bands, mutations of falsified vertices/outputs, monotone lengths, seam sensitivity, impossible inputs.
- `scripts/browser-smoke.mjs` — actual noindex lab route at 375px, source polygon SVG, 15-row source-coordinate CSV, *30→30¼* threshold, invalid-WOF refusal, stale-download guard and automated WCAG rules.
- `scripts/check-build.mjs` — lab must have noindex/no canonical/no app JSON-LD, an approved Binding page link, the method-specific explanatory text, preserved HOLD routes and unique H1/title.
- Existing `src/lib/quilt/bias-area-bound.ts` continues to expose **lossless area lower bound only**, not claimed tube yield or purchase. No shopping/physical cut files from the approved main Binding calculator are modified by this experiment.

**What still needs work:** verify exact *offset tube* seam alignment, number of passes, physical seam take-up and diagonally joined strip losses independently, implement an explicit method-specific lab, and only then evaluate SEO promotion with US-localized Volume/KD/CPC and SERP intent evidence. A full production Bias Binding calculator is **not** claimed complete in this milestone.
