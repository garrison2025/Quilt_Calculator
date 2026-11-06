# Independent real-fabric cut-plan sign-off

**Current state: MANUAL_NOT_RUN (2026-11-05).** All project values in this document are placeholders for a future reviewer. No fabric was cut, no finished seam measured and no physical purchasing guarantee was independently verified by the software automation.

## Safest small-material validation workflow

1. Open the preview and choose a **real project**; confirm whether its finished quilt dimensions are truly intended (for example, 60 × 12 inches is a narrow project, not automatically the default 60 × 80 inches). Save the accepted V2 project JSON and note the eight-character source project hash.
2. After any intended prewash and removing selvedges, measure the **actual usable WOF** of each selected roll. Length shrinkage is not a substitute for measuring width. Record the real fabric SKU and orientation; never combine different colors/rolls to hide a shortage.
3. **Prevent mixed-revision cuts and purchases:** the shopping CSV and physical cut-list CSV now embed the same 8-character `Source project fingerprint` in their last column and filenames. Compare this tag across **every row of both files**, and with `sourceProjectHash` in the downloaded calculated-cut JSON. **Do not use files whose fingerprints differ**; re-export both from the same confirmed project after any change in dimensions, SKU quantities, grain or prices. This non-cryptographic 32-bit check is a mix-up warning only, **not** an authenticity signature or proof of real fabric measurements.
4. First test backing/binding/batting or one fabric SKU with cheap scrap or muslin rather than making a major purchase. Record required sizes, actual raw fabric length, width, directionality and any loss for each seam join. Keep the cut-list CSV, printed layout and original project JSON.
5. Use the exact `roll x / roll y / cut width / cut height / grain rotation` fields from the exported **current-roll** CSV. Measure a representative cut from each category with a physical ruler. Verify that all cuts fit postwash WOF and that joined seam take-up matches the stated assumption.
6. If the project is the *whole-quilt planner*, enter **all** real quilt-top pieces and colors and only then manually check the top-cut coverage box. The check is a user acknowledgement, not proof of completeness. Do not treat the unreviewed `INCOMPLETE` shopping CSV as a complete purchase order.
7. Separately print [/qa/print-calibration/](https://quilt-calculator-566.pages.dev/qa/print-calibration/) at 100% / Actual Size. Record real physical measurements in [PRINT_SCALE_PHYSICAL_SIGNOFF.md](PRINT_SCALE_PHYSICAL_SIGNOFF.md). The fabric-roll cutting SVG is still schematic, **not** a 1:1 fabric pattern.

## Browser-assisted physical measurement record (2026-11-06)

The independent, deliberately **noindex** [Fabric Cutting QA worksheet](https://quilt-calculator-566.pages.dev/qa/fabric-cutting/) now accepts BOTH site-produced CSV exports. It rejects missing source tags, incompatible file revisions, mismatched physical roll IDs, invalid piece numbering, coordinates exceeding specified WOF/run length, overlapping physical cuts, and purchase amounts shorter than the physical run. This is source-data consistency checking **only**, never evidence of a real printer, ruler or sewn fabric.

After importing matching files, a human enters the **actual usable WOF and available material length** for every physical roll, and selects one physical cut to sample and measure (width/height) per roll. The reviewer declares their own tolerance (0–¼ inch), measurement date, prewash condition and actual physical-measurement confirmation. Incomplete records cannot export. Complete negative findings **can** export. A not-yet-postwashed or unknown fabric condition remains `INCONCLUSIVE_NOT_POSTWASHED`, even when its displayed measurements are large enough.

The downloaded JSON records `kind: "user-reported-fabric-cutting-check"`, the short source fingerprint, per-roll reported measurements, sample cut differences and explicit `independentPhysicalVerification: false`, `quiltCuttingApproval: false`. It neither records independent reviewer approval nor verifies every cut, grain, washing loss or assembly seam. The browser reads local files only, does not upload or autosave them and does not alter the original V2 release-gate status. The automated browser test uses **synthetic** data; it does not certify a real physical cut.

## Purchase reserve and real shrinkage reconciliation — 2026-11-06

The **nonindexed [physical fabric QA page](https://quilt-calculator-566.pages.dev/qa/fabric-cutting/)** now cross-checks each site's shopping CSV against its matching cut roll in three ways, before a manual assessment can start:

1. The CSV's **exact prewash buying requirement (yards)** must cover the postwash cutting run, including modeled prewash length shrinkage.
2. The **rounded purchase (yards)** must be at least the exact prewash requirement. A manipulated or truncated purchase amount below the model requirement is rejected, even if it would cover the *unwashed* cutting run.
3. The corresponding roll ID, source revision, dimensions and nonoverlapping cut geometry must agree between both CSVs. The 8-hex source tag is a consistency aid and remains **noncryptographic**.

Once the reviewer measures **actual postwash usable WOF and run**, an **optional measured length before washing** of the **same bolt segment** can be supplied per physical roll. The tool calculates `observedLengthShrinkagePct = 100 × (1 − actualPostwashLength / actualPrewashLength)` and compares it with `plannedLengthShrinkagePct = 100 × (1 − requiredPostwashCutRun / (exactPrewashYards × 36))` extracted from the shopping CSV. These are *length* rates; they do not imply anything about *width* shrinkage, which is checked separately using the actual postwash WOF.

A higher observed length shrinkage rate produces `USER_REPORTED_SHRINKAGE_EXCEEDS_PLAN` (complete, exportable, **not certified**); material shortages and cut-size violations take priority in the result. It may be possible that actual postwash material still covers the job, but the planned purchasing assumption was optimistic and should be investigated. An invalid, explicitly supplied before-wash measurement blocks evidence export. Omitting that optional measurement is allowed, but the report explicitly states that **actual shrinkage has not been verified**.

This audit does **not** measure joined seam take-up, fabric grain movement or every single cut; those remain distinct requirements for human verification. User-entered synthetic/browser test data do not close the physical `MANUAL_NOT_RUN` release gate.

## Measurement sheet — initially empty

| Material / SKU | Expected from cutting CSV (in) | Actual postwash cut / seam measurement (in) | Actual source roll (in) | Difference and observations | Review sign-off |
|---|---|---|---|---|---|
| Backing | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| Straight-grain binding | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| One-piece batting | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| Butted border(s) | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| Each top fabric SKU | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |

Project source fingerprint (match shopping CSV / cut CSV / calculation JSON): NOT_RECORDED. Physical roll identities: NOT_RECORDED. Fabric condition: NOT_RECORDED. Reviewer/date: NOT_RECORDED.

## Completion criteria

- The *actual* dimensions and seam results must be written down and discrepancies resolved. An automated SVG-vs-CSV pass does not certify material from a physical roll.
- Review any assumptions, especially prewashed usable width, one-way grain, extra binding tails, horizontal-vs-vertical backing joins, and maximum material-piece counts.
- Pass print calibration and physical checks separately. The original V2 47 gates remain governed by [ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md](ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md); no evidence here changes them.
- For bias binding, diagonal backing, mitered borders and square-in-a-square, use **separate** construction-method validation, never this straight-grain sample as a substitute.

**Result: NO PHYSICAL SIGN-OFF.**
