# Continuous Bias Tube — User-Entered Physical Specimen Audit Gate

Date: 2026-11-07

## Release classification

**Software evidence workbook, NOT real-world specimen validation.** The new `/lab/continuous-bias-physical/` route is strictly `noindex,follow`. It has no canonical and no WebApplication JSON-LD. It cannot mark physical yield certified and cannot issue purchasing quantities. It does not change any approved straight-grain binding calculator.

No real fabric, prewash, sewing, cut or ruler measurement has been performed by ChatGPT or the project in this work. All actual measurements are blank on first load. The three known models (A: 30in square/2.5in strip, B: 24in/2.25in, C:18in/2in, all at a=0.25in) remain precisely the mathematical specimen configurations specified in `CONTINUOUS_BIAS_TUBE_PHYSICAL_SPECIMEN_PROTOCOL_20261107.md`, not observed outcomes.

## Observational method

For each of three independent samples, the human operator must enter real observations:

1. Material description, prewash state, separate operator code and ruler-photo evidence references; references are NOT uploaded or checked.
2. **Predeclared** tolerance limits for square size, both sewing allowances, tip overhangs, first face geometry, mark mismatch, final strip width and length-ledger closure. A user statement about predeclaration is not authenticated.
3. Both measured source-square dimensions, actual post-trim usable fabric width and **five sampled actual seam allowances** on each independent seam.
4. Both physical first-seam tip overhangs, sewn parallelogram long edge and perpendicular height after pressing.
5. Actually observed complete lanes, **N−1** tube seam crossings, maximum mark mismatch and the measured per-band tube run. The operator must confirm both pressed-open seams and one-layer cut continuity.
6. **Twelve distinct width readings** (start, end and distributed points including tube seam crossing positions where possible), raw continuous strip length, length-equivalent trims at both ends, and finished un-stretched strip length at its center and along both edges.

The current exact numerical 2D engine is reused for predicted bands, both sewn-face dimensions, per-band run and square-ended strip length. The comparison uses the **shortest** of left, center and right unstretched finished measurements. A positive `modelOverstatementIn` is always flagged as a critical safety mismatch, with no arbitrary permitted overstatement. The operator-supplied tolerances can reject inconsistent seam/width/ledger results, but cannot erase a measured model overstatement or produce independent certification.

### Four audit states

| State | Meaning |
|---|---|
| `NOT_RUN` | All real fields blank; no measured fabric |
| `INCOMPLETE` | Some observations entered, with required fields absent |
| `OBSERVATION_HOLD` | Recorded width, seam, topology, end trim, model length or other recorded values contradict the declared protocol |
| `READY_FOR_HUMAN_REVIEW` | User-entered fields are complete and numerically internally consistent, but **none of their measurements or evidence is independently verified** |

No `PASS`, `physicalCertified=true`, `safeToPurchase=true`, `purchaseYards`, `verifiedUsableLengthIn` or `humanReviewCompleted=true` path exists in this engine.

## Persistence, trust and privacy

The browser keeps A/B/C drafts **in memory during the session**. The user can export all current raw form fields and a report snapshot as an explicitly **UNVERIFIED** JSON draft; re-import accepts only the versioned draft format and recognized string field names, with a 250KB input cap. Imported report statuses and purported approvals are ignored and **recomputed from raw user inputs**. Malformed or incomplete five-position/12-position sequences fail closed. No backend is called, no photos are uploaded and nothing is automatically stored in the user's account.

Do not publish the exported JSON as evidence of actual measurement unless a person has independently verified the source ruler records and data chain.

## Software QA

- Unit fixtures explicitly identify **synthetic test data**, not fabric. They test empty first load for A/B/C, reference prediction values, missing-field states, contradictory N or seam crossings, first/second seam deviations, source width rejection, loss of path continuity, under-yield risk, series lengths and numeric validation, and no automatic signoff despite internally consistent synthetic inputs.
- Mobile 375px Chromium tests the live route's noindex/canonical gates, all three blank initial states, 328.426in model vs 320in synthetic measurement HOLD, independent A/B/C drafts, JSON export, tampered-import re-audit, bad checkpoint sequences, and axe WCAG accessibility.
- Build gate enforces the `noindex` route, absence of canonical/JSON-LD, accessible cross-links from the two mathematical labs, explicit prohibition on purchasing certification, and correct internal link routing.
- The existing main CI / Cloudflare deployment statuses must be checked against exact commit SHA before announcing verified release.

## Non-automatable release tasks still outstanding

A human operator must actually make and measure physical A/B/C specimens and independently review the ruler evidence. That review must examine stretching and cross-fabric/operator repeatability, and challenge the assumptions in the 2D seam model. Even three credible sample measurements cannot validate every cutting width, cloth type, needle handling, seam allowance or bias configuration; a prespecified larger specimen matrix and approved conservative planning approach are needed before any buying recommendation or ranking bias SEO page becomes appropriate.

**Current decision: PHYSICAL MEASUREMENT NOT_RUN; BUYING & BIAS SEO HOLD.**
