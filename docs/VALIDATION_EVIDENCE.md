# Quilt Studio — verification evidence and release blockers
Last verified: 2026-11-04 · tested source commit `9f4433564eb1906f03fc1ab781fce5da8a908749` · `noindex` engineering preview.

## What is actually verified
| Check | Status | Evidence / reproducible action |
|---|---|---|
| TypeScript static typing | PASS | GitHub CI https://github.com/garrison2025/Quilt_Calculator/actions/runs/41810455977 · `npm run lint` |
| Deterministic arithmetic, geometry and V2 import checks | PASS · 102 tests | Same CI · `npm test`; includes backing seam thresholds, binding strip thresholds and 2,000-piece roll-area conservation |
| Astro static build and route list | PASS | Same CI · `npm run build && node scripts/check-build.mjs` |
| Original 218-keyword source appendices and canonical intent routing | PASS (engineering mapping only) | `docs/data/V2_Keyword_Appendix_218.csv`: 202 assigned to nine distinct tool intents; 16 HOLD; not search ranking evidence |
| Published preview index protection | PASS | Static check ensures only `noindex,follow`; no preview sitemap or absolute canonical |
| Real Chromium interaction and exports | PASS | Same CI · `node scripts/browser-smoke.mjs`; 10 published routes, JSON/CSV, offline storage, multi-tab conflicts, size input and stale-export protection |
| Print layouts and responsive widths | PASS (automated scope) | Same CI, screenshot/PDF artifacts: https://github.com/garrison2025/Quilt_Calculator/actions/runs/41810455977/artifacts/13312276617 |
| Automated keyboard and basic accessibility checks | PARTIAL | Same CI: skip link, details expansion, labels and IDs; no full manual screen-reader/contrast audit |
| Physical fabric cutting / complete sewing construction | NOT_RUN | Requires independent real-fabric comparison and grain/measurement review |
| Production domain, canonical and indexing | NOT_CONFIGURED | Requires an approved domain and explicit release decision |
| AdSense, Search Console and revenue | NOT_CONFIGURED | Account/production evidence required |

## Source-workbook gaps (never substitute unrelated tests)
The supplied V2 development plan references, but does **not itself reproduce in complete machine-readable form**, these required original files:
1. `V2_Golden_Fixtures.csv`: 39 reference rows. Source worksheet not present in this repository; **original fixture execution NOT_RUN**.
2. `V2_Property_Test_Plan.csv`: 24 reference property entries. Current independent automated tests do not prove one-to-one original matrix coverage; **PARTIAL**.
3. `V2_Release_Gates.csv`: 47 original release gates. The current repo and CI provide evidence for some categories only; the exact original 47-row sign-off is **PARTIAL**.

The current `102/102` suite is real and valuable, but is *not* a substitute for `39/39`, `24/24` or `47/47` from the missing sources.

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
- Vitest **102/102 passing** and Chromium QA cover manual measurements, self-report wording, CSV isolation, clipped-point detection and re-input protections at https://github.com/garrison2025/Quilt_Calculator/actions/runs/41810455977 .
- Public Cloudflare trial page was confirmed with `noindex,follow`. Original `/square-in-a-square-calculator/` route remains 404 and the four original SQUARE keywords remain HOLD; the approved nine tools and 202 mapped keywords are unchanged.
- Independent sewn samples, point-accuracy results collected by a trusted reviewer and the original V2 CSV/verification workbook signoffs remain **NOT_RUN/PARTIAL**.
