# Original V2 47-release-gate traceability · conservative current status

**Original source:** `docs/data/reference/V2_Release_Gates_47.csv` from the user-provided workbook. The source’s 47 `NOT_RUN` cells remain unchanged; the statuses below are a **separate assessment**, not retroactive changes to the workbook. `AUTO_EVIDENCE` means code/CI evidence exists for the narrow requirement, **not** final production sign-off. `PARTIAL` means additional independent review is still required. `MANUAL_NOT_RUN`, `WAIT_DOMAIN`, `WAIT_ADS` and `WAIT_GSC` are open blockers.

Engineering CI proof: [167/167 tests + all 39 original golden cases + per-cut SVG/CSV and browser network audit](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41929120595). New original-property tests are tracked separately in [`ORIGINAL_V2_PROPERTY_COVERAGE.md`](./ORIGINAL_V2_PROPERTY_COVERAGE.md).

**Status count across all original 47 gates:** PARTIAL: 17 · AUTO_EVIDENCE: 23 · MANUAL_NOT_RUN: 1 · WAIT_DOMAIN: 1 · WAIT_ADS: 3 · WAIT_GSC: 2. Every ID is present; none has been silently omitted.

| ID | Gate | Original check | Current engineering evidence | Missing condition / rationale |
|---|---|---|---|---|
| 01 | G0 | All primary search keywords KD <=29; preserve exported dates/URLs and rank type | **PARTIAL** | 218-row keyword appendices validate KD≤29 for mapped terms; original exported date/rank-type provenance still requires comparison. |
| 02 | G0 | Brand and missing-KD keywords never targeted for page creation | **PARTIAL** | Mapped keyword list validated; brand and missing-KD rejection needs full source-level manual review. |
| 03 | G0 | Distinct HUB, FABRIC, YARD input/output and SEO copy verified | **AUTO_EVIDENCE** | Distinct 9 primary H1s, content, UI and tool routes verified in static/browser checks. |
| 04 | G0 | Bias, diagonal backing, rag quilt and unsupported WOF index policy enforced | **AUTO_EVIDENCE** | No production bias, diagonal, rag or unsupported WOF landing routes; static HOLD checks. |
| 05 | G1 | Global project schema and units conversions round trip | **PARTIAL** | Schema validation and normalized in/cm state tested; complete cross-tool roundtrip requires wider audit. |
| 06 | G1 | No implicit WOF seam double deduction | **AUTO_EVIDENCE** | Original backing seam and WOF arithmetic backed by 39 fixtures and seam-fit properties. |
| 07 | G1 | Backdrop both orientations and actual seam joint take-up verified | **AUTO_EVIDENCE** | 39-source backing orientation cases plus actual panel layout verification. |
| 08 | G1 | Binding strips account for join losses and tail allowance | **AUTO_EVIDENCE** | Original binding strip cases and additional join-loss monotonicity tests. |
| 09 | G1 | No bias method enabled without independent cut proof | **AUTO_EVIDENCE** | Bias method not advertised as available and bias HOLD route excluded. |
| 10 | G1 | Butted and mitered border outputs both separately tested if offered | **AUTO_EVIDENCE** | Only butted construction offered, verified for cut outputs; miter not offered. |
| 11 | G1 | Repeated piece layouts are physically non-overlapping | **AUTO_EVIDENCE** | Per-piece geometry verification and explicit independent nonoverlap property. |
| 12 | G1 | Different fabric colors/SKUs cannot combine usable remnants silently | **AUTO_EVIDENCE** | Fabric SKU isolation exercised in tests, shop quantities remain separate. |
| 13 | G1 | Sashing internal segments and cornerstones verified | **AUTO_EVIDENCE** | Grid segment/stone tests and 3 original SASH reference fixtures. |
| 14 | G1 | Batting roll fit must be physically possible | **AUTO_EVIDENCE** | Single-piece batting fit against measured roll width, impossible cuts blocked. |
| 15 | G1 | Square-in-square uses construction-method-specific seam allowances | **PARTIAL** | Square lab has sewing-method-specific parameters and a user self-report, but independent sewing sample NOT_RUN. |
| 16 | G1 | WOF equivalent-area not labelled as safe cut-fit | **AUTO_EVIDENCE** | Area equivalents explicitly disclaim proof of cut fit and require geometry check. |
| 17 | G1 | Purchase rounding done once after raw calculation | **AUTO_EVIDENCE** | Purchase computed from exact cutting run and upward rounding (once). |
| 18 | G1 | Directionality and prewash shrinkage do not yield false positive fit | **PARTIAL** | Directional grain tests exist; shrinkage and fit interactions need broader audit. |
| 19 | G1 | Zero/negative/NaN/overflow/invalid mixed fraction handled | **AUTO_EVIDENCE** | Reject malformed fractions, NaN, non-positive dimensions and invalid imports. |
| 20 | G1 | Test golden fixtures and property-based scenarios with real engine | **PARTIAL** | 39 original reference records pass; 20/24 property IDs automated, 4 remain partially/manual blocked. |
| 21 | G1 | Reference fixture results recorded separately from engine PASS | **AUTO_EVIDENCE** | Original reference_status and original NOT_RUN preserved, current CI evidence separated. |
| 22 | G2 | Result breakdown lists raw, buy, offcuts, unallocated margin separately | **PARTIAL** | Raw purchase, rounded amount and offcuts shown, additional offcut classification signoff needed. |
| 23 | G2 | Desktop and mobile 360/390/768/1280/1440 tested in browser | **AUTO_EVIDENCE** | Chromium viewport tests and screenshot artifacts cover many requested dimensions. |
| 24 | G2 | Inputs accessible keyboard-only and error text announced | **PARTIAL** | Keyboard skip/FAQ/error text tests present; full manual screen-reader audit incomplete. |
| 25 | G2 | Shared project state never silently mixes old fabric settings | **PARTIAL** | Browser state conflicts and stale result invalidation checked; full cross-tool consistency audit partial. |
| 26 | G2 | Print and original SVG labels match live results | **PARTIAL** | SVG/print functional checks present but every coordinate label not independently cross-audited. |
| 27 | G2 | 1:1 template vs scaled diagram visibly distinguishable | **AUTO_EVIDENCE** | Print and UI explicitly say drawings are schematic, not 1:1 templates. |
| 28 | G2 | Physical print dimension calibration verified at 100% scale | **MANUAL_NOT_RUN** | Requires printing calibrated line on real paper at actual 100% scale, then physical ruler measurement. |
| 29 | G2 | Reduced-motion preference and no sticky banner obstruction | **PARTIAL** | Reduced-motion tested; sticky-banner obstruction requires complete manual UX sweep. |
| 30 | G2 | JSON exports/imports round trip; version mismatch handled | **AUTO_EVIDENCE** | V2 project import and schema version mismatches tested, JSON recovery smoke exists. |
| 31 | G3 | Raw HTML includes visible unique calculator description, H1, title | **AUTO_EVIDENCE** | Static HTML H1/title/meta unique for approved tools. |
| 32 | G3 | Unique preview image as static img src with width height alt | **PARTIAL** | All approved pages have preview images with alt and sizes; uniqueness/artistic review pending. |
| 33 | G3 | Standalone pages have distinctive examples and original cut diagrams | **PARTIAL** | Unique educational examples and independent diagrams exist; thorough editorial signoff partial. |
| 34 | G3 | All pages have 1 primary intent and canonical; no duplicate suffix pages | **PARTIAL** | One intent per page checked; production canonical awaits owned domain and release flag. |
| 35 | G3 | Preview pages.dev noindex via HTML/meta or X-Robots-Tag | **AUTO_EVIDENCE** | Cloudflare Pages preview robots noindex verified and build enforces it. |
| 36 | G3 | Final production URL/canonical is owned domain; none are placeholders | **WAIT_DOMAIN** | No user-approved owned production domain; cannot verify production canonical. |
| 37 | G3 | Sitemap excludes HOLD, utility and unbuilt pages | **PARTIAL** | Preview sitemap absent; production HOLD list exclusions checked in build script, production deploy pending. |
| 38 | G3 | Breadcrumb and hub/internal links pass crawler audit | **PARTIAL** | Internal links checked; production Breadcrumb JSON-LD waits final canonical domain. |
| 39 | G3 | Schema reflects actual WebApplication behavior and no invented reviews | **AUTO_EVIDENCE** | WebApplication JSON-LD is present without fake review/rating claims. |
| 40 | G3 | No fake author, operator, testimonials or daily updated dates | **PARTIAL** | No known fabricated operator/rating; complete copy audit still manual. |
| 41 | G4 | Cloudflare static build passes with no paid API/backend | **AUTO_EVIDENCE** | Cloudflare static preview and CI succeed with no paid runtime API. |
| 42 | G4 | Network check confirms private project data is not uploaded | **AUTO_EVIDENCE** | Chromium now fails CI on any third-party HTTP(S) request or non-read HTTP method across calculations, JSON imports, exports, storage failure, mobile and print. CI 41929120595 confirms local-only tested preview behavior; future ads/analytics/production network behavior must be audited separately. |
| 43 | G4 | Privacy and consent statements match real ads/network/storage | **WAIT_ADS** | Ads/consent configuration not yet approved; no production ads deployed. |
| 44 | G4 | Ad slots do not cause accidental clicks or cover print/compute | **WAIT_ADS** | No production ad slots yet; layout/accidental-click review pending. |
| 45 | G4 | Ads.txt AdSense and consent check only after relevant approval | **WAIT_ADS** | AdSense approval/consent/ads.txt dependent on future account and domain. |
| 46 | G4 | Real GSC baseline after verified production domain | **WAIT_GSC** | Requires real Search Console baseline after owning and verifying production domain. |
| 47 | G4 | 28/90 day GSC review non-brand clicks/CTR/indexing, not Semrush revenue | **WAIT_GSC** | Needs actual 28/90-day Search Console observations after indexing; cannot pretest. |

