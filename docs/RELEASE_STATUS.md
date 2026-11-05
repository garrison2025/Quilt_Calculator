# Quilt Studio — verified release status

Updated: 2026-11-05 (source/browser CI 41955969336; actual Cloudflare preview CI 41955969436; physical paper/ruler work remains NOT_RUN).

## Verified in the repository

- Astro static website with 9 functioning calculator intents plus a product homepage. All results run locally in the browser; no login, database, paid API, analytics or advertising script is required.
- Individual source-derived keyword and routing evidence: docs/data/V2_Keyword_Appendix_218.csv records 218 original Semrush-based rows; no claimed site revenue or SEO result.
- Deterministic nonoverlapping fabric-roll cutting plans, measured WOF, physical rotation/grain boundaries, one-piece batting, straight binding and butted borders. Feasible layouts do **not** imply globally minimal material use.
- Every fabric SKU and every butted border layer has its own expandable cutting plan, coordinates and summary; print events expand all material plans.
- Versioned Project V2, localStorage, inch/cm display, accessible inline errors, preservation of the last valid state, local JSON import/export and print/PDF schematics. Rejected input disables exporting the stale calculation.
- Material-specific shopping list separates exact raw yardage, rounded purchase, roll offcut, purchase-rounding excess, and post-assembly trim (where applicable). Manual unit prices for fabrics and borders produce clearly labeled estimates. Downloadable UTF-8 CSV uses spreadsheet-formula-safe quoting.
- Chromium screenshots are retained as GitHub Actions artifacts for desktop and 360, 375, 390, 768, 1024 and 1440px viewport inspections. These screenshots are useful evidence but do not replace manual visual and physical testing.
- Latest independently confirmed GitHub CI run: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41800618643 ; **81 unit/property tests passed**, TypeScript check, Astro build, static route/noindex and 218-row keyword-mapping checks, and real Chromium browser tests across the 10 published routes, multi-material plans, JSON/CSV export, offline/localStorage failures, conflict prevention, keyboard navigation, responsive viewports, dark mode, and PDF print. Evidence screenshots: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41800618643/artifacts/13307042723 .
- Preview website has noindex,follow; no sitemap and no absolute canonical on pages.dev. No search indexing should be enabled without an approved production domain.

## Outstanding independent validation

| Gate | State | Evidence needed |
|---|---|---|
| Original 39-case source golden-fixtures CSV | NOT_RUN | Obtain supporting CSV and execute exact original expectations |
| Original 24-case property matrix | PARTIAL | Map original source rows to executable tests |
| Original 47-item release-gate workbook | PARTIAL | Verify each gate and record evidence |
| Independent real cutting with physical fabrics | NOT_RUN | Compare exported cutting guide against real project material |
| Full visual accessibility/contrast and keyboard audit | NOT_RUN | Contrast measurements and screen-reader/keyboard review |
| Production domain, canonical, sitemap, indexing | NOT_CONFIGURED | User-approved custom domain and release authorization |
| AdSense, Search Console, revenue | NOT_CONFIGURED | Real site/account verification |

Only **straight binding, butted borders, one-piece batting and explicitly feasible fabric cutting** are supported. Bias binding, diagonal backing, mitered borders, rag quilt and square-in-a-square remain HOLD. The PDF is a schematic guide, never an actual-size sewing pattern.

**Status: working noindex engineering preview, not yet a finished production release.**

- UI enhancement: screen-only system dark color scheme with auditable label/body contrast checks, short 180ms reveal animations disabled by `prefers-reduced-motion`, and separate light PDF print stylesheet. GitHub Actions captures dark-mode evidence and checks reduced-motion behavior.

- Project Planner hub now exposes a separately expandable cut layout and coordinates for backing, binding, one-piece batting, every border layer and every fabric SKU; printing expands all material plans. Backing tool now defaults to the engine-recommended, least-yardage seam orientation rather than fixed vertical; manual override remains available.

