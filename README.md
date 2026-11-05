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
