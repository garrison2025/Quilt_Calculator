# Quilt Studio — Quilt & Fabric Calculators

Free US-English quilting tools built with Astro static pages and a browser-based TypeScript cutting engine. No account, database, paid API or required cloud back end.

## Local development (Node.js 22+)

    npm ci
    npm run lint
    npm test
    npm run build
    node scripts/check-build.mjs
    npm run dev

The build generates static WebP illustration assets and an Astro output in the dist directory.

## Deploy a Cloudflare Pages preview

Connect this repository in Cloudflare Workers & Pages > Pages > Connect to Git.

- Repository: garrison2025/Quilt_Calculator
- Framework: Astro
- Build command: npm run build
- Output directory: dist
- Root directory: repository root
- Node.js: 22+

Keep PUBLIC_INDEXABLE unset or equal to 0. Keep PUBLIC_SITE_URL unset without a user-approved production domain. The default preview is noindex and has no sitemap. The temporary pages.dev URL is not a canonical domain.

## Indexing is release-gated

Only after written custom-domain approval and the full browser, geometry and print QA should you configure:
- PUBLIC_SITE_URL as the approved HTTPS site origin (without trailing slash)
- PUBLIC_INDEXABLE equal to 1

Then redeploy. The production build generates canonical URLs and a sitemap containing only the 9 approved tool intents plus the homepage. No Google Search Console success, indexing or AdSense income is implied.

## Supported calculators

- /calculators/ : complete project planner with independent material purchase summaries
- /quilt-backing-calculator/ : panel counts, orientations and true roll lengths
- /quilt-binding-calculator/ : straight-grain strips and effective joined length
- /quilt-border-calculator/ : butted side-first border layers
- /fabric-yardage-calculator/ : repeated rectangles with optional permitted rotation; independent one-way/directional print constraint forbids 90° rotation
- /quilt-fabric-calculator/ : SKU-separated multicolor cut groups
- /fabric-yards-to-inches/ : exact fabric fractions and metric conversion
- /quilt-batting-calculator/ : single-piece batting roll-fit check
- /quilt-sashing-calculator/ : sashing strips and cornerstones

Bias binding, diagonal backing, mitered border corners, rag quilt, square-in-a-square, generic block calculator and WOF-area-based purchasing are HOLD, not claimed as working calculators.

The fabric roll SVG is a schematic with actual rectangle coordinates, not an actual-size print pattern. Nonoverlapping feasible cuts are demonstrated; global minimum waste is not guaranteed.

## Sources and checks