- Protection against impractically large jobs: aggregate maximum 2,000 fabric pieces across all SKUs at JSON-import and UI-edit boundaries; explicit 2,000-cut checks for sashing, backing and binding prevent oversized constructions before layout generation. Adding a piece group/SKU also validates before committing it to local storage.

- Added downloadable Excel-compatible **Cut List CSV** listing every physical piece by independent material/SKU, with exact roll x/y, width/height, grain rotation, WOF and run length. Export is disabled when a material is infeasible or when no physical pieces exist. The existing full JSON export remains available for diagnostics.

- Layout verifier now sorts by roll-length start and checks only potentially overlapping longitudinal intervals; full geometry is still verified and the original cut order remains unchanged. Stress tests exercise 2,000 cuts, far-apart overlaps, edge-touching cuts, mixed shelves and nonfinite/invalid coordinates. This is not a globally optimal nesting algorithm.

- Local project integrity: `quilt-studio-v2` autosave compares the latest stored JSON with the last observed version before writing; conflicting tabs show a visible warning and require an explicit reload. The user can export their unsaved edits as a JSON backup first. Stale-tab resets do not delete newer projects. Blocked localStorage shows an unsaved warning while JSON backups remain available. Chromium captures screenshots of both recovery states as QA artifacts.


## Search-intent content upgrade (2026-11-04)
- Source: the original 218-row Semrush appendix under `docs/data/V2_Keyword_Appendix_218.csv`; 202 queries map to the nine existing tool pages, 16 are intentionally on HOLD, including unresolved WOF, Square-in-a-Square, bias and chart terms. This is **keyword allocation**, not verification that 202 queries rank.
- Each tool page now has a distinct server-rendered practical guide with formulas, examples, method constraints and contextual links to genuinely related calculators. The same handful of generic links are no longer reused everywhere.
- The shared conversion page consolidates 107 search variants: 14 actual length measurements (including thirds and mixed fractions), explanation of a yard of fabric as 36 inches of length rather than fixed width, and why square-inch area is not reliable purchase yardage.
- Static build QA now verifies exactly 218 source rows, 202 mapped/HOLD states, conversion no-cannibalization mapping, live guide sections on each approved tool route, and absence of HOLD route exposure.
- **Not yet independently validated**: Google SERP intent alignment, original golden fixture source workbook, original release gates, actual production rankings/indexing or physical fabric cutting. Publication remains `noindex` until an approved custom domain is configured.

- Extra SEO release checks: static per-page unique title/H1, known internal navigation destinations, labeled 14-row fraction reference, 1/3 and 2/3 exact outputs, responsive screenshots on converter at desktop and phone viewports, and guide links with no self-link or duplicate destinations.

- Input safety: strictly rejects malformed comma-separated measurements (e.g. `1,2` cannot silently become `12`), while accepting `1,000` and mixed fractions. Converter offers an inline accessible error and disables stale exports until corrected; covered by Vitest and Chromium tests.

- Purchase safety: replaced fixed epsilon in yardage-increment rounding with floating-point-scale tolerance and a final underbuy guard. Tested values just above every supported sample shop increment; tiny but real positive overages must round up, never down.

- Browser keyboard-focused accessibility gate added: skip link activates the main landmark with Enter, FAQ details expand and collapse from keyboard, single main landmark, unique element IDs and explicitly named visible inputs/selects. This is a scoped automated audit and does not replace manual screen-reader testing.

- Draft-edit safety: every noncheckbox input change now invalidates stale cut/CSV/print actions immediately, before blur. The original accepted local project stays intact until the field successfully validates on change, and a visible warning explains when a result is not ready. Browser smoke verifies pre-blur disabled exports and unchanged stored dimensions.

- A pending or invalid input now disables the project JSON Save button as well as cut/CSV/print: the downloaded backup must not silently omit the visible draft. After successful commit, backups re-enable. Cross-tab conflict backup remains available when the form has no pending/invalid field.

