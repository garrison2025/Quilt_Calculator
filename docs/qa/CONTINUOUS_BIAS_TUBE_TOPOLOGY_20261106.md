# Continuous Bias Tube — seamline topology QA (2026-11-06)

**Scope:** an explicit software model for matching the marked lines of a continuous 45° bias tube **ONE cut-strip width out of phase**. This is **not** a length-yield, physical cutting coordinates, diagonally joined individual strips or retail fabric-yardage calculator. It is a predecessor to, not completion of, the `HOLD-BIAS` algorithm in `BIAS_BINDING_VALIDATION_PLAN_20261105.md`.

## What the independent instructions actually support

- [American Patchwork & Quilting, *How to Make Continuous Bias Binding* (2025-07-28)](https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-make-continuous-bias-binding): square → two diagonal triangles → join short triangle edges into parallelogram with ¼-in seam → mark parallel bias lines at full cut width → offset one full line to sew the remaining short edges into a tube → **cut through one layer** to follow a continuous spiral.
- [American Sewing Guild, *On a Roll—DIY Continuous Bias* (2025-10-31)](https://www.asg.org/on-a-roll-diy-continuous-bias/): the **one-line offset is essential**. Match marked line intersections ON the ¼-inch sewing line, not at the raw edge. Without the offset, cut strips form separate rings.
- [Satomi Quilts, *How to make a continuous bias binding*](https://www.satomiquilts.com/blogs/tutorials/how-to-make-a-continuous-bias-binding): the intersection of the strip mark and the stitching line ¼-inch away from the edge is the point to match. Reported physical 18-inch sample is source-specific; **not an engine-verification fixture or general mathematical formula**.
- The instructions describe how to sew and cut, **but do not prove the exact postseam usable length for arbitrary square, strip width, two seams, offset alignment and end trimming**. Neither a blanket 3-in allowance nor 10% waste is accepted as universal.

## Algebraic seam-connection graph, not a sewn-tube geometry

Input: a measured source square side `S` inches, post-trim fabric width `F`, full (unfolded) marked strip pitch `W`, tube seam allowance `a`, manually verified number of FULL usable marked bands `N` and offset `k` bands. Allowed `6≤S≤96`, `6≤F≤120`, `0.75≤W≤6`, `0.125≤a≤0.5`, `2≤N≤32`, `0≤k<N`; the UI demonstrates k=0,1,2,3.

The **only** topology result is the connection relation:

```
marked CUT LINE #i, RIGHT sewing line -> marked CUT LINE #(i+k), LEFT sewing line
  right mark distance along seamline = i*W
  left mark distance along seamline  = (i+k)*W
  offset along marked seamline      = k*W
  cross-seam line connections       = N-k for k>0
```

For k=0, each marked band is closed into its own independent ring; there are N rings, not one usable spiral. For k>0, construct open paths by starting at bands 1..k and repeatedly adding k. Thus there are exactly k distinct open paths, each marked band belongs to one and only one. **Only k=1 yields a single open spiral through all N bands.** The graph's source labels are conceptual seamline-mark indices: they do **not** assert the exact two-dimensional fabric coordinates or uncut cloth yield after joining.

The sewing-line perpendicular distance `a` is **NOT a guessed 2aN length loss**: it identifies where marks should be matched, and no length subtraction is made. In the independent **crosswise-end** strips construction, join loss `2a×(N−1)` applies to that distinct explicitly declared geometry, and is **not** copied into continuous tubes.

### Nominal pre-seam area/space bound

Before sewing, the original square has area `S²`. Ideal cut/reassembly makes a parallelogram with one long bias edge `S√2`; its perpendicular span is `S/√2`. Therefore `floor(S/(√2W))` is a **necessary PRE-SEAM bound** on how many completely marked width-W bands can exist in that ideal sheet. It is NOT a sufficient condition for physically available full bands after the two tube seams and any trimming. The user is required to ENTER the number actually marked; the model does not manufacture the lanes from fabric's raw area. `S²/W` is the loss-free theoretical maximum *length ceiling* only, **not a fabric-strip yield**.

Example input: `S=30in`, `F=43in`, `W=2.5in`, `a=0.25in`, `N=8 observed lanes`, `k=1`. The pre-seam maximum is **8 lanes**; one-band shift means **7 links** connecting **1→2→3→4→5→6→7→8**, which is a single OPEN path. The seamline marked cut boundary for the first link is right #1 at 2.5in and left #2 at 5in, measured along each conceptual sewing-line index from a common reference. At k=0, 8 disjoint rings; k=2, independent [1,3,5,7] and [2,4,6,8] chains. The ideal area ceiling `30²/2.5=360in` **is not** post-tube, post-sewing yield. No supply advice.

## Tests and what is still not certified

- `tests/continuous-bias-tube-topology.test.ts` independently checks k=1 produces exactly one path; k=0 returns N rings and k=2 multiple chains; exhaustively tests N=2..20 and every allowed offset, verifies exact seamline marking coordinates, bijective band membership, source WOF fit, pre-seam upper bound and output tamper rejection. The type deliberately contains **no `verifiedTubeYieldIn`, `purchaseYards` or `sourceCuttingPolygons`**.
- `scripts/browser-smoke.mjs`: 375px genuine Chromium UI test, graph and downloaded no-yield checklist, offset 0/2 handling, stale-download safety, oversize source square and impossible N rejection, axe-core WCAG, WebKit/Chromium mobile touch.
- `scripts/check-build.mjs`: noindex and no canonical/JSON-LD for `/lab/continuous-bias-tube/`, method-distinct links, 17 uniquely titled pages and unchanged official HOLD route eligibility.
- No claim about physical fabric sample, printed-scale validity or actual phone hardware; no cut-list CSV because **not a cutting geometry model**.
- Original 218 Semrush rows, 199 active intent mappings, 16 HOLD methods remain unchanged; custom domain not bought; production `pages.dev` remains `noindex,follow` with no production canonical/sitemap.

**Next engineering gate:** independently derive (or conservatively enumerate) the exact **two-seam parallelogram and tube fabric geometry** and helical cutting length after trimming, including cut-line intersections at the seamline. Compare against trusted numerical sample *after* declaring conventions for allowances and strip end treatment. Until this can be demonstrated, actual bias tube yield and buying yards remain **METHOD_NOT_VERIFIED**.
