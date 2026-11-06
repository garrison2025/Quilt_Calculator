# Continuous Bias Tube — corrected 2D sewing-line development and squared ends
Date: 2026-11-07 | Status: **SOFTWARE / NUMERICAL GEOMETRY MODEL; PHYSICAL CUTTING NOT VERIFIED**

This document supersedes the earlier 2026-11-06 draft geometry in this branch. The topology graph is unchanged. The earlier `V=H-a√2`, `Q=L-2a√2` length model and its **331.254in** worked result are withdrawn. Do not use them.

## Construction evidence and model boundary

The two-seam continuous-bias procedure is supported by these sewing references:

- [American Patchwork & Quilting, How to Make Continuous Bias Binding](https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-make-continuous-bias-binding): cut a square into two triangles; sew short edges into a parallelogram; mark parallel bias lines; bring the short edges together with one-strip offset; match the marks at the ¼in sewing line; cut a one-layer spiral. Its steps do not publish a general exact length formula. The article also says to trim the last mark to a full strip width.
- [APQS, A Guide to Bias Binding](https://www.apqs.com/a-guide-to-bias-binding/): when making the parallelogram, one triangle tip extends past the other by ¼in at each end; the later tube seam is offset one line, and each drawn mark is checked ¼in from the raw edge. It explicitly instructs checking that the cut marks form one continuous path before cutting.
- [Geta's Quilting Studio, Continuous Bias Binding Cheat Sheet](https://www.getasquiltingstudio.com/pdf/tutorials/continuous-bias-binding-cheat-sheet.pdf), page 6, gives a practical rectangular-piece area estimate after subtracting ½in from each dimension. This is an external planning reference, **not** an exact oracle for the present seam/tip/terminal-trim convention.

The equations and coordinate transforms below are the project's explicit idealized construction convention. The sources support the operation and alignment; they do **not** certify this engine's numeric output as physical fabric yield.

## Assumptions

1. `S` is the measured usable side of a square after selvage removal/prewash decisions. The source square fits the measured usable WOF. The two cut pieces are exact 45° right-isosceles triangles.
2. Both seams use the same perpendicular seam allowance `a` measured from each raw edge. Unequal seam allowances are not supported.
3. The first triangle-assembly seam uses the equal tip overhang specified by the APQS method: each triangle's tip extends by `a` at opposite ends. The seam allowances are pressed open. No stretch, easing, distortion, or extra end trimming is assumed.
4. The second seam closes the parallelogram's two short straight-grain edges. The drawn lines are offset by exactly one full unfolded strip width `W`, and their intersections are matched on the stitch line, not at raw edges.
5. Only `N` complete marked bands of width `W` are retained. Any remaining transverse sliver is discarded; no fractional-width strip is counted.
6. The unfolded offset strip has two diagonal terminal wedges. Squaring the ends removes one `W²/2` triangle at each end. No extra operator allowance, backstitch, bias-stretch gain, shrinkage, or retail rounding is included.
7. SVG coordinates are numerical inch coordinates, scaled to fit the screen. They are **not** a 1:1 printable cutting template.

## Coordinate contract

Let:
```
S = original square side
a = seam allowance per raw edge, used for BOTH seams
d = a * sqrt(2)
L = S * sqrt(2)
H = S / sqrt(2)
```

### 1. First seam: two triangles into a parallelogram

Before seam allowance, the ideal parallelogram chart has vertices:
```
(0,0), (L,0), (L+H,H), (H,H)
```
The first assembly stitch line is `x+y=L-d`. With the equal `a` tip-overhang alignment, the sewn-face parallelogram becomes:
```
A = (0,0)
B = (L-d,0)
C = (H-d/2,H-d/2)
D = (L+H-3d/2,H-d/2)
```
Therefore:
```
post-first-seam long edge L1 = L-d = sqrt(2)*(S-a)
post-first-seam height H1 = H-d/2 = (S-a)/sqrt(2)
post-first-seam face area = L1*H1 = (S-a)^2
first seam face take-up A1 = S^2 - (S-a)^2 = 2*S*a - a^2
```
The first assembly stitch line runs from `B` to `C`. This is an internal seam, not the tube-closing seam.

The band polygons are split at this line to retain their provenance in the two original source-square triangles. For a point `(x,y)` in the lower-right triangle:
```
X = (x+y)/sqrt(2)
Y = (x-y)/sqrt(2)
```
For a point in the upper-left triangle, reverse the first-seam tip-overhang placement:
```
X = (x+y+2*d-L)/sqrt(2)
Y = (x-y+d)/sqrt(2)
```
Every mapped source vertex is checked to remain inside `[0,S]²` and the correct triangle (`Y<=X` or `X<=Y`). The two mapped regions of each band must sum to that band polygon's area.

### 2. Second seam: close the tube with one-line offset

Use `u=x-y` and `v=y`. The two raw short edges of the post-first-seam parallelogram are `u=0` and `u=L-d`. A perpendicular allowance `a` moves their stitch lines to:
```
left tube stitch line:  u=d
right tube stitch line: u=L-2*d
```
The available full-band run is:
```
Q = (L-2*d)-d = L-3*d = sqrt(2)*(S-3*a)
```
The post-first-seam transverse height remains `H1=(S-a)/sqrt(2)`. A complete marked band count must satisfy:
```
N*W <= H1
R = H1 - N*W >= 0
```
The engine rejects a band count that only fits the pre-seam theoretical sheet but exceeds this sewn-face height.

For band `i=0,...,N-1`, with `v0=iW` and `v1=(i+1)W`, the exact sewn-face vertices are:
```
(d+v0,v0)
(L-2d+v0,v0)
(L-2d+v1,v1)
(d+v1,v1)
```
The first seam line in this chart is `x+y=L-d`. A cut boundary at `v=jW` intersects that seam only when the intersection lies between the two tube stitch lines. The intersection is `(L-d-jW,jW)`; otherwise the boundary is a two-point polyline without an interior seam crossing.

The one-lane tube connection is:
```
right cut mark j at (L-2*d+j*W, j*W)
    is sewn to
left cut mark j+1 at (d+(j+1)*W, (j+1)*W)
```
There are `N` boundary endpoint correspondences, for boundary indices `j=0,...,N-1`; boundary `N` is the open terminal edge. Adjacent endpoint correspondences define exactly `N-1` complete band-to-band tube-seam segments. Each segment has two endpoint matches: right edge of band `i+1` to left edge of band `i+2`. In the unfolded chart, both source edges must map to the same shared edge between the two developed band panels. The first boundary match (right boundary 0 to left boundary 1) is essential: both endpoints map to the first panel join at `(Q,0)`. The topology graph's `N-1` links correspond to these `N-1` complete seam segments, not to the number of endpoint records.

The coordinates are different before sewing; the seam identifies them. Zero/two/three-line offsets remain topology failures and are not developed as a single strip.

### 3. Unfolded spiral and end trimming

For each band `i`, the unfolded panel is:
```
(i*Q,0)
((i+1)*Q,0)
((i+1)*Q+W,W)
(i*Q+W,W)
```
Adjacent panels meet edge-to-edge after the one-line seam identification. The full developed strip has two diagonal ends. Perpendicular end cuts at `x=W` and `x=N*Q` remove two triangles, each `W²/2`. The remaining full-width rectangle has the model length:
```
modeled square-ended length = N*Q - W
```
This length is a mathematical result of the stated construction convention, not a measured cloth result.

## Independent area ledger

The implementation balances the complete original square area across five disjoint accounting categories:
```
raw source square area:             S²
first triangle-assembly seam loss:  S² - (S-a)²
second tube seam loss:              2*a*(S-a)
unused partial-width remainder:     R*Q
two terminal squared-off triangles: W²
usable full-width strip area:       W*(N*Q-W)

S² = sum of all five categories
```
The second seam term is the two allowances along the post-first-seam short edge, whose length is `S-a`. The partial-width remainder is not promoted to a full band. The terminal triangles are removed from the developed strip; their area is not double-counted as seam loss.

## Reproducible example: S=30in, a=0.25in, W=2.5in, N=8

| Quantity | Result |
|---|---:|
| Ideal pre-seam long edge L | 42.426406871 in |
| Ideal pre-seam height H | 21.213203436 in |
| Post-first-seam long edge L1 | 42.072853481 in |
| Post-first-seam height H1 | 21.036426740 in |
| Post-second-seam band run Q | 41.365746699 in |
| Full bands N | 8 |
| Unused transverse remainder R | 1.036426740 in |
| Full-band run before end squaring NQ | 330.925973595 in |
| Both terminal end trims (length-equivalent) | 2.500000000 in |
| **Idealized squared-end strip length** | **328.425973595 in (NOT measured yield)** |
| First assembly seam take-up | 14.937500000 sq in |
| Second tube seam take-up | 14.875000000 sq in |
| Unused partial-band area | 42.872566012 sq in |
| Both terminal triangles | 6.250000000 sq in |
| Usable full-width strip area | 821.064933988 sq in |
| Total source-square area accounted | **900.000000000 sq in** |

### Independent published measured-length comparison

[Geta's Quilting Studio's continuous-bias tutorial](https://www.getasquiltingstudio.com/2018/04/continuous-bias-binding.html) reports an actual measured result of **120in of 2½in-wide bias binding from an 18in × 18in square**. The article does not specify a measured terminal-trim allowance, fabric stretch or measuring tension. Applying the current model convention to `S=18`, `a=0.25`, `W=2.5`, `N=5` gives **119.476in**, a difference of **−0.524in (−0.44%)** from that published measurement.

This is a useful independent one-point benchmark and is now a regression fixture in `tests/continuous-bias-tube-development.test.ts`. It is not a controlled test of our implementation, and it does not prove agreement across fabrics, sizes, seam execution or operators. The real-fabric signoff therefore remains **NOT_RUN**.

For comparison, Geta's practical rectangular-piece rule subtracts ½in from both dimensions; for this square that gives `(30-0.5)^2=870.25 sq in`. The present explicit seam convention gives post-two-seam face area `(S-a)(S-3a)=870.1875 sq in` before the partial-width and terminal trims. The 0.0625 sq in difference is small, but it is not silently rounded away or used to claim physical agreement.

## Implemented engineering assertions

- `src/lib/quilt/continuous-bias-tube-development.ts`: sewn-face band polygons, first-seam split and source-triangle provenance, first/second seam stitch-line coordinates, one-offset tube joins, unfolded band polygons, terminal wedge polygons and a five-category source-area ledger.
- `tests/continuous-bias-tube-development.test.ts`: exact sample coordinates; both seam losses; all source vertices inside the correct original triangle; pre-seam-fit/post-first-seam rejection; parameter grid across square size/strip width/seam allowance; deliberate polygon/seam/trim/length/physical-status tampering.
- `/lab/continuous-bias-tube/`: nonindexed research panel with chart, coordinate table and JSON. It does not create a public buying calculator, purchase-yardage output or printable 1:1 pattern.
- `scripts/browser-smoke.mjs`: mobile 375px chart and table, geometry JSON review, stale/disabled download, offset failure, noindex and WCAG assertions.

## Required before a Continuous Bias Binding purchase calculator

1. Sew and independently measure actual specimens at several `S/W/a` combinations. Record both first-seam tip overhangs, both seam stitchline positions, marked-line intersections, finished band width, and the length after both terminal trims.
2. Compare the physical strip to the predicted `Q`, `N`, end wedges and total length. Bias stretching, pressing, seam rolling and fabric thickness may cause systematic deviation.
3. Validate the one-layer spiral cut on real cloth, including both seam crossings and the first/last strip width. Confirm no fabric layer is accidentally cut twice.
4. Test unequal seam allowances, non-square source rectangles, prewash shrinkage, usable WOF and realistic end trimming before broadening the engine.
5. Only after physical agreement and manual signoff may the result be integrated into the production Binding calculator with yard rounding and purchase guidance.
6. Keep all seven `HOLD-BIAS` SEO intents held, and keep this research route `noindex,follow` with no canonical or sitemap entry.

**Current decision: corrected numerical 2D gate PASSed software validation in CI run [42308649658](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42308649658); real sewn-fabric yield and purchasing remain HOLD.**