- Minimum stitched-span coverage now uses a post-count physical coverage guard rather than fixed `-EPS` in the count ratio. Boundary tests exercise WOF 12/43/108 in, multiple join losses, exact thresholds and values just above thresholds; protects against underbuying one backing panel or one straight-binding strip.

- Import contract parity: the V2 project parser now rejects unsupported or misspelled keys at all eight object boundaries, as required by the published JSON Schema's `additionalProperties:false`. Optional text labels no longer silently accept JSON `null`. Tests cover root, quilt, options, yardage, sashing, border, fabric and piece objects.

- Physical roll area reconciliation is now part of `verifyLayout`: every feasible plan must report offcut equal to roll area minus the individual cut-piece areas within floating-point precision. Tests reject forged scrap amounts and inconsistent roll-run lengths, including a 2,000-piece stress case.

- The source V2 plan describes external `V2_Golden_Fixtures.csv` (39 cases), `V2_Property_Test_Plan.csv` (24 requirements) and `V2_Release_Gates.csv` (47 gates), and the full three original worksheets have **now been recovered from the user's original XLSX** and committed to `docs/data/reference/`. The original source statuses are preserved as historical NOT_RUN. Current independent results: 39/39 original Golden fixture cases, 20/24 original property IDs with dedicated automated tests, and a separate 47-row G0–G4 evidence/remaining-blocker register. See `docs/VALIDATION_EVIDENCE.md`.

- Removed a fixed `1e-8` coordinate tolerance that could accept a physically oversized WOF row or ignore a small true overlap. Geometry uses bounded floating-point-scale slack; regression tests cover sub-1e-8 violations and decimal exact-touching layouts.

- Allowed grain rotation now also considers near-square rectangular cut dimensions (rather than suppressing rotations solely due to a fixed epsilon). Tests demonstrate a borderline piece is rejected when rotation is forbidden but accepted when its rotated width actually fits.

- Conversion usability: the yard input now accepts full-string Unicode fabric fractions such as `¼`, `¾`, `⅓` and mixed `1½`, in addition to `1/4` / `1 1/2`. Invalid fragments (e.g. `1,2½`) still fail safely. New math and Chromium checks confirm these exact values.

- Physical dual-WOF comparison now appears within the original Fabric Yardage Calculator, with two independently verified rectangle layouts, per-width cut-run and rounded purchase values, and an explicit no-buy warning for the hypothetical alternate. Only the CURRENT fabric WOF feeds the cut-list CSV. The optional V2 project field `yardage.alternateWof` is backwards-compatible with earlier saved project JSON. **The separate conditional WOF SEO route remains HOLD.**

- Print safety for dual-WOF comparison: the hypothetical comparison numbers and second-roll diagram are omitted from the real cut-plan PDF/print stylesheet. Browser QA checks screen visibility, print hiding, retained current-roll SVG and produces a current-width-only PDF artifact.


## Square-in-a-Square cutting laboratory (non-indexed, 2026-11-04)
- Trial calculator at /lab/square-in-square/ using fixed 1/4-in seam, 1/8-in ruler grid, optional oversized corner parents and two independent, physically verified rectangular parent-square roll plans. Cut two background squares diagonally once per block; the exported parent-square CSV does not certify the sewn HST triangles.
- The original /square-in-a-square-calculator/ route stays HOLD and out of production sitemap; even in a production build the lab page is noindex, without canonical or app JSON-LD.
- Trial mathematical reference checks are not independent real piecing proof: sewn point clearance, bias handling and the actual trimmed outside dimensions still require a physical sample. Original four Square keywords remain HOLD_NO_INDEX.


## Practice block: user-reported measurement audit (not independent certification)
- The noindex Square-in-a-Square trial now has a separate measured-test section: enter actual unfinished width/height and all four corner-point distances to the raw cut edge, or leave it unevaluated. It **does not** autofill measured values.
- Screening compares to finished target + 1/2 inch and four 1/4-inch point margins with a clearly identified, non-normative ±1/16-inch worksheet tolerance. Reported passes and failures are *USER-REPORTED ONLY*, not a certified source fixture or physical test performed by this project.
- CSV report includes a prominent non-certification warning. Changing any trial-cut input or measured value invalidates the previous report. Chromium smoke now checks required values, Unicode fractions, report labeling and a clipped-point failure.


