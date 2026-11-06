# Continuous Bias Tube — 2D sewing-line development and squared ends
Date: 2026-11-06 | Status: **SOFTWARE / NUMERICAL GEOMETRY MODEL; PHYSICAL CUTTING NOT VERIFIED**

This document extends `CONTINUOUS_BIAS_TUBE_TOPOLOGY_20261106.md`. The topology checker remains intact. The 2D model is **not** a live buying calculator and does not remove any HOLD-BIAS keyword restrictions.

## Sources, construction and explicit assumptions
The sewing sequence (square, two triangles, sew short legs into parallelogram, mark bias lines, one-lane shift at the **sewing line**, close tube and cut a ONE-layer spiral) follows [American Patchwork & Quilting](https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-make-continuous-bias-binding) and the [American Sewing Guild](https://www.asg.org/on-a-roll-diy-continuous-bias/). Neither article proves the length of a fabricated strip from arbitrary dimensions; the formulas below are our **stated idealized geometric convention**, not quotations from those sources.

Assumptions to validate against cloth:
1. A source square side `S` has already been measured after any prewash and selvage removal. `S<=usableWofIn`, and both source triangles are exact 45° right isosceles triangles. No pattern direction change is promised.
2. The first assembly seam allowance and second tube seam allowance are the SAME perpendicular measurement `a` from each relevant raw edge (as in the original lab). The model does **not** silently treat `a` as a horizontal or vertical allowance.
3. Two triangle pieces are aligned **on the stitching line**. The sewn face excludes seam allowances folded to the reverse. Triangle faces rotate rigidly and translate; no mechanical fabric stretch, ease, wrinkling, needle curvature or overcasting width is modeled.
4. The sewn tube seam lines are paired with one full-width-strip offset; a right cut mark at `v=jW` corresponds to left mark `v=(j+1)W`. Zero or two-lane offsets are rejected.
5. Keep only `N` full width-`W` bands that fit the usable sewn face. Any leftover transverse sliver is deliberately discarded; two diagonally ended tails are squared off perpendicular to the final strip. No salvage, backstitch consumption or stretched-length gain is credited.
6. The unfolded coordinates are a 2D **mathematical development** of the sewn face, not an A4 printable pattern, proof of sewn-cloth dimensions, or an instruction to pre-cut every triangle fragment.

## Coordinate contract

Let `H=S/sqrt(2)`, `L=S*sqrt(2)=2H`, `d=a*sqrt(2)`, `V=H-d`, `Q=L-2d`. The ideal pre-assembly parallelogram has vertices `(0,0),(L,0),(L+H,H),(H,H)` and area `S²`. The first seam line runs `x+y=L-d` across the sewn face, joining bottom at `(L-d,0)` to top at `(H,V)`. Its two triangle faces are identified on this stitching line (the upper triangle is translated by `(-d,-d)` from pre-sewing placement). This reduces the full transverse height to `V`.

The second tube stitching lines are `x-y=d` (left) and `x-y=L-d` (right). Each loses a perpendicular allowance of `a`; the full band-run span after both edges is `Q`. The resulting sewn-face 2D parallelogram is
```
v=y in [0,V], u=x-y in [d,L-d]
(x,y) = (u+v,v)
```
For band `i=0,...,N-1`, `v0=iW`, `v1=(i+1)W`, the four sewn-face vertices are `(d+v0,v0),(L-d+v0,v0),(L-d+v1,v1),(d+v1,v1)`. Every marked boundary `j` is the 3-point polyline left `(d+jW,jW)` → first seam `(L-d-jW,jW)` → right `(L-d+jW,jW)`. The offset tube stitch identifies the right point at `jW` with the left point at `(j+1)W` for `1<=j<N`. They are *not* the same point before sewing.

The original source-square triangle coordinates in JSON are the inverse rigid rotations of each polygon clipped by the first seam `x+y=L-d`. For the lower-right source triangle, `(X,Y)=((x+y)/sqrt(2),(x-y)/sqrt(2))`. For the upper-left triangle, replace `x,y` with `x-(H-d),y-(H-d)` before applying the same inverse. Test assertions require `0<=X,Y<=S` and correct original triangle membership. These mappings are for **provenance and area audit**, not a pre-seam cutting order.

## Unfolded 2D strip and end squaring
For each band `i`, the developed panel has vertices
```
(iQ,0), ((i+1)Q,0), ((i+1)Q+W,W), (iQ+W,W).
```
Their diagonal edges meet exactly with no overlap after gluing each one-offset seam. The developed union has model centerline span `NQ`, but slanted ends cannot supply a full width W everywhere. Perpendicular end cuts at `x=W` and `x=NQ` remove **two triangular wedges, each area W²/2**, leaving a full-width rectangle and **MODELED, NOT MEASURED** usable length `NQ-W`.

This is not the unqualified shortcut `S²/W`. The separate seam and trim ledger closes exactly:
```
raw square area: S²
  first-seam face loss: L*d
  second-seam face loss: 2*d*V
  unused transverse partial-band area: (V-NW)*Q
  both squared end triangles: W²
  remaining full-width strip area: W*(NQ-W)
S² = sum of the five contributions
```
The model rejects `N*W>V` **even when** the older PRE-SEAM theoretical count still permits N; no negative or partial-length band is padded. `N>=2` and `offsetBands=1` remain required.

### Reproducible example: S=30in, a=0.25in, W=2.5in, N=8
| Quantity | Result |
|---|---:|
| Ideal pre-seam height H | 21.213203436 in |
| Post-first-seam face height V | 20.859650045 in |
| Post-second-seam band run Q | 41.719300090 in |
| Connected centerline before end squaring NQ | 333.754400720 in |
| Terminal end length removed | 2.500000000 in |
| **Idealized full-width squared-end length** | **331.254400720 in (NOT measured yield)** |
| First seam face area loss | 15.000000000 sq in |
| Second seam face area loss | 14.750000000 sq in |
| Discarded partial-width remainder | 35.863998200 sq in |
| Both terminal triangular offcuts | 6.250000000 sq in |
| Full-width modeled strip | 828.136001800 sq in |
| Total source-square area accounted | **900.000000000 sq in** |

The numeric output may differ from published approximate square-sizing charts because this model discards partial bands and adopts precise seam and end-trim conventions. **Do not calibrate to an approximate chart by forcing arbitrary waste constants.**

## Implemented engineering assertions
- `src/lib/quilt/continuous-bias-tube-development.ts`: coordinate polygons in stitched and unfolded charts, inverse mappings back into both source triangles, marked cut-line/stitch-line intersections, two individually accounted seam regions, unused transverse sliver, two squared-end triangular trims and an area balance.
- `tests/continuous-bias-tube-development.test.ts`: exact polygons and seam crossings; provenance triangle bounds and band area; all 5-area identity; multiple values of S/W/a; pre-seam fit versus sewn-face failure; wrong 0/2/3 offsets; deliberate geometry/length/purchasing-flag tampering.
- `/lab/continuous-bias-tube/`: new 2D research panel with vector geometry, coordinate table and full JSON. Previous topology-only CSV remains explicitly topology-only. The lab is `noindex,follow`; it does not create a new indexable or commercially purchasable route.
- `scripts/browser-smoke.mjs`: mobile 375px read-only geometry, JSON vertex/area review, disabled/stale export, connectivity failure and existing WCAG/noindex checks.

## NOT YET DONE — required before a Continuous Bias Binding buying calculator
1. Sew and independently measure reference specimens across representative source square sizes, full strip widths and seam allowances. Record actual finished *full-width, squared-end length* and individual two-seam/end-trim dimensions **against this coordinate convention**. The 18-inch tutorial example is not by itself a measured mathematical oracle.
2. Verify whether fabric distortion, seamline taper, mismatched short-edge offset or actual dog-ear trimming invalidate the conservative ideal geometry or require alternative coordinates. Reject or explicitly model unequal seam allowances and non-square source rectangles.
3. Validate physical one-layer continuous cutting, both right/left stitch-line correspondences, full strip width along the entire strip, and a scale-calibrated physical pattern/print workflow. The screen SVG is explicitly NOT 1:1.
4. Only after representative physical agreement and QA signoff decide whether to expose buyer-safe raw yardage with post-prewash WOF feasibility, directional grain, shrinkage, 1/8-yard rounding and shared Binding/HUB/CSV/print integration.
5. Keep the seven `HOLD-BIAS` SEO intents, preview noindex/canonical restrictions and absence of formal domain unchanged.

**Current decision: numerical coordinate gate can pass; physical fabrication and purchasing gates are still HOLD.**
