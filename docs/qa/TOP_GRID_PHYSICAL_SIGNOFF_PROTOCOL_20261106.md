# Real 2D quilt-top measurements and independent human sign-off

**State: MANUAL_NOT_RUN.** This is a protocol and blank record, not a completed test, physical standard, or new stitch geometry algorithm. It does not change the nine approved calculators or noindex preview policy.

## 1. Decide if this audit applies BEFORE entering any measurements

**Supported by the optional browser self-check only:** a manually mapped 2–4 row by 2–4 column grid of orthogonal, nonoverlapping rectangular quilt-TOP patches, sewn by straight butt joins. One unique cut-list CSV piece number and actual fabric roll SKU must be assigned to each grid location. Row and column grid boundaries must align; each patch has an independently measured cut width/height and each internal joined edge has its own *net physical length consumed*. Grain direction, placement and stitch type are not inferred from cut-roll coordinates.

**Outside this model (mark SCOPE_UNSUPPORTED; do not force into the rectangular form):** any staggered/offset rows, non-aligned seam junctions, angled/on-point blocks, triangles, curves, inset/Y-seams, improvisational/nonrectangular shapes, overlap seams, stretch/deformation, or a different sewing topology. A larger grid (>4 in either direction) may be reviewed physically but is not supported by this particular online self-check. Bias binding, diagonal backing, mitered borders, rag quilts, and Square-in-a-Square each require their own verified method. Do not treat a visual bounding rectangle or area conversion as proof of cut/sewn fit.

**Sample vs entire center:** partial grids are valid *samples*, not proof of the entire quilt top. The `spansEntireCenter` option is asserted by a human only when EVERY quilt-center patch before borders is included. The software also cross-checks that **every numbered quilt-TOP cut** from all `fabric:<SKU>` rolls in the imported matched cutting-plan CSV is present exactly once in the manually arranged grid. If any source cut ID is missing, `USER_REPORTED_TOP_GRID_SOURCE_COVERAGE_MISMATCH` is an **exportable negative** result and the comparison against the planned whole-center width/height is **suppressed**, even if the small grid's calculated dimensions happen to equal the target. A real project with more than 16 top patches cannot claim whole-center coverage using this 2–4 by 2–4 QA aid. The human must establish whether omitted pieces are spares, whether this is a sample, or whether the cutting plan itself needs revision.

Matching all numbered CSV source cuts is only an **identity coverage prerequisite**. It does **not** authenticate the CSV, establish actual sewn placement/order, prove a rectangular quilt-center topology, or certify seam work. Compare a truly complete grid against the planned **center** width/height, never the border-inclusive outside quilt or backing dimensions.

## Printable 2×2 paper record (2026-11-06)

