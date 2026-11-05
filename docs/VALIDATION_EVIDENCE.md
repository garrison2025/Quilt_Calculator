# Quilt Studio — verification evidence and release blockers
Last verified: 2026-11-05 · quilt-top missing-cut completeness and JSON readiness CI `41946828113` · `noindex` engineering preview.

## What is actually verified
| Check | Status | Evidence / reproducible action |
|---|---|---|
| TypeScript static typing | PASS | GitHub CI https://github.com/garrison2025/Quilt_Calculator/actions/runs/41931472782 · `npm run lint` |
| Deterministic arithmetic, geometry and V2 import checks | PASS · 175 tests | Same CI · `npm test`; includes backing seam thresholds, binding strip thresholds and 2,000-piece roll-area conservation |
| Astro static build and route list | PASS | Same CI · `npm run build && node scripts/check-build.mjs` |
| Original 218-keyword source appendices and canonical intent routing | PASS (engineering mapping only) | `docs/data/V2_Keyword_Appendix_218.csv`: 202 assigned to nine distinct tool intents; 16 HOLD; not search ranking evidence |
| Published preview index protection | PASS | Static check ensures only `noindex,follow`; no preview sitemap or absolute canonical |
| Real Chromium interaction and exports | PASS | Same CI · `node scripts/browser-smoke.mjs`; 10 published routes, JSON/CSV, offline storage, multi-tab conflicts, size input and stale-export protection |
| SVG cut-rectangle fidelity (P23 engineering scope) | PASS · rendered pieces | Every rendered physical cut rectangle checked against separately downloaded CSV and independent SVG coordinate math for 9 cutting pages; full export remains complete beyond displayed first 180 |
| Browser network privacy (G42 preview scope) | PASS · current code | No third-party HTTP(S) and no non-GET/HEAD requests across calculator/edit/import/export/print/mobile; future ads or production integrations must be re-tested |
| Cross-tool project continuity (P21, engineering) | PASS · tested journey | Chromium follows backing → binding → batting → hub → fabric → yardage → backing → hub; native-inch values, cm display, SKU/quantity edits, abandoned draft and downloaded JSON remain consistent |
| Print physical-unit ruler aids (P24, digital scope only) | PASS · browser CSS / PDF | Print-only 1 in × 1 in square and 100 mm line verified for CSS physical dimensions; **actual ruler measurement on paper is NOT_RUN** |
| Print layouts and responsive widths | PASS (automated scope) | Same CI, screenshot/PDF artifacts: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41931472782/artifacts/13371074036 |
| Automated WCAG 2.0/2.1/2.2 A/AA (axe-core) | PASS · automated scope only | 15 Chromium scans: 11 desktop routes including the noindex Square lab, three 375px mobile views and one dark-mode view; **zero reported rule violations** in [CI 41933804432](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41933804432). JSON report in workflow artifacts. |
| Input error focus and field help (automated) | PASS · focused journey | Recalculate with an invalid measurement returns focus to the error field; role=alert error is associated by aria-describedby along with field-specific help; correcting error restores valid exports. [CI 41934908400](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41934908400). |
| 320 CSS-pixel reflow proxy | PASS · five routes | Homepage, project hub, backing, fabric and yards conversion have no whole-document horizontal overflow at 320 CSS px; mobile Update also focuses the results landmark. **A true 400% browser zoom check remains unverified.** |
| Manual screen-reader, real browser zoom and real-device accessibility | PARTIAL / NOT_RUN | Automated scans can have incomplete or untestable findings; at least one item per tested page still requires human review. VoiceOver/NVDA, keyboard-only full journeys, true 200–400% zoom and real touch interaction not independently signed off. |
| Physical fabric cutting / complete sewing construction | NOT_RUN | Requires independent real-fabric comparison and grain/measurement review |
| Production domain, canonical and indexing | NOT_CONFIGURED | Requires an approved domain and explicit release decision |
| AdSense, Search Console and revenue | NOT_CONFIGURED | Account/production evidence required |

## Recovered original V2 source workbooks — current independent evidence

The original user-supplied `Quilt_V2_Research_and_Build.xlsx` **was located and examined**. The exact 39-case, 24-property and 47-release-gate worksheet records are now preserved in `docs/data/reference/` with original historical `NOT_RUN` cells intact. [Workbook provenance](./data/reference/ORIGINAL_SOURCE.md).

