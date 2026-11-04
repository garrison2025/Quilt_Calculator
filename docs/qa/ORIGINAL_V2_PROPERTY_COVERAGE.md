# Original V2 24-property matrix: execution coverage and blocking checks

Recovered source: `docs/data/reference/V2_Property_Test_Plan_24.csv` from user-supplied `Quilt_V2_Research_and_Build.xlsx`. Do not overwrite source `NOT_RUN` statuses; current evidence belongs to CI.

## Dedicated machine-executable property IDs
`tests/original-v2-properties.test.ts` provides explicit, reproducible assertions for **20 of 24 original property IDs**: P01–P18, P20 and P22. These tests measure fractions, backing monotonicity, panel seam coverage, grain limits, shrinkage, binding, physical rectangle overlap/bounds, quantities and SKU isolation, non-optimal packing disclaimers, batting/sashing/borders, WOF area caveats and invalid JSON.

## Still not fully verified by this suite
| Source ID | Required evidence | Current status |
|---|---|---|
| P19 | Original row requests butted **and mitered** border construction independently checked. Only butted construction is offered; no claim of mitered support is made. | PARTIAL / MITERED NOT IMPLEMENTED |
| P21 | Shared project across tools and invalidation on edits, with browser multi-tab and persistence checks. Existing Chromium smoke tests provide partial evidence; 1:1 original requirement signoff remains outstanding. | PARTIAL / UI EVIDENCE |
| P23 | Every SVG label and drawn dimension must correspond to structured results across ALL cases. Existing browser checks cover selected diagrams but not a comprehensive coordinate-to-render-label audit. | PARTIAL / ADDITIONAL AUDIT REQUIRED |
| P24 | Print a real 1 inch / 25.4 mm calibration line at **100%** and physically measure it on paper. CI/browser-generated PDF cannot replace physical verification. | NOT_RUN / PHYSICAL PRINT REQUIRED |

These categories must not be reported as 24/24. Passing automated tests does not certify sewn Square-in-a-Square geometry, paper-scale calibration, actual advertising readiness or SEO rankings.