- docs/data/V2_Keyword_Appendix_218.csv — all 218 source-grounded V2 keyword candidates and route decisions.
- docs/SEO_KEYWORD_ROUTING.md — unique intent ownership and HOLD constraints.
- docs/schemas/Project_V2.schema.json — JSON project import structure.
- docs/RELEASE_STATUS.md — documented real QA evidence and missing acceptance work.
- docs/VALIDATION_EVIDENCE.md — reproducible test links and an explicit ledger of gates that still require independent material.
- GitHub Actions (https://github.com/garrison2025/Quilt_Calculator/actions) — live build and test results.

A passing build does not replace a browser, accessibility, physical print or real material cutting acceptance test.


## Non-indexed experiment: Square-in-a-Square
The cutting laboratory is at /lab/square-in-square/. It is intentionally not part of the published tool directory, keywords or production sitemap. It calculates conservative 1/8-in-ruler cuts for one center and two background parent squares per block, per-roll cutting layouts and separate purchase estimates. It is not cleared for real sewing until a physical sewn/trimmed test block confirms corner seams and dimensions.

## Original V2 source-workbook acceptance
The source XLSX's 39 Golden examples, 24 property requirements and 47 release gates have been recovered and committed to [`docs/data/reference/`](docs/data/reference/ORIGINAL_SOURCE.md). Current-engine reference replay is in [`tests/original-v2-golden.test.ts`](tests/original-v2-golden.test.ts), dedicated 20-ID property coverage in [`tests/original-v2-properties.test.ts`](tests/original-v2-properties.test.ts), and the 47-gate review is at [`docs/qa/ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md`](docs/qa/ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md). No original NOT_RUN source value was rewritten to imply independent physical testing.

### Directional fabric safety (2026-11-05)
The Fabric Yardage tool now independently stores its 90° rotation permission and one-way fabric-print flag. When a one-way print is selected, the engine refuses rotated cuts on both the current roll and the hypothetical alternate width and exports only actual permitted grain angles. Existing V2 JSON without these optional flags remains importable. [Verification: 169 unit/property tests and Chromium](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41940484000). This is an engineering QA result, not real-fabric certification.

### Purchase-safe project planner (2026-11-05)
The whole-quilt planner now uses the same one-piece batting grain-rotation setting as the separate batting tool. Unfit rolls are shown as `FIT IMPOSSIBLE` rather than silently assigned purchase yardage. If any roll cannot fit, the downloadable shopping CSV is explicitly named INCOMPLETE and annotates each unpurchasable line; cut CSV and the built-in Print plan button are disabled, while a diagnostic JSON calculation remains available. [Chromium verification and 173 passing tests](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41941616100).

### Quilt-top material completeness (2026-11-05)
Whole-project shopping is only marked cut-ready when each entered quilt-top fabric SKU has at least one positive-count physical cut group. No fabric SKU, or a SKU whose piece quantities are all zero, is **NOT PLANNED** rather than an impossible fit or an invented 0-yard purchase. A missing top produces an explicit `INCOMPLETE` shopping CSV with a `NOT_PLANNED_NO_CUT_PIECES` row and prevents a misleading complete cut-list CSV/printout. The JSON calculation export includes a scoped `readiness` explanation, and previously entered backing/batting/binding figures remain available as partial estimates. Only the entered cutting pieces are covered; users must confirm all planned blocks/colors are represented. [175 tests + full browser QA](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41946828113).

### Human-reviewed quilt-top cut-list coverage (2026-11-05)
The Project Planner cannot infer whether you've included every quilt-top block, fabric color and cut count from the quilt's finished dimensions. Both embedded planners therefore require an **explicit manual review** checkbox before presenting a whole-project cut CSV or printable cut/purchase plan. The checkbox is never prechecked for the sample, is not inferred from older V2 imports and automatically clears when the quilt size or top-fabric list changes. Until reviewed, entered cuts remain usable as **partial estimates** and the shopping CSV is named `INCOMPLETE` with per-SKU `TOP_CUT_LIST_NOT_REVIEWED` status. This is a user acknowledgement, not a promise that the cutting list was independently sewn or that real fabric orientation was inspected. [177 passing tests and full Chromium smoke QA](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41948844759).

### Review-provenance check for imported V2 projects (2026-11-05)
Manual quilt-top confirmation is now tied to an optional `quilt.topCutsReviewFingerprint` in locally saved and downloaded V2 JSON. If you edit your fabric cut list after reviewing it, or import an older V2 export containing only `topCutsReviewed=true`, the project **remains importable** but the whole-project review must be repeated. A matching reviewed export can restore its status. The fingerprint is deliberately **non-cryptographic** and detects accidental changes to entered cut data; it does not prove physical completeness or protect against deliberate tampering. [178 passing tests and verified browser import/cut-export behavior](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41950121030).

### Concurrent JSON import safety (2026-11-05)
Imported project JSON is rejected safely if you save newer quilt measurements or another browser tab updates the local project **while the file is still loading**. A non-conflicting import continues to work. The site does not overwrite the newer data and explains when to reselect the file. [Source-and-browser test](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41955969336) deliberately delays the file-read promise to verify both local and cross-tab conflicts, while [public Cloudflare test](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41955969436) confirms deployment. No paid API is used.

### Important prewash fabric-width assumption (2026-11-05)
**Enter the real usable width of fabric AFTER any planned prewashing and selvedge removal.** The percentage labeled "Length shrinkage" inflates purchasing **length along the fabric roll**; it never predicts or compensates the remaining fabric **width across the roll**. A wider, unwashed WOF measurement can falsely suggest a cross-grain cut will fit after laundering. Correct the WOF measurement before relying on the cutting plan. A directional/one-way print still forbids rotation, even if a piece would fit the other orientation. The site cannot infer real-world cross-grain shrinkage from a single length percentage.

[CI 41957276599](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41957276599) runs 181 unit/property tests, including 192 width × piece × rotation × print-direction × shrinkage combinations, independent multi-SKU feasibility and backing/binding geometry invariants. [Cloudflare Pages CI 41957276591](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41957276591) confirms the exact deployed commit and online interactions. The original physical fabric-cut/print signoff remains open.

### Scoped material-price subtotal and empty border list safety (2026-11-05)
The material shopping list now displays a **subtotal of only the material rolls with user-entered prices and feasible calculated quantities**. It also counts feasible but unpriced lines and unready lines. This subtotal is **not a full-project quote**, shipping or tax estimate, and is never represented as the cost of materials lacking an entered price. The values reconcile with the per-material estimated cost column in the exported shopping CSV.
A project with **zero optional border layers** now clearly states that no border materials are configured and does **not** show an invalid shopping-CSV button; adding a layer restores normal export. Non-finite, negative and overflowing purchase or cost values are rejected instead of being exported.
Automated capacity checks exercise **2,000 physical pieces across 30 independent SKU rolls** without merging any roll's coordinates or prices; this is a functional regression rather than a device-specific speed guarantee. [184 passing tests plus Chromium UI/CSV reconciliation](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41959078555); [exact-commit public deployment smoke](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41959078573).

### Keyboard focus and large-material-editing regression (2026-11-05)
The Quilt Fabric and Border editors preserve **keyboard navigation after adding or deleting material groups**. Add SKU, Add rectangle cut group and Add border layer focus and select the new entry's first editable text field. Removing a cut group, fabric SKU or border layer focuses an adjacent remaining removal control, or the corresponding Add control if the collection is now empty. Rejected or unfinished input still blocks destructive editor re-renders.

The source-controlled **Chromium keyboard test** uses real Enter key activation for every add/remove path. It also imports a **30-SKU project with 2,000 distinct physical pieces**, verifies 30 independent cut plans and all 2,000 downloadable CSV rows, and checks that the visual per-roll coordinate preview stays at 45 rows while the page reflows at 375px mobile width. This is a functional upper-limit and browser-rendering regression, **not** a guaranteed hardware performance timing SLA. [Local/browser QA](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41960658811); [real public Cloudflare keyboard QA](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41961035628). Automated axe checks do not replace manual screen-reader/keyboard user acceptance tests.

### Live editor labels and dense cutting-diagram disclosure (2026-11-05)
Fabric SKU and Border section headings now update immediately when the user commits a new color/name. The generic `Remove SKU`, `Remove cut group`, `Add rectangle cut group` and `Remove layer` buttons retain their familiar visible names while exposing material and group context through accessible descriptions. The description updates with the renamed fabric or border, preventing a screen-reader user from being left with an old material name.

For a roll containing more than **180 physical pieces**, the schematic SVG explicitly declares it is only a preview of the first 180, not an image of all pieces. The separately exported **full cut-list CSV** still includes every verified piece. Chromium exercised a 2,000-piece single dense SKU *and* a 30-SKU, 2,000-piece project. Both exported every piece; the dense SVG rendered exactly 180 and reported its bounded preview to assistive technology. [184 passing checks and real browser evidence](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41962447854); [exact-commit Cloudflare preview verification](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41962448008). No device-specific latency or physical fabric acceptance is claimed.

### Lazy material cut previews (2026-11-05)
A project may have as many as **30 independently cut fabric SKU rolls and 2,000 total fabric cuts**. On the screen, the calculator now constructs SVG and coordinate previews **only for the first expanded material**. Closed material plans retain their summary labels and computed quantities but do not allocate unnecessary SVG or preview tables until expanded. Once a roll's preview is opened it is cached until the next project calculation. This reduces initial DOM work without changing the cutting algorithm or the complete JSON/CSV exports.

For printing, `beforeprint` **synchronously** materializes all previously closed roll previews before the browser snapshots the page, then expands them; `afterprint` restores the former disclosure state. The same print-readiness gate still blocks incomplete/stale physical cutting plans.

[Local full QA 41963871015](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41963871015) verifies exactly **29 pending** previews for 30 initial rolls, only the first roll's 45 coordinate preview rows, the entire **2,000**-piece CSV, successful print-time render of all 30 roll previews, restored collapsed states and SVG-to-CSV coordinate fidelity. The one-dense-roll/2,000-cut fixture also passes. [Exact-commit public Pages QA 41963871059](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41963871059). **No device-specific interaction latency SLA is implied.**