## Original V2 workbook recovery and exact-reference QA (2026-11-04)
- Recovered the original 39 Golden records, 24 property requirements and 47 release gates from `Quilt_V2_Research_and_Build.xlsx` and committed the unaltered content (excluding spreadsheet-added row indices) to `docs/data/reference/`.
- **39/39 reference cases now match the engine**, and 20 original property IDs have explicit executable tests. The source data's original `NOT_RUN` statuses remain unchanged; current CI results are documented separately. Full suite: **167/167** at https://github.com/garrison2025/Quilt_Calculator/actions/runs/41813177924 .
- Corrected a real `YARD-04` difference: count 0 retains theoretically measurable row capacity without buying any fabric.
- All 47 original G0–G4 gates have independent current evidence/blocked statuses in `docs/qa/ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md`. Do not treat having automated evidence as release sign-off, especially for actual print scale, physical sewing, domain, consent or GSC.

- Added P23 SVG-to-exported-CSV traceability: each rendered cut rectangle carries machine-readable physical dimensions and roll identity; CI compares actual SVG pixel placement against independently downloaded CSV across all 9 approved cutting tools. Alternate WOF visuals stay explicitly comparison-only and are not counted as purchasing output.
- Added G42 browser request monitoring across normal editing, JSON imports, CSV exports, storage-failure mode, mobile, dark mode and print. Any third-party HTTP(S) request or non-read HTTP method now fails CI, guarding the current promise that the preview stays local-only. This must be re-audited if any future ad/analytics integration is approved.

- Latest real Chromium P23/G42 acceptance: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41929120595 — all SVG cut rectangles drawn on the nine approved cutting routes reconciled to exported CSV, including SKU identity and displayed pixel-coordinate mapping. No third-party HTTP(S) or non-read upload/write requests appeared across checked preview interactions. Original 47-gate current evidence register now contains **23 scoped automation-evidence gates / 17 partial**; source historical statuses are unchanged.


## Original P21 and P24: cross-tool project and print ruler aids (2026-11-05)
- Original P21 now has an isolated Chromium end-to-end journey across backing/binding/batting/hub/fabric/yardage and back, verifying native-inch data never double-converts, project SKU/quantity persist, abandoned uncommitted edits are not stored, and exported Project V2 JSON matches localStorage.
- A print-only 1 × 1 inch physical CSS box plus 100 mm measurement line is now included on approved calculator printouts, along with 100%/Actual Size printing instructions and a prominent warning that SVG cutting plans are schematic. CI checks physical *CSS* dimensions and exports a PDF artifact. **Real 100%-scale paper measurement by a user with a ruler remains NOT_RUN**, and this does not certify actual-size pattern printing.

## WCAG A/AA automated scan (2026-11-05)
- Added `axe-core` only to the GitHub CI browser dependency stage (not the public app bundle), scanning all ten approved pages and the separate noindex Square lab against WCAG 2.0/2.1/2.2 A/AA rule tags. Each run exports a JSON report in the browser test artifact.
- Initial scan surfaced two shared violations: text contrast below 4.5:1 in small muted captions on light surfaces, and accessible-name mismatch on the visible Quilt Studio wordmark. Replaced selected light-mode muted palette values with higher-contrast greens, and removed the mismatched overridden brand link name so its accessible name follows the actual visible wordmark. Remaining findings must be reviewed from the subsequent CI, including automatic scan incomplete items and manual screen-reader checks.