## Release policy

Do not enable production indexing or describe the original G0–G4 gate set as fully complete. Physical printing, sewn Square-in-a-Square samples, accessibility review, owned production domain, optional ad setup and future Search Console measurements require actions not proven by the automated suite. 


### P21 / P24 engineering evidence (2026-11-05)
- Added a live Chromium P21 navigation test to establish that the same native-inch measurements, display-unit setting, SKU label, rectangle count and Project V2 JSON persist across eight route transitions, with abandoned input drafts excluded.
- Added an explicitly **print-only** 1 × 1 inch reference square and a 100 mm reference line on each approved print plan. Chromium verifies their CSS physical units under print media, and generated PDFs include them. **A real ruler measurement of actual 100%-printed paper is still NOT_RUN**. Both cutting illustrations and any future paper templates remain schematic until separately validated.

### Automated WCAG A/AA evidence for UI gates (2026-11-05)
- [CI 41933804432](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41933804432) adds 15 successful axe-core automated A/AA scans (11 desktop, three 375px mobile, one dark theme), retaining 167/167 math/property/unit checks and existing browser functionality. Actual low-contrast text and an accessible-name mismatch were corrected in the source rather than excluding rules.
- Manual screen-reader/keyboard-only sessions, complex focus handling, all 400% zoom settings, touch hardware, and physical print-ruler measurement remain unverified. This is new **scoped automation evidence**, not a reclassification of every human-acceptance G2 gate as PASS. Original 47 rows and their historical statuses have not been rewritten.

