# Quilt Calculator — software acceptance decision (2026-11-06)

**Decision: PASS — SOFTWARE SCOPE ACCEPTED.** The project owner expressly chose **automated software acceptance as the acceptance criterion for this stage**. A physical 2×2 fabric sample, actual sewing, physical print-ruler calibration and independent fabric sign-off are **not prerequisites for this software-scope acceptance**. This decision supersedes earlier recommendations to hold the software project open pending a real fabric specimen; it does not rewrite the outcomes of tests that were not run.

## What has been accepted

- **Nine approved calculator intents** and the shared Project Planner: quilt backing, straight-grain binding, butted borders, fabric yardage, multi-SKU quilt fabric, yards/inches conversion, one-piece batting and sashing, with the planner exposed at the hub and homepage.
- **Software arithmetic and data safety:** the current code's deterministic geometry and feasibility logic, physical cutting-list coordinates as modeled outputs, per-material purchase arithmetic, Project V2 JSON import/export and browser-only state safety. The optional physical-audit **software** calculations have test coverage, but their user-entered measurements are not independently verified.
- **Browser engineering checks:** local calculation interactions, invalid-input and stale-export guards, CSV/JSON downloads, mobile-viewport/touch emulation, CSS/print mode, noindex preview and automated accessibility rules within the tested scope.
- **SEO/GEO engineering implementation for the approved preview:** nine unique calculator intents, the original 218-row keyword research table preserved as historical input, nonbrand operational routing, accessible static guides, structured metadata and explicit unsupported-keyword HOLD rules. This is **implementation acceptance, not a statement of ranking, current SERP coverage or traffic**.

### Evidence for the accepted software revision

| Evidence | Verified status | Exact record |
|---|---|---|
| Accepted software baseline on main | `65c27902d555000899f9b1e11de235c3ba3006b2` | [Source revision](https://github.com/garrison2025/Quilt_Calculator/commit/65c27902d555000899f9b1e11de235c3ba3006b2) |
| Automated mathematical, property, import, audit and safety tests | **PASS — 271/271 across 21 files** on PR #18 head; subsequently squash-merged, with no logic changes afterward | [Successful PR-branch quality run 42174225921](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174225921) · [PR #18](https://github.com/garrison2025/Quilt_Calculator/pull/18) |
| Static build and safe preview routing, noindex and HOLD enforcement | **PASS** on same PR-branch workflow | [Quality run 42174225921](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174225921) |
| Real Chromium browser workflows, actual page interactions, downloads, mobile/print previews | **PASS** on same PR-branch workflow | [Quality run 42174225921](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174225921) |
| Simulated WebKit iPhone and Chromium mobile touch behavior | **PASS**, simulated devices only | [Quality run 42174225921](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174225921) |
| Exact-main Cloudflare Pages deployment | **PASS** for `65c27902` | [Cloudflare deployment check](https://github.com/garrison2025/Quilt_Calculator/commit/65c27902d555000899f9b1e11de235c3ba3006b2/checks) |
| Exact-main public-preview smoke | **PASS** | [Public-preview run 42174927178](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174927178) |
| Separate main-branch mobile-lab job | **PASS** | [Mobile-lab run 42174927256](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174927256) |
| Separate main-branch full quality rerun | **IN_PROGRESS at decision-time verification; do not claim PASS** | [Main quality run 42174927311](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42174927311) |

**Interpretation:** this is a user-authorized project-level **software acceptance**, based on the passed same-code PR quality suite plus live-deployed main and public/mobile checks. The separate main quality rerun has not been represented as complete if its CI status is still in progress. If it eventually fails, triage that failure as a reproducible software regression and revise this decision if material.

## Explicitly outside this acceptance criterion

- **Physical tests**: real fabric cutting, eight physical seam-edge readings for a 2×2 patch, sewn-block measurements, printed-paper ruler-scale calibration, independent physical signature, and real hardware/screen-reader testing. The underlying forms/protocols continue to say `MANUAL_NOT_RUN` or `NOT_SIGNED_OFF`, as applicable; they are **not software-release blockers** for the accepted scope. Do not forge measurements or flip evidence fields such as `quiltCuttingApproval:false` and `independentPhysicalVerification:false`.
- **Unsupported methods remain HOLD**: bias binding, diagonal backing, mitered border methods, rag quilts and the noindex experimental Square-in-a-Square cutting lab cannot be marketed as verified sewing methods. Software acceptance covers only documented supported algorithms, not physical correctness claims outside the defined model.
- **Production search launch**: no custom domain has been purchased or authorized for this project. The current `https://quilt-calculator-566.pages.dev/` remains `noindex`, without a production canonical/sitemap. Indexing, host-based canonical safety, actual GSC data, ads/consent and earnings are separate later-stage requirements and must never be called completed by this acceptance.
- **Original V2 source gate tracing**: the 39 golden reference cases and current software tests are separate from the original 24-property/47-gate research workbook. Its open `PARTIAL`, `MANUAL_NOT_RUN`, `WAIT_DOMAIN`, `WAIT_ADS` and `WAIT_GSC` records remain truthful; none are retroactively converted to 47/47 PASS.

## Operational decision

**Software development milestone: CLOSED / ACCEPTED.** Do not repeatedly require the 2×2 physical sample as a precondition to calling Quilt Calculator's software complete. Future code work should be justified by an actual reproducible bug, a new user requirement or a separately authorized domain/public-indexing launch. The software is a tested calculator, not a certified physical cutting or sewing product.

**Website deployment stage: NOINDEX PREVIEW.** Custom-domain launch and real-world operating data remain separately pending, without negating software acceptance.