## WCAG A/AA scanned UI — 2026-11-05
- Open-source `axe-core` now scans all ten approved route pages plus the noindex Square lab at default desktop width, three narrow 375px mobile views, and one dark theme view on every CI. The library is installed only for CI; no new production network client or paid API was added.
- Genuine issues fixed: small-size decorative and functional caption text below the WCAG 4.5 contrast target, white button text on light mint dark-theme buttons, and the brand link visible-label/accessibility-name mismatch. After corrections **all 15 automated scans had zero reported violations**: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41933804432 .
- This is **NOT** a full WCAG conformance certification. Axe marks some checks as incomplete and independent manual screen reader/zoom/real phone audits remain outstanding. Do not reinterpret original 47-gate statuses as passed merely because scanner output is clean.


## Error focus and 320-CSS-pixel reflow proxy (2026-11-05)
- Error text is now an associated `role="alert"` and field notes are connected using `aria-describedby`. Clicking Update with invalid input focuses the first invalid field rather than scrolling away to stale results. A successful explicit recalculation on small screens focuses the results region with programmatic `tabindex="-1"` (no additional normal tab stop).
- Chromium QA checks both keyboard focus/error recovery and a **320 CSS px viewport** across the homepage, calculator hub, backing, fabric and conversion tools. The latter is a WCAG 1.4.10 *reflow proxy* for 1280 CSS pixels at 400% zoom, **not** proof of actual physical 400% browser zoom or assistive technology compatibility.


## Recoverable reset and stale-tab data protection (2026-11-05)
- In a stale tab with a changed shared browser project, Reset now explicitly refuses to replace the tab's local project; this prevents inadvertent loss of an unexported local version. The user can Save project JSON or deliberately Load latest.
- After a normal successful Reset, an `Undo reset` action restores the previous accepted native-inch V2 project **and** its saved browser JSON. Undo is single-use and invalidates as soon as a subsequent accepted edit/import/unit change occurs, so it cannot overwrite newer work.
- Added real Chromium two-tab regression assertions, reset/undo/export recovery and invalidation after new edits. Undo is an in-memory single-tab safety net, not a permanent history; drafts not yet committed are not included. The original mathematical tests and noindex release gate remain unchanged.

## Project draft-loss regression guards (2026-11-05)
- When a user is typing an uncommitted value or has a rejected field, changing units, resetting/undoing reset, importing JSON, loading another tab's version, or adding/removing fabric SKUs, cut groups or border layers now refuses the destructive editor re-render and focuses that draft. The accepted Project V2 and last localStorage version are preserved.
- JSON import checks the draft guard twice: before opening the file chooser and again after the asynchronous file read, before replacing the active project. Correcting the draft restores normal edit, autosave and reset/undo behavior.
- Evidence: [GitHub CI 41939510752](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41939510752) passed TypeScript, existing 167 unit/property tests, static build and real Chromium regressions for rejected-field reset, unit switching, import attempt, fabric SKU add/remove and border add/remove. The screenshot artifacts are automated browser evidence, not physical cutting or manual WCAG certification.

## Directional grain contract for single-material yardage (2026-11-05)
- Fixed a material-scoping bug: the Fabric Yardage tool formerly shared `options.allowRotate` with the one-piece Batting tool, despite the rolls being independent materials. New optional `yardage.allowRotate` stores this calculator's cutting permission separately; old V2 project files without this property still fall back to the previous shared preference.
- New optional `yardage.oneWayPrint` enforces the V2 construction rule: a directional print can **never** be rotated 90 degrees, even if rotation permission is checked. The pure math engine applies this in both current and hypothetical alternate-WOF calculations. Current cut-list CSV outputs the enforced, actual `grainRotationDeg` and the UI states when the one-way rule overrides requested rotation.
- No source Semrush keyword rows, published tool routes, original 39-case references, or noindex conditions changed. `schemaVersion` remains 2; missing new booleans in old JSON files remain valid. The schema, browser UI, math engine, import validator and export checks agree.
- Confirmed in [CI 41940484000](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41940484000): **169/169** unit/property checks, TypeScript, Astro build and real Chromium paths (rotated 25-inch run vs directional 30-inch run, zero rotated directional cuts in downloaded CSV, and unchanged batting rotation across tool navigation). Real fabric print alignment has not been independently physically tested.

