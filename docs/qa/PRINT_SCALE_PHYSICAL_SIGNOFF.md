# Physical print scale sign-off — original V2 G2 release gate

**Current status: MANUAL_NOT_RUN.** No paper measurements have been supplied. Browser pixels and PDF generation never count as physical print validation.

## Worksheet and procedure

Open /qa/print-calibration/ on the Cloudflare Pages preview and print the worksheet with a physical printer on A4 or Letter paper:

1. Use 100% / Actual size; turn off Fit, Shrink, browser headers/footers and driver auto-enlargement.
2. Use a ruler to measure the outside edges of the square. Both should be 25.4 mm.
3. Measure between the end-tick centers of the horizontal 100-mm and 6-inch (152.4-mm) lines.
4. Record the measurements, printer/driver, paper, scale settings, date and reviewer. Preserve the paper or a photograph locally if desired.
5. Suggested QA tolerances (not manufacturer specifications): at most ±0.5 mm for square width and height, and ±1 mm for each horizontal line. Reprint and correct scaling if beyond tolerance.
6. Do not mark the physical gate passed until a human has performed and recorded these real measurements.

| Measurement | Expected | Actual | Absolute difference |
|---|---|---|---|
| 1-inch square width | 25.4 mm | NOT_MEASURED | — |
| 1-inch square height | 25.4 mm | NOT_MEASURED | — |
| 100-mm line | 100.0 mm | NOT_MEASURED | — |
| Six-inch line | 152.4 mm | NOT_MEASURED | — |

Printer/driver: NOT_RECORDED. Paper/print scale: NOT_RECORDED. Reviewer/date: NOT_RECORDED.

**Physical sign-off remains MANUAL_NOT_RUN.**

## Independent sewing evidence

This page does not validate the Square-in-a-Square construction method. That separate noindex laboratory needs a sewn practice block, seam size, bias handling, point clearance, trim allowance and actual pressed/finished measurements before release. No sample has been sewn as part of this CI.
