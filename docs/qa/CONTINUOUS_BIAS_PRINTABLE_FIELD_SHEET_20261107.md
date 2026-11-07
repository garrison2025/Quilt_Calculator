# Continuous Bias Binding — Printable A/B/C Field Measurement Sheets

Date: 2026-11-07
Classification: **NOINDEX · BLANK/USER-ENTERED PAPER RECORD · NOT A FABRIC PURCHASE CERTIFICATE**

## Why this addition matters

The earlier `/lab/continuous-bias-physical/` observation page hid the input form in print view, forcing an operator to photograph or manually recreate the measurement checklist at the sewing table. This update builds a dedicated **paper-only layout for the selected specimen** while keeping the existing editable, locally exported JSON form and all physical audit safeguards.

Use the `Print selected specimen field sheet` button. The generated paper sheet is also available through normal browser Print / Ctrl+P, because the `beforeprint` listener refreshes the current raw draft. Printing does not save, upload, certify or approve anything.

The physical procedure, assumptions and A/B/C specimen matrix remain defined by `CONTINUOUS_BIAS_TUBE_PHYSICAL_SPECIMEN_PROTOCOL_20261107.md`.

## Paper structure and coverage

The selected A/B/C sheet includes:

| Sequence | Fields recorded by the operator |
|---|---|
| 01 | All seven numeric tolerances, plus a statement that tolerances were declared **before** cutting |
| 02 | Operator code, fabric treatment/weave, prewash status, photo/ruler reference filenames, measured square X/Y, measured trimmed WOF |
| 03 | First seam allowances **at five independent positions**, both physical tip overhangs and the sewn-face long edge/height |
| 04 | Second seam allowances **at five independent positions**, observed complete lanes, observed N−1 crossing count, maximum mark mismatch, actual band run Q, and pressing-open confirmation |
| 05 | **12 individually writable** full-width strip readings: start, end, and ten evenly spaced positions |
| 06 | **Additional independent width checkpoints at EVERY crossed tube seam**: A=7, B=6, C=5. These never get replaced or silently counted as part of the twelve distributed readings |
| 07 | One-layer continuous spiral confirmation, untrimmed unstretched length, two separately measured end trims, and final unstretched length along left/center/right edges |

The paper header labels predicted side, width, seam, N, N−1 and squared-end length as **MODEL ONLY**. All physical observations start blank. The sheet shows `NOT RUN` if the selected sample has no entered raw field. Entered values remain plainly **UNVERIFIED USER RECORDS**, not confirmed measurements.

The underlying `createBiasSpecimenPrintSheet` computes expected checkpoint count directly from the same model used by the physical audit. It compares its coverage against every field in `emptyBiasSpecimenObservation`, including all nested tolerance entries, and **throws** if a new audit field would be silently missing. Excess, short, or empty CSV slots are explicitly marked as requiring recheck; original entered text is retained on paper and is never trusted as proof.

Malformed or oversized raw fields **clear the prior printable sheet immediately**, replace it with an explicit PRINT BLOCKED warning, disable the Print button, and revalidate Ctrl+P through `beforeprint`. The screen shows an accessible error until the raw field is corrected; no stale paper is retained. This was added after PR code review found a stale-sheet risk.

The previous free-form separator parser accepted some consecutive commas because it collapsed repeated separators. That is corrected: missing comma-separated checkpoints now fail closed in the digital audit, and the printed draft highlights invalid series.

## Actual workflow

1. Select A, B or C before the fabric is cut, and write the limits on the paper first.
2. Print the selected blank field record. The standard browser Print dialog supports A4 and US Letter; choose 100% for legibility, but **this sheet is not a 1:1 cutting template**.
3. Measure real fabric, collect readable ruler photographs, and write ALL required checkpoint values — especially both seams and every crossing.
4. Re-enter observations in the digital lab. Inspect `NOT_RUN`, `INCOMPLETE`, `OBSERVATION_HOLD` or `READY_FOR_HUMAN_REVIEW`; there is NO automatic physical PASS.
5. Export the local, versioned `UNVERIFIED` JSON and retain actual photo evidence externally. A separate human must verify the original evidence, fabric handling, repeatability and unknown material effects.

Printed handwritten dates/reviewer signatures are an additional paper audit trail, not independently verified digital fields. Never claim that a printout certifies a specimen. For physical printer scale checks use `/qa/print-calibration/`; real paper ruler calibration remains MANUAL_NOT_RUN until performed by a person.

## Software test matrix

- Pure schema tests: three blank specimen records, 5+5 seam points, exactly 12 distributed widths, exactly N−1 additional seam-width fields for each sample, coverage of **every** current audit input, preservation of raw entered numbers, explicit warnings for short/surplus/empty values, invalid input fail-closed.
- Browser tests: mobile research route noindex; paper hidden on screen but present during print media; source form hidden during print; no paper overflow; A/B/C selection produces 7/6/5 crossing fields; user-entered notes show up unverified; actual Print button invokes the browser print action; paper screenshot stored in CI artifacts.
- Existing calibration / live Cloudflare smoke / nine production calculator math / JSON approval gates are not relaxed.

**Physical measurement status: NOT_RUN. Print output status: SOFTWARE-ONLY, pending exact-commit automated checks. Buy-ready continuous bias and seven HOLD keywords: STILL HOLD.**
