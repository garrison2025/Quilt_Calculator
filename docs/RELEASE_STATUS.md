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
