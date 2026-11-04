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

- The source V2 plan describes external `V2_Golden_Fixtures.csv` (39 cases), `V2_Property_Test_Plan.csv` (24 requirements) and `V2_Release_Gates.csv` (47 gates), but these exact original worksheets were not present in the deployed repository and were not separately available with the supplied plan during this review. Their original row-by-row gates remain NOT_RUN/PARTIAL as shown above, regardless of the separate 81 passing current tests.

- Removed a fixed `1e-8` coordinate tolerance that could accept a physically oversized WOF row or ignore a small true overlap. Geometry uses bounded floating-point-scale slack; regression tests cover sub-1e-8 violations and decimal exact-touching layouts.

- Allowed grain rotation now also considers near-square rectangular cut dimensions (rather than suppressing rotations solely due to a fixed epsilon). Tests demonstrate a borderline piece is rejected when rotation is forbidden but accepted when its rotated width actually fits.
