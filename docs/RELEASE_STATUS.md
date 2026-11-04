# Quilt Studio — verified release status

Updated: 2026-11-04. Public preview: https://quilt-calculator-566.pages.dev/ (no custom domain purchased).

## Verified in the repository

- Astro static website with 9 functioning calculator intents plus a product homepage. All results run locally in the browser; no login, database, paid API, analytics or advertising script is required.
- Individual source-derived keyword and routing evidence: docs/data/V2_Keyword_Appendix_218.csv records 218 original Semrush-based rows; no claimed site revenue or SEO result.
- Deterministic nonoverlapping fabric-roll cutting plans, measured WOF, physical rotation/grain boundaries, one-piece batting, straight binding and butted borders. Feasible layouts do **not** imply globally minimal material use.
- Every fabric SKU and every butted border layer has its own expandable cutting plan, coordinates and summary; print events expand all material plans.
- Versioned Project V2, localStorage, inch/cm display, accessible inline errors, preservation of the last valid state, local JSON import/export and print/PDF schematics. Rejected input disables exporting the stale calculation.
- Material-specific shopping list separates exact raw yardage, rounded purchase, roll offcut, purchase-rounding excess, and post-assembly trim (where applicable). Manual unit prices for fabrics and borders produce clearly labeled estimates. Downloadable UTF-8 CSV uses spreadsheet-formula-safe quoting.
- Chromium screenshots are retained as GitHub Actions artifacts for desktop and 360, 375, 390, 768, 1024 and 1440px viewport inspections. These screenshots are useful evidence but do not replace manual visual and physical testing.
- Verified GitHub CI run: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41787119029 ; 54 unit/property tests passed, TypeScript check, Astro build, static route/noindex check and real browser tests for all 10 available routes, multi-SKU and border-layer diagram visibility, data input changes, localStorage recovery, JSON calculation download, invalid input, responsive width, browser PDF rendering and HTTP 404.
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
