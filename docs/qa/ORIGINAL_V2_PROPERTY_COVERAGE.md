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


## P23 (2026-11-05): full exported SVG-to-cut geometry check — automated scope
Every approved cutting page now has Chromium assertions comparing ALL displayed individual SVG cut rectangles (up to the documented first 180 per fabric) to **the independently downloaded current-roll cutting CSV**. The test validates source dimensions, roll SKU identity, index, physical WOF/run, rotation, tooltip text and rendered SVG x/y/width/height. It verifies all roll identities are covered on multi-SKU pages and that the alternate-WOF comparison diagram is not treated as an exported purchase. Beyond-180 designs retain full exported CSV but only the first 180 visual cuts are render-audited. Label visibility and manual graphic legibility still require human inspection.

### Executed evidence for P23, not final physical signoff
Source and line-by-line pixel placement were cross-checked in real Chromium against independently downloaded current-roll CSV on all approved cutting routes at [CI 41929120595](https://github.com/garrison2025/Quilt_Calculator/actions/runs/41929120595). This upgrades the *rendered numeric coordinate* portion from untested to passing. Accessibility of every graphic label to humans, hardcopy print scale and visual inspection remain separate and are **not** claimed complete.


### P21 (2026-11-05): across-tool project data continuity
The full P21 engineering scenario is now executed in an isolated Chromium browser context across backing → binding → batting → hub → fabric → yardage → backing → hub. Native-inch dimensions, reversible cm/in display, fabric SKU label, cut quantity, unsaved edit protection and final downloaded Project V2 JSON must agree with the one locally saved project. The original manual/full cross-tool signoff remains separately identifiable; this strengthens the automated P21 evidence rather than proving every UI journey.
