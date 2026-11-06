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

## Manual backing & straight-grain binding joined-seam check — 2026-11-06

The existing user-run [Fabric Cutting QA worksheet](https://quilt-calculator-566.pages.dev/qa/fabric-cutting/) now optionally reads a **third file** from the same reviewed whole-quilt project: `quilt-studio-cut-plan-v2.json`. The JSON is explicitly checked against both previously imported physical cut-list and shopping CSV files by the short project fingerprint, the required whole-project reviewed cut-list status, actual backing/binding physical roll IDs, panel/strip counts, usable widths and cut piece/run dimensions. Any mismatch blocks importing the assembly plan. This is **not** cryptographic verification; malicious or independently altered inputs can still agree.

With that matching calculation JSON, the worksheet displays two independently measured construction targets:

- **Backing:** chosen vertical/horizontal join orientation, count of full-width panels, modeled finished joined span **before edge trimming**, required backing target span and modeled TOTAL seam take-up. The reviewer may input actual joined span measured **after joining all full-width panels but before edge trimming**. A one-panel backing has **zero joins** and does not require a made-up seam measurement.
- **Straight-grain binding:** full-width strip count, modeled joined strip length **before any end trimming**, actual binding length required to cover the perimeter and tail allowance, and modeled TOTAL loss from the straight strip joins. The actual assembled binding length is measured before trimming the ends.

For either type, `actual observed total loss = number of full-width pieces × measured real postwash usable WOF − real measured assembled span`. The user may select an additional total-loss deviation allowance from **0 to 1 inch**, not a per-seam allowance or an industry standard. A material whose **actual joined span is shorter than the required minimum** is flagged even if the calculated loss remains within the declared tolerance. `USER_REPORTED_SEAM_LOSS_EXCEEDS_PLAN` preserves these negative results as exportable user reports. If the reviewer skips one/both joined measurements, the report identifies `NOT_MEASURED` or `PARTIAL_USER_REPORTED`; if no JSON is supplied the result stays `NOT_IMPORTED`. The evidence format is now `schemaVersion: 2` with both material and joined-seam checks, all marked user-reported; `independentPhysicalVerification: false` and `quiltCuttingApproval: false` always remain.

**Scope:** This comparison only applies to the listed **full-width** backing and straight-grain binding methods and the same **postwash measured WOF** of the actually joined strips. It assumes no end trimming occurred before measuring. It does not independently inspect real stitching, seam allowances, fabric grain, pieced borders, batting, mixed-width strip trimming, washing/ironing deformation, or sample verification across every piece. Separate real measurements and a qualified human review are still necessary; `MANUAL_NOT_RUN` remains.

## Per-join take-up and actual backing stitch direction — 2026-11-06

The noindex physical audit now extends the **optional, reviewed, same-project cutting-plan JSON** checks with **individual sewn join measurements**. This is not a new SEO page, a different backing construction algorithm, a guaranteed cutting method, or real-world physical signoff.

- **Backing join direction:** the reviewer may explicitly confirm whether the observed line of sewn backing seams runs **vertical** or **horizontal**. It is compared against the saved selected backing join orientation, not guessed from the cutting CSV. A mismatch produces `USER_REPORTED_SEAM_DIRECTION_MISMATCH` (user-reported negative evidence, never approval). If no direction is selected, it stays unconfirmed.
- **Net take-up for each join:** record the actual **lost usable span** at each sewn seam, in the assembled order. Backing net take-up includes both joined panel edges. Straight-grain binding's net loss may come from a diagonal joining method and **must not be assumed to equal twice a nominal seam allowance**. The source engine provides total model assumptions, not separate physical seam-allowance measurements. The UI shows up to 64 per-join fields; when more than 64 joins occur, full joined span can still be checked and individual join loss remains to be documented offline.
- **Cumulative reconciliation:** only when **every join** has a user-entered value can the tool calculate `sum(lossPerJoin)` and `predictedJoinedSpan = n × actualPostwashUsableWOF − sum(lossPerJoin)`. It compares this calculated value with the **separately measured real full joined span before trimming**. If they disagree by more than the reviewer-selected 0–1 in **total** deviation, `USER_REPORTED_SEAM_MEASUREMENTS_DISAGREE` is exported and flagged. Missing any join yields `PARTIAL_USER_REPORTED`; the tool does **not** fabricate missing losses.
- **Excessive aggregate seam loss:** a user-reported per-join sum over the model's *total* seam-loss budget plus declared tolerance is flagged even if no complete joined-span value is entered. Material shortages and sampled piece-size violations remain independent errors. Full assembled length below the required quilt span remains a separate failure signal.
- **Evidence:** the downloaded local JSON is `schemaVersion: 3`. It preserves observed direction, number of joins measured, optional individual net losses, cumulative predictions, cross-measurement differences, and all warnings. `sourceSnapshotIsCryptographicallyAuthenticated: false`, `independentPhysicalVerification: false` and `quiltCuttingApproval: false` remain explicit.

**Critical scope:** measured net length take-up is not a stitch-type classification or proof of each edge's exact seam allowance. These are manual notes only. Bias binding, mitered borders, diagonal backing, seam pressing, grain stretch, true 1:1 ruler calibration, fabric width variation along the roll, sewn-top assembly and physical finished dimensions require separate human tests. A simulated browser test never moves `MANUAL_NOT_RUN` to `PASS`.

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