### G2 keyboard error recovery / 320px reflow supplementary evidence (2026-11-05)
- [CI 41934908400](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41934908400) shows actual browser behavior: when an input is rejected, clicking Update returns focus to the invalid field (including an associated screen-reader error/help description); fixing the value allows current results and exports again. On small screens an intentional successful recalculation focuses the results landmark.
- Five approved representative routes pass the **320 CSS-pixel reflow proxy** with no whole-page horizontal overflow. This is not the same as 400% actual browser zoom, screen-reader operation, full WCAG conformance signoff or physical touch testing. Human-accessibility gates remain **PARTIAL** and original historical 47 `NOT_RUN` statuses remain untouched.

### G25 and G24: accepted project vs unfinished draft safeguards (2026-11-05)
- The browser editor guards cross-tool project operations that would destroy an unfinished or invalid input before it becomes part of an accepted V2 project. Guarded operations include reset/undo, unit change, project import/load and dynamic cut-material add/remove; asynchronous import rechecks before replacing the project.
- Browser evidence [CI 41939510752](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41939510752) covers rejected draft plus reset/units/import and fabric/border add/remove, followed by a successful correction and autosave. G24/G25 remain **PARTIAL** because manual assistive-tech sessions and all cross-tool real-world behaviors have not been signed off. The 47 original historical source statuses remain unchanged.

### Independent manual print-test worksheet ready (2026-11-05)
- Original gate ID 28 (G2 actual paper scale) remains **MANUAL_NOT_RUN**, but a dedicated QA-only `/qa/print-calibration/` page and `docs/qa/PRINT_SCALE_PHYSICAL_SIGNOFF.md` now provide a reproducible physical test procedure and measurement record. No changes to the original 47-row workbook.
- [Local CI 41953819230](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41953819230) and [public Pages CI 41953819293](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41953819293) verify one-inch, 100-mm and six-inch nominal CSS print geometry, published noindex and no added SEO routes. A generated PDF is a test artifact but **not** a replacement for printing and ruler measurement. The manual gate, other real-fabric/square-lab checks, domain, AdSense and GSC remain open.

### G2/P21: asynchronous JSON import and cross-tab conflict safety (2026-11-05)
- [CI 41955969336](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41955969336) verifies a deliberately stalled `File.text()` import cannot replace newer accepted same-tab edits or another tab's fresh autosave, and an uncontested delayed import still succeeds. This strengthens original gate 25 (G2 shared-state consistency) without changing its **PARTIAL** classification or any untouched historical source gate.
- [Cloudflare Pages CI 41955969436](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41955969436) confirms the latest source is actually deployed and the live public planner still supports normal imports/exports. No human hardware tests, domain indexing or ad/GSC work is inferred.