## Incomplete purchase and hub-batting parity safeguards (2026-11-05)
- The Project Planner now exposes a separate "May rotate batting 90°" checkbox and passes the existing `options.allowRotate` to the **same** single-piece `calculateBatting` engine used by the standalone batting route. Previously the hub omitted rotation entirely; with 108 × 58 in batting on a 65-in usable roll, the standalone tool could permit 90° while the hub incorrectly returned FIT_IMPOSSIBLE.
- A material with no independently verified feasible cut never receives an invented yardage in the shopping CSV. The visible shopping list warns `INCOMPLETE SHOPPING LIST`; a downloaded partial sheet has an `INCOMPLETE` filename and explicit per-material `FIT_IMPOSSIBLE_NOT_PURCHASE_READY` status. Feasible lines retain raw and rounded yardage, WOF-dependent offcuts, optional user price and independent prices.
- The "Print plan / Save PDF" action and complete physical cut CSV are disabled whenever any current material has an infeasible geometry or no physical pieces exist. The diagnostic JSON export remains available, with machine-readable feasibility. A simple yards-to-inches conversion retains its standard print option.
- [CI 41941616100](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41941616100) passed **173/173 Vitest tests**, TypeScript, Astro static output/keyword gates and Chromium tests of hub/batting parity, grain=90° in both downloadable cut CSVs, 3-yard physical purchase, impossible batting/SKU warnings and partial CSV status/filename. This is browser/math evidence, not a physical cutting or paper-scale certification.

## Browser Print / Ctrl+P safety gate (2026-11-05)
- Closing the built-in Print plan button was insufficient: the browser's **Ctrl+P**, Print menu or Save as PDF can still print the DOM. When an uncommitted input, rejected measurement, impossible material roll or zero-physical-cut state leaves a plan not cut-ready, the calculator now writes `data-print-ready="false"` on its host and print-only CSS hides the entire cut/shopping result subtree and replaces the ordinary print heading with a bold `NOT A CUT-READY PLAN` diagnostic. This protection also applies before JavaScript has hydrated; it does not depend on the browser honoring the disabled button.
- Every successful recalculation sets `data-print-ready` from the same availability decision as the built-in Print button. The pure length-conversion route remains printable without any physical cut requirement; valid material plans retain diagrams and cutting coordinates.
- [CI 41944674495](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41944674495) passed TypeScript, **173/173** Vitest cases, static/SEO gates and actual Chromium print emulation for feasible, infeasible and stale-input views, including generation of `artifacts/qa/infeasible-browser-print-blocked.pdf` during the QA job. Automated CSS visibility and PDF creation are verified; independent paper ruler measurements and sewing construction remain **NOT_RUN**.

## Whole-project quilt-top completeness and diagnostic exports (2026-11-05)
- Fixed a material completeness bug: zero quilt-top SKUs or any entered fabric SKU with zero positive-count cut pieces previously produced a mathematically feasible **0-yard** fabric result. The Project Planner could still expose "complete" cut CSV and Print even though the essential quilt-top materials had not been planned.
- The engine's 0-piece layout remains mathematically valid for the dedicated zero-quantity arithmetic fixture; the **product readiness layer** now correctly distinguishes `NOT_PLANNED_NO_CUT_PIECES` from `FIT_IMPOSSIBLE_NOT_PURCHASE_READY` and `FEASIBLE_LAYOUT`. This preserves original V2 fixture math while preventing a misleading purchase order.
- A missing quilt-top fabric list is represented in the project shopping CSV as a distinct non-purchasable row; an entered empty SKU is also flagged without fabric cost or zero-yard purchase. The shopping CSV is explicitly named `INCOMPLETE`. Complete physical cut CSV, the site's Print action and browser Ctrl+P print content remain blocked until every entered top-fabric SKU has actual cuts. Independent backing, binding and batting estimates remain visible as **partial** calculations. Adding valid pieces or removing an unused SKU restores readiness.
- Both hub and dedicated Quilt Fabric JSON diagnostic exports now include `readiness` with `scope`, `status`, `topFabricMissing`, `hasInfeasibleMaterial`, `physicalCutPieceCount`, `cutCsvReady` and `printReady`. The empty fabric page now exports `result:[]` rather than an unexplained `result:{}`. `scope='entered-project-materials'` deliberately makes no guarantee that the user has entered **all** quilt-top blocks/colors; the site cautions users to verify that coverage before buying.
- [CI 41946828113](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41946828113): **175/175** Vitest cases across 10 suites, TypeScript, Astro/noindex/static output, Chromium test of deleting all fabric SKUs, entering 0-count pieces, JSON readiness and CSV statuses, browser print suppression and restoration after entering positive-count pieces. Physical fabric/real 100% paper measurement and production domain release remain **NOT_RUN/WAIT**.