Use the optional [blank 2×2 measurement sheet](/qa/2x2-measurement-sheet/) on the noindexed preview (or [open it directly](https://quilt-calculator-566.pages.dev/qa/2x2-measurement-sheet/)). Print it as a **writing/measurement form**, not a 1:1 cut pattern. The sheet contains four blank row/column cut records and eight **separate** internal seam-edge loss blanks, two independent assembled-size blanks, and an **unsigned** human-decision record. It performs no software validation and pre-fills no ruler numbers or material source IDs.

Complete the physical sheet with actual fabric and preserve a scanned copy or signed paper locally. Then enter the same readings into [the browser-only noncertifying QA tool](/qa/fabric-cutting/). A submitted user-report JSON cannot replace independent physical review. Until actual measurements and an independent reviewer exist, retain `MANUAL_NOT_RUN`.

## 2. Preserve source and physical measurements

Collect all three exports from one reviewed Project Planner snapshot: cut-list CSV, shopping CSV and the optional matching cutting-plan JSON. Preserve copies of the exact source files. The eight-character project fingerprint is only a consistency tag, **not** an authentication mechanism.

Fill this blank independent physical evidence header:

| Required field | Real entry |
|---|---|
| Project snapshot/fingerprint and source filenames | NOT_RECORDED |
| Quilt-center dimensions before borders (from reviewed plan) | NOT_RECORDED |
| Grid scope (sample / entire center / unsupported) | NOT_RECORDED |
| Physical patch ID label / source roll SKU / row / column | NOT_RECORDED |
| Fabric prewash/postwash condition, grain and orientation inspected | NOT_RECORDED |
| Actual cutting, sewing, and measurement dates | NOT_RECORDED |
| Ruler / measuring instrument and units | NOT_RECORDED |
| Operator / independent reviewer | NOT_RECORDED |
| Actual photo or physical paper record IDs (if retained privately) | NOT_RECORDED |
| Declared TOTAL grid dimension tolerance (0–1 in) | NOT_RECORDED |
| Declared separate cut-piece tolerance (0–0.25 in) | NOT_RECORDED |

Record a **separate line for each patch** (2×2 to 4×4 in the online check). Never copy expected CSV sizes into real-ruler fields.

| Row/column | Roll + piece # | Reference cut W×H | Ruler cut W×H | Internal left/right/top/bottom losses (blank if not yet measured; 0 only if observed) | Notes |
|---|---|---|---|---|---|
| NOT_RECORDED | NOT_RECORDED | NOT_RECORDED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED |

For each internal neighbor join, collect **both** adjacent piece-edge take-up readings. Do not record outer perimeter edges as internal seams. Also measure **assembled sewn-grid width and height independently** using a ruler, *after joining the sample, before borders*. Do not fill them with calculated results. Record separate physical width/height at multiple positions if the rectangle is visibly skewed: the current simple grid check cannot certify squareness, warping, grain stretch, or diagonal dimensions.

## 3. Reconciliation and fail-closed logic

The site can compare, using only entered physical readings:

- Each cell's net width/height = measured cut dimension minus its own known internal seam-edge losses. A measured edge loss already >= the actual measured cut span is impossible **even while other grid measurements remain blank**; block export.
- For **complete** grid edge and cut measurements only: row totals, column totals, aligned patch-column widths and aligned patch-row heights, compared using the user-declared *total* tolerance.
- Complete grid predicted width/height vs independently ruler-measured sewn dimensions; report mismatch.
- Physical cut size vs the corresponding numbered source CSV cut. Use the **separate 0–0.25 in cutting tolerance from the material measurement section**, never the 0–1 in TOTAL assembled-grid tolerance. Each measured axis is compared independently: a wrong physical width must be flagged even if its height and other cells are still blank. The exported local evidence includes each known patch reference width/height, entered ruler width/height, numerical differences, row/column and SKU/piece ID. Report deviations, not automatic approval. The same split applies to a manually recorded one-dimensional seam chain.
- Planned pre-border center vs independently measured sewn grid **only** on a genuine full-center claim.

Treat these statuses as distinct: **BLOCKED_INVALID** (physically impossible or structurally invalid; no evidence JSON), **PARTIAL_USER_REPORTED** (missing values; no complete assembly conclusion), **USER_REPORTED_MISMATCH** (complete negative evidence should be preserved, not discarded), **USER_REPORTED_WITHIN_DECLARED_LIMITS** (arithmetic agreement only). In **all** cases the app must keep `independentPhysicalVerification:false` and `quiltCuttingApproval:false`.

## 4. Human acceptance decision (separate from site output)

An independent human must inspect the sewn article and source measurement notes, confirm correct source piece identity, grain, joining method, physical cut dimensions and seam losses, plus whether the geometric scope is supported. The reviewer separately evaluates real construction and any visible skew/pressing distortion; the software's arithmetic agreement cannot prove stitching quality. Resolve negative states before signing anything as accepted. Preserve separately the **physical 1-inch / 100-mm / six-inch print calibration** on the noindex print QA worksheet, if the project uses printed scale material.

| Manual gate | Decision | Evidence reference / signed date |
|---|---|---|
| Exact source exports match the physical fabric and piece labels | NOT_RUN | NOT_RECORDED |
| Geometry belongs to supported rectangular grid; every location mapped correctly | NOT_RUN | NOT_RECORDED |
| Actual patch widths/heights and internal seam take-up measured and reconciled | NOT_RUN | NOT_RECORDED |
| Actual assembled width/height measured independently; distortions reviewed | NOT_RUN | NOT_RECORDED |
| Sample coverage stated truthfully; whole-center claim independently checked if made | NOT_RUN | NOT_RECORDED |
| Physical cutting and sewing technique inspected by qualified human | NOT_RUN | NOT_RECORDED |
| Physical print ruler calibration (separate gate, when applicable) | NOT_RUN | NOT_RECORDED |
| All discrepancies resolved; physical conclusion independently signed | NOT_RUN | NOT_RECORDED |

Reviewer name/signature/date: **NOT_RECORDED**. Overall physical cut/sew gate: **MANUAL_NOT_RUN**.

**Evidence custody:** The site reads local files and produces local user-entered JSON; it neither uploads evidence nor provides trusted digital signatures. Keep photographs and signed paper offline. Only an actual review of the evidence by a responsible human can change a relevant physical gate; no automated CI/browser pass, uploaded synthetic measurement, or checked form field may change this record to PASS.

Refer to [REAL_FABRIC_CUTTING_SIGNOFF.md](REAL_FABRIC_CUTTING_SIGNOFF.md), [PRINT_SCALE_PHYSICAL_SIGNOFF.md](PRINT_SCALE_PHYSICAL_SIGNOFF.md), and [ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md](ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md).