| Original V2 source set | Current outcome | Verification record |
|---|---|---|
| 39 original Golden reference records | **39/39 current-engine reference assertions passed**; this includes HOLD-policy cases, not validated physical cutting | [Original Golden replay](../tests/original-v2-golden.test.ts), [CI 41813177924](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41931472782) |
| 24 original property IDs | **20/24 have dedicated automated ID-mapped tests passing**; P21/P23 now have additional complete-scenario Chromium checks, while P19 remains partial and P24 requires physical calibrated paper measurement | [Property crosswalk](./qa/ORIGINAL_V2_PROPERTY_COVERAGE.md) |
| 47 original G0–G4 release gates | All 47 mapped in a conservative separate evidence register: 23 have scoped automation evidence, 17 partial, 1 manual NOT_RUN, 1 awaiting domain, 3 awaiting ads, 2 awaiting GSC | [47-gate status register](./qa/ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md) |
| Original source/parsed fixture parity | Four automated source-integrity tests check exact row/column counts, all 39 JSON fixture records, and preserved historical statuses | [Source-integrity suite](../tests/original-v2-source-integrity.test.ts) |

The first original replay identified a genuine zero-quantity yardage display discrepancy (`YARD-04`: 0 cuts but theoretical row capacity 43). The engine was corrected **without changing the original expected value**; the subsequent 39-case and full browser CI passed.

**Important distinction:** current-engine reference agreement does not certify real-world sewing, cross-tool accessibility, 100%-scale printed physical dimension, domain/production indexing, advertiser consent or future Google Search Console performance.

## Functionality scope
Only these are calculated with checked physical layouts: joined rectangular backing panels, straight-grain binding, unpieced butted borders, rectangular fabric SKUs, single-piece batting and grid sashing. Bias binding, diagonal backing, mitered border corners, rag quilt, Square-in-a-Square and WOF-area-equivalent purchase estimates remain HOLD. A schematic PDF is not a full-size pattern.

## Evidence rules for future release
- Never mark a gate PASS solely because the webpage exists; cite a test, artifact, real material check or actual release deployment.
- Keep preview `noindex,follow` until a custom domain and authorization are available. Do not enable `PUBLIC_INDEXABLE=1` on `.pages.dev`.
- Do not claim Search Console clicks, search rankings or AdSense approval based on automated tests or keyword mappings.
- Use `npm ci && npm run lint && npm test && npm run build && node scripts/check-build.mjs` before any production release.

## Numerical edge-fit gate (2026-11-04)
- WOF placement and overlap checks use scale-specific IEEE-754 slack instead of a fixed physical `1e-8` inch allowance. New tests check one oversize piece, rows that would barely exceed roll width, sub-`1e-8` physical overlaps, and exact decimal boundaries. This improves mathematical fit classification only; independent real cutting is still not certified.

- Nearly-square directional exception: allow 90° grain rotation whenever the two cut dimensions differ, even below 1e-8 inch. This prevents wrongly rejecting a permitted rotated fit at the WOF boundary. Automated cases verify both rotation-disabled failure and rotation-enabled success.


## Square-in-a-Square isolated lab: source formula vs physical evidence (2026-11-04)
- `/lab/square-in-square/` now includes an **explicitly user-entered** one-practice-block check: measured unfinished width/height and four center-point-to-trimmed-raw-edge distances.
- Arithmetic check targets: finished outside size + 1/2 inch, and each center point 1/4 inch inside its closest raw edge. The ±1/16 inch screening tolerance is the worksheet's assumption, not universal sewing guidance. Missing or malformed values cannot pass; edits invalidate saved screening results.
- The separately downloadable audit CSV states `USER-REPORTED` and `NOT INDEPENDENTLY CERTIFIED`. The main mathematical cut sheet and the physical self-report are deliberately separate. The laboratory never grants itself a production certification.
- Vitest **102/102 passing** and Chromium QA cover manual measurements, self-report wording, CSV isolation, clipped-point detection and re-input protections at https://github.com/garrison2025/Quilt_Calculator/actions/runs/41931472782 .
- Public Cloudflare trial page was confirmed with `noindex,follow`. Original `/square-in-a-square-calculator/` route remains 404 and the four original SQUARE keywords remain HOLD; the approved nine tools and 202 mapped keywords are unchanged.
- Independent sewn samples, point-accuracy results collected by a trusted reviewer and the original V2 CSV/verification workbook signoffs remain **NOT_RUN/PARTIAL**.