## Manual review before claiming a whole-project cutting plan (2026-11-05)
- A program can establish that **entered** fabric rectangles are physically feasible; it cannot infer whether a quilter has entered **every** quilt-top block, SKU/color and cutting quantity from only a finished quilt width/height. Added an explicit manual confirmation checkbox on **both embedded hub routes** (`/` and `/calculators/`): “I reviewed every quilt-top color, cut size and piece quantity.”
- The new optional V2 property `quilt.topCutsReviewed` is **false in the sample** and absent fields in older imported JSON files are treated as not reviewed; no legacy V2 import is auto-certified. Confirming is blocked when a material SKU lacks positive-count cuts. This is a **user acknowledgement, not physical validation**, and the UI tells the user to replace sample data before confirming.
- Until manually reviewed, valid entered piece yardages remain **partial estimates** rather than a final purchase order. The shopping CSV is named `INCOMPLETE` and marks quilt-top SKU lines `TOP_CUT_LIST_NOT_REVIEWED` while retaining their real calculated yardage. Whole-project cut CSV, built-in Print and browser Ctrl+P cut contents are blocked. Individual material tools keep working independently.
- Any accepted change to the finished quilt dimensions or to the quilt-top fabric SKU, grain, price, cut-group or count data revokes confirmation; removal or addition of fabric SKUs/groups also revokes it. The visible checkbox clears instantly without a destructive editor re-render. The explicit confirmation and revocation are reflected in JSON `readiness` (`topCutsReviewed`, `topCutListNotReviewed`, status) and the local Project V2 backup.
- [CI 41948844759](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41948844759) passed **177/177** Vitest assertions across ten suites, TypeScript, Astro static/noindex gates and Chromium: home/hub default review state, incomplete shopping CSV, full cut export recovery on user confirmation, automatic revocation after quilt dimensions and fabric piece-count changes, mobile 320–1440px reflow, P21 project continuity and print/PDF checks.
- This new release gate makes purchase messaging more conservative; it does **not** close original real-fabric, physically calibrated 100%-size paper, manual WCAG, domain, AdSense or Search Console release gates.

## Bound quilt-top review fingerprint on V2 JSON import (2026-11-05)
- Closing the whole-project manual cutting review on a boolean alone was insufficient: a manually edited V2 JSON file could keep `quilt.topCutsReviewed=true` even after changing cut counts, sizes or fabric colors. The UI could incorrectly treat the imported fabric geometry as previously checked.
- Added **optional V2** `quilt.topCutsReviewFingerprint` (eight lowercase hex characters) to the TypeScript project model, validator, JSON Schema, local storage and portable JSON. The fingerprint covers only finished quilt-top dimensions and the entered top-fabric SKU/cutting-list data; backing, batting, display units, and shop-rounding settings are independent. The value is **non-cryptographic change detection**, not tamper resistance, a signature, or evidence of a completed physical quilt.
- The user's checkbox now saves the fingerprint when confirming and clears it on unreview or relevant edits. All purchase/print readiness uses `hasCurrentQuiltTopReview` which requires both `topCutsReviewed=true` and a matching fingerprint. A legacy V2 file with no fingerprint remains fully importable but **not reviewed** even if it has a true review boolean; the user must explicitly recheck. A reviewed JSON file with unmodified matching fabric geometry remains reviewed.
- [CI 41950121030](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41950121030) passed **178/178** unit/property tests, lint, build/index gates, Chromium downloads and import journeys: stale imported cut quantity, legacy unbound review flag, exact matching reviewed import. Full cut CSV/print stay blocked for unbound/stale cuts. Real-world fabric/paper scale, manual accessibility, owned domain and AdSense remain **NOT_RUN/WAIT**.

