# Quilt Studio — verified release status

Updated: 2026-11-04 (CI 41800618643). Public preview: https://quilt-calculator-566.pages.dev/ (no custom domain purchased).

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