## Original P21/P24 continuation · 2026-11-05
- A separate browser context traversed the approved tools and verified that switching in/cm only changes display units, native inch dimensions remain stable, SKU and quantity edits persist, and discarded draft inputs never silently overwrite the saved project. Exported V2 JSON agrees with the final saved source. Evidence: [CI 41931472782](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41931472782).
- All approved tool printouts now include a print-only **1 × 1 inch square** and a **100 mm horizontal reference line**. CSS pixel equivalents were independently measured in Chromium print media, and a PDF screenshot artifact was generated. The printed document explicitly says Actual size / 100%, no fit/shrink and verify with a ruler.
- A **real printed page with a physically measured 1 in square and 100 mm line** has not been provided or tested. Original P24 remains **NOT_RUN (paper)**; do not misinterpret digitally correct CSS dimensions as calibrated printer output or 1:1 SVG cutting templates.

## WCAG accessibility improvements (2026-11-05)
- Added free open-source `axe-core` to the **CI-only** Chromium dependency install. This package does not ship in production. The 15 WCAG 2.0, 2.1 and 2.2 A/AA scans cover the 10 approved routes and 1 experimental Square page in default light desktop presentation, plus three 375px mobile views and one dark calculator view.
- Initial scans correctly identified low contrast on small muted text in the header, project forms, shopping metrics, table headings, educational content and dark CTA/button labels. The original brand link also violated accessible-name matching. After actual CSS/ARIA improvements, all 15 included scans reported **zero axe rule violations** at [run 41933804432](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41933804432).
- The automated report is attached as `axe-wcag2a-aa-audit.json` to GitHub browser QA artifacts; check `incomplete` items before any final WCAG claim. Automated checks cannot certify assistive-technology usability, keyboard workflows under all modal/error states, 200%/400% zoom, actual phone touch targets or real sewing/print calibration. Keep the original manual gate **PARTIAL**.

## Reversible reset and cross-tab data safety (2026-11-05)
- The **Reset** control now checks the latest localStorage revision before discarding the in-memory project. If another tab has saved a different revision, Reset is canceled and the current tab keeps its accepted input. The user can export the local JSON or deliberately load the latest saved version.
- After a successful Reset, the **Undo reset** button restores the prior accepted V2 project and local browser backup. Undo is available only until the next accepted edit/import/units change and is deliberately single-use; this is not a persistent version history, and uncommitted typing drafts are not covered.
- [CI 41936960193](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41936960193) passed **167/167** unit/property checks and real Chromium tests verifying stale-tab data retention, Undo restoration, JSON storage consistency and invalidation after new edits. The first implementation also surfaced a real WCAG 2.5.3 label/content mismatch on the new Undo button; this was corrected and all **15 axe scans** passed on rerun.
- Preview remains noindex; neither the nine approved tools nor the 202 mapped / 16 HOLD keyword allocation changed.

