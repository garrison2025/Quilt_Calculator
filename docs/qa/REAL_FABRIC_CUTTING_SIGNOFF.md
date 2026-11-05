# Independent real-fabric cut-plan sign-off

**Current state: MANUAL_NOT_RUN (2026-11-05).** All project values in this document are placeholders for a future reviewer. No fabric was cut, no finished seam measured and no physical purchasing guarantee was independently verified by the software automation.

## Safest small-material validation workflow

1. Open the preview and choose a **real project**; confirm whether its finished quilt dimensions are truly intended (for example, 60 × 12 inches is a narrow project, not automatically the default 60 × 80 inches). Save the accepted V2 project JSON and note the eight-character source project hash.
2. After any intended prewash and removing selvedges, measure the **actual usable WOF** of each selected roll. Length shrinkage is not a substitute for measuring width. Record the real fabric SKU and orientation; never combine different colors/rolls to hide a shortage.
3. First test backing/binding/batting or one fabric SKU with cheap scrap or muslin rather than making a major purchase. Record required sizes, actual raw fabric length, width, directionality and any loss for each seam join. Keep the cut-list CSV, printed layout and original project JSON.
4. Use the exact `roll x / roll y / cut width / cut height / grain rotation` fields from the exported **current-roll** CSV. Measure a representative cut from each category with a physical ruler. Verify that all cuts fit postwash WOF and that joined seam take-up matches the stated assumption.
5. If the project is the *whole-quilt planner*, enter **all** real quilt-top pieces and colors and only then manually check the top-cut coverage box. The check is a user acknowledgement, not proof of completeness. Do not treat the unreviewed `INCOMPLETE` shopping CSV as a complete purchase order.
6. Separately print [/qa/print-calibration/](https://quilt-calculator-566.pages.dev/qa/print-calibration/) at 100% / Actual Size. Record real physical measurements in [PRINT_SCALE_PHYSICAL_SIGNOFF.md](PRINT_SCALE_PHYSICAL_SIGNOFF.md). The fabric-roll cutting SVG is still schematic, **not** a 1:1 fabric pattern.

## Measurement sheet — initially empty

| Material / SKU | Expected from cutting CSV (in) | Actual postwash cut / seam measurement (in) | Actual source roll (in) | Difference and observations | Review sign-off |
|---|---|---|---|---|---|
| Backing | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| Straight-grain binding | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| One-piece batting | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| Butted border(s) | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |
| Each top fabric SKU | NOT_MEASURED | NOT_MEASURED | NOT_MEASURED | NOT_RECORDED | NOT_RUN |

Project source hash: NOT_RECORDED. Physical roll identities: NOT_RECORDED. Fabric condition: NOT_RECORDED. Reviewer/date: NOT_RECORDED.

## Completion criteria

- The *actual* dimensions and seam results must be written down and discrepancies resolved. An automated SVG-vs-CSV pass does not certify material from a physical roll.
- Review any assumptions, especially prewashed usable width, one-way grain, extra binding tails, horizontal-vs-vertical backing joins, and maximum material-piece counts.
- Pass print calibration and physical checks separately. The original V2 47 gates remain governed by [ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md](ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md); no evidence here changes them.
- For bias binding, diagonal backing, mitered borders and square-in-a-square, use **separate** construction-method validation, never this straight-grain sample as a substitute.

**Result: NO PHYSICAL SIGN-OFF.**