## Independent physical print-calibration worksheet — deployed, not yet measured (2026-11-05)
- Added a dedicated **noindex** print-calibration worksheet at `/qa/print-calibration/`, linked from the site footer. The QA-only page deliberately sits outside all ten approved SEO tool routes, adds **no** sitemap/canonical/JSON-LD search entitlement, and keeps the same `noindex` on the Cloudflare preview.
- The worksheet includes a one-inch square, a 100-mm line and an independent six-inch / 152.4-mm reference, all defined in CSS physical units. It includes the actual-size printing instructions, a writable record of printer/paper/scaling/actual measurements, provisional suggested tolerances and an explicit warning that screenshots and browser PDF output cannot certify real paper.
- The separate source-controlled manual record template is `docs/qa/PRINT_SCALE_PHYSICAL_SIGNOFF.md`, with actual width/height/line measurements recorded as `NOT_MEASURED` and signoff `MANUAL_NOT_RUN`. **No printer or ruler was physically used in this verification.** The Square-in-a-Square sewn-sample gate is independent and remains unverified.
- [Local quality CI 41953819230](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41953819230): 178/178 Vitest tests, approved SEO routes, intentionally noindex QA route, Chromium print emulation of all three CSS physical gauges and generated QA PDF, plus all existing calculator/mobile/print regression.
- [Real Cloudflare Pages CI 41953819293](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41953819293): verifies exact commit `f2b89050` and the actual public calibration page's presence, SEO restrictions and all three CSS dimensional references. Cloudflare Pages deployment check also succeeded.
- Original G2 print gate remains **MANUAL_NOT_RUN** until a person prints at Actual Size (100%), measures with a physical ruler and records all four values. This change makes the independent physical test easier to perform; it does not satisfy it.

## Safe asynchronous JSON import under concurrent edits (2026-11-05)
- Fixed a project data-loss race: `File.text()` is asynchronous. The prior V2 import path checked for unfinished drafts after the await but not whether the user had **accepted and saved new measurements** while that JSON file was being read. A successfully parsed but stale file could silently replace newer work. It also lacked a full shared-storage recheck after the read.
- The import handler now captures the **exact starting project JSON** and the **starting saved-storage snapshot**. After file parsing and validation it rechecks: (1) unfinished form changes, (2) the in-memory project, (3) this tab's saved-storage marker, and (4) the actual latest cross-tab localStorage value where readable. On a mismatch, the import is explicitly **canceled without applying the stale JSON**; a cross-tab storage conflict is visibly announced. Browser-storage-blocked sessions keep in-memory safety without requiring localStorage.
- Added an actual Chromium regression which deliberately suspends `File.prototype.text()`, commits a new edited width and then completes the old read; checks that both UI and localStorage still contain the new width. It also confirms a non-overlapping delayed import **works** and that a newer other-tab autosave is not overwritten by a delayed import. Screenshot evidence: `artifacts/qa/delayed-json-import-conflict.png`.
- [Local CI 41955969336](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41955969336): **178/178** unit/property tests and all browser interaction/print/mobile/P21 checks passed. [Public Cloudflare CI 41955969436](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41955969436) confirmed the exact deployed commit `8dfdd043` and public interaction regression, with Cloudflare Pages deployment check `success`. This is engineering evidence; it does not change the original 47-gate physical/manual release statuses.