## Follow-up: error focus and narrow reflow (2026-11-05)
- [Source commit 72ad7f0](https://github.com/garrison2025/Quilt_Calculator/commit/72ad7f06b7120685626e13326a32262005267392), [CI 41934908400](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41934908400) passed the 167 core checks and the updated Chromium suite. An invalid edit plus Update now focuses the affected input, exposes an associated live field error and inline help, keeps old exports disabled, and re-enables exports only after the value is committed and valid.
- Reflow assertions at **320 CSS px** passed on five representative pages without document-level horizontal overflow; mobile Update focuses the `#results` landmark on successful recalculation. These are browser-automated acceptance cases and do not prove native OS/browser 400% zoom, touch hardware use or NVDA/VoiceOver behavior.
- Previous 15 axe-core WCAG A/AA scans remained passing. Original 47-gate current status group counts have **not** been upgraded; manual accessibility signoff remains PARTIAL.

## Project editor draft preservation · 2026-11-05
- A text/number field that has changed but not been accepted (or has failed V2 validation) must not disappear when the user clicks Reset, Undo reset, switches units, loads the saved project, imports JSON, or adds/deletes a fabric SKU, cut group or border layer. The first invalid/pending input is focused and the accepted browser project remains intact. The import handler rechecks after awaiting file contents.
- Actual Chromium regression in [CI 41939510752](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41939510752) verifies invalid draft retention and unchanged localStorage for reset, cm/in selection, import attempt, fabric SKU add/remove and border add/remove; then it verifies corrected values autosave again and that reset/undo remains reversible. Unit tests and the original source workbooks were not modified. This is UI safety evidence, not completion of all manual cross-browser accessibility gates.

## One-way directional fabric and rotation independence · 2026-11-05
- The approved Fabric Yardage route now has distinct optional `yardage.allowRotate` and `yardage.oneWayPrint` constraints in Project V2. A directional material cannot be rotated for purchasing, even if its stored allow-rotation setting is checked; both current and alternate WOF scenarios enforce the same rule in the shared math engine.
- Existing exported Project V2 JSON files lacking these optional fields still import with their legacy `options.allowRotate` fallback. Fabric-specific rotation changes no longer alter the one-piece batting rotation setting; backing orientation retains its separate `options.oneWayPrint` setting.
- [CI 41940484000](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41940484000): **169/169 Vitest assertions** across nine suites plus browser screenshots/network, exported CSV grain rotation 90° vs 0°, 25 in vs 30 in actual-current-roll comparison, persistence across page navigation and the existing noindex and 218-keyword gates. This is automated geometry/grain logic evidence, **not** independent proof that printed fabric motifs are visually aligned during real sewing.

## Project-level material feasibility and purchase-safe exports · 2026-11-05
- Project Planner and the standalone batting tool now pass the same `options.allowRotate` flag to the single-piece batting engine. An actual 108 × 58 in cut on 65-in usable roll is infeasible unrotated, then feasible as 58 × 108 in with grainRotationDeg=90° and 3 yd required in both tool CSVs. Both tools share the saved browser Project V2 state.
- On projects with any impossible physical roll, the shopping list shows an explicit incomplete status and the exported sheet marks each impossible material without fabricated quantity/cost. A partial CSV filename begins with `quilt-studio-INCOMPLETE`. Full physical cut CSV and the built-in Print-plan action are disabled until every present material has a feasible layout. Diagnostic JSON remains available.
- [CI 41941616100](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41941616100) passed 173/173 tests across 10 suites, 10 published route browser checks, one isolated hub/batting grain-parity scenario, partial purchasing CSV and corrected fabric SKU recovery. Real paper measurement, material grain inspection by a quilter, and actual sewing remain NOT_RUN.

## Browser-level printing of incomplete or stale cutting plans · 2026-11-05
- [CI 41944674495](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41944674495): TypeScript PASS, **173/173** unit/property tests PASS, Astro build and preview index protection PASS, Chromium browser regression PASS.
- In browser **print media**, an infeasible 65-in batting roll without permitted rotation and a rejected draft measurement both set `data-print-ready=false` and the entire cutting/shopping result subtree computes to `display:none`; the print-only header states `NOT A CUT-READY PLAN`. The smoke test also creates a real PDF for the blocked state. A valid project still prints its coordinates, and the valid length-only yard conversion remains printable.
- The site's disabled Print button alone is not treated as a Ctrl+P safeguard. This CSS rule is deliberately independent of the browser print event and applies before hydration. This is digital print safety evidence **not** an actual-size quilt pattern, physical paper calibration, or independent human construction audit.

## Not-planned quilt-top materials vs impossible cuts · 2026-11-05
- [CI 41946828113](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41946828113) confirms **175/175** automated tests and successful cross-route Chromium regression. An empty fabric SKU array is not mistaken for 0-yard total quilt-top fabric: the hub's shopping list explicitly says `NOT PLANNED`, retains partial backing/batting/binding estimates, and disables complete cut-list CSV and print actions (including browser Ctrl+P). A SKU with only zero-count cuts behaves likewise. A physically impossible cut is separately labeled `FIT IMPOSSIBLE`.
- A diagnostic `INCOMPLETE` shopping CSV retains a missing-fabric row using `NOT_PLANNED_NO_CUT_PIECES`; each impossible roll instead uses `FIT_IMPOSSIBLE_NOT_PURCHASE_READY`. No made-up zero-yard purchase or total material cost is recorded.
- The calculation JSON export includes explicit, test-verified `readiness` metadata and scopes, preserving full empty-fabric `result:[]` and flagging non-purchasable/incomplete projects. After real cut groups are entered, the status and normal export/print flags revert together. This verifies the **entered-material** model only; actual quilt-top completeness is user-provided and not inferred from the finished quilt width/height.
- Original 39 reference fixtures, keyword routing and strict noindex preview policy were not changed. Independent fabric cutting, human printing measurements, accessibility/device testing, approved domain and advertising setup remain outstanding.
