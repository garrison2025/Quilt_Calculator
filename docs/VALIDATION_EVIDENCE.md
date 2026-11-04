# Quilt Studio — verification evidence and release blockers
Last verified: 2026-11-04 · source replay and property evidence from CI `41813177924` · `noindex` engineering preview.

## What is actually verified
| Check | Status | Evidence / reproducible action |
|---|---|---|
| TypeScript static typing | PASS | GitHub CI https://github.com/garrison2025/Quilt_Calculator/actions/runs/41813177924 · `npm run lint` |
| Deterministic arithmetic, geometry and V2 import checks | PASS · 167 tests | Same CI · `npm test`; includes backing seam thresholds, binding strip thresholds and 2,000-piece roll-area conservation |
| Astro static build and route list | PASS | Same CI · `npm run build && node scripts/check-build.mjs` |
| Original 218-keyword source appendices and canonical intent routing | PASS (engineering mapping only) | `docs/data/V2_Keyword_Appendix_218.csv`: 202 assigned to nine distinct tool intents; 16 HOLD; not search ranking evidence |
| Published preview index protection | PASS | Static check ensures only `noindex,follow`; no preview sitemap or absolute canonical |
| Real Chromium interaction and exports | PASS | Same CI · `node scripts/browser-smoke.mjs`; 10 published routes, JSON/CSV, offline storage, multi-tab conflicts, size input and stale-export protection |
| Print layouts and responsive widths | PASS (automated scope) | Same CI, screenshot/PDF artifacts: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41813177924/artifacts/13313297030 |
| Automated keyboard and basic accessibility checks | PARTIAL | Same CI: skip link, details expansion, labels and IDs; no full manual screen-reader/contrast audit |
| Physical fabric cutting / complete sewing construction | NOT_RUN | Requires independent real-fabric comparison and grain/measurement review |
| Production domain, canonical and indexing | NOT_CONFIGURED | Requires an approved domain and explicit release decision |
| AdSense, Search Console and revenue | NOT_CONFIGURED | Account/production evidence required |

## Recovered original V2 source workbooks — current independent evidence

The original user-supplied `Quilt_V2_Research_and_Build.xlsx` **was located and examined**. The exact 39-case, 24-property and 47-release-gate worksheet records are now preserved in `docs/data/reference/` with original historical `NOT_RUN` cells intact. [Workbook provenance](./data/reference/ORIGINAL_SOURCE.md).

| Original V2 source set | Current outcome | Verification record |
|---|---|---|
| 39 original Golden reference records | **39/39 current-engine reference assertions passed**; this includes HOLD-policy cases, not validated physical cutting | [Original Golden replay](../tests/original-v2-golden.test.ts), [CI 41813177924](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41813177924) |
| 24 original property IDs | **20/24 have dedicated automated ID-mapped tests passing**; P19/P21/P23 partial, P24 requires physical calibrated paper measurement | [Property crosswalk](./qa/ORIGINAL_V2_PROPERTY_COVERAGE.md) |
| 47 original G0–G4 release gates | All 47 mapped in a conservative separate evidence register: 22 have scoped automation evidence, 18 partial, 1 manual NOT_RUN, 1 awaiting domain, 3 awaiting ads, 2 awaiting GSC | [47-gate status register](./qa/ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md) |
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
- Vitest **102/102 passing** and Chromium QA cover manual measurements, self-report wording, CSV isolation, clipped-point detection and re-input protections at https://github.com/garrison2025/Quilt_Calculator/actions/runs/41813177924 .
- Public Cloudflare trial page was confirmed with `noindex,follow`. Original `/square-in-a-square-calculator/` route remains 404 and the four original SQUARE keywords remain HOLD; the approved nine tools and 202 mapped keywords are unchanged.
- Independent sewn samples, point-accuracy results collected by a trusted reviewer and the original V2 CSV/verification workbook signoffs remain **NOT_RUN/PARTIAL**.
