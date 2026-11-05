# Whole-quilt border-inclusive dimensions — production gate

**Engineering scope:** P0 geometry correction, 2026-11-06. **Physical cutting, printer scale and production-indexing approval are NOT_SIGNED_OFF.** The original 218-row keyword evidence and unrelated V2 source fixtures were not rewritten.

## Input contract

A project's `quilt.finishedWidth` / `quilt.finishedHeight` retain their V2 JSON property names for backward-compatible importing, but these numbers now have an **explicit** interpretation stored in `quilt.sizeBasis`:

- `before-borders` (new sample/default): entered numbers describe the **quilt center before attaching finished border layers**. For each border layer with finished width `b`, the outside increases by `2b` in both axes.
- `includes-borders`: entered numbers are the **already-finished outside quilt dimensions**. The quilt center is calculated by subtracting `2 × sum(finished border widths)` from each axis.
- Missing `sizeBasis` with **one or more** borders: legacy V2 project **AMBIGUOUS**. The app must refuse complete-material purchases, physical cut-list CSV, diagnostic export presented as a current plan, and print until the user explicitly selects a basis. The original measurements and JSON remain preserved.
- Missing `sizeBasis` with **zero** borders: both interpretations have identical geometry and the project can still calculate. No forced reinterpretation.

For base/center `(W,H)`, and `B=sum(border.widthIn)`:
```text
finished quilt width  = W + 2B
finished quilt height = H + 2B
backing target        = (W + 2B + 2×backingExtra) × (H + 2B + 2×backingExtra)
batting target        = (W + 2B + 2×battingExtra) × (H + 2B + 2×battingExtra)
binding perimeter     = 2 × (W + 2B + H + 2B) plus explicit tail allowance
```
The base width for butted-border cut geometry is **always the computed center**, not the already-expanded outer dimensions. Geometry is checked against the returned `calculateBorders().finishedWidthIn/HeightIn`; disagreement blocks the result. Fabric SKUs remain independent and do not silently merge with a backing or border roll.

## Independent regression fixture, 60 × 80 inches with 3-in outer border

| Measurement | Correct value |
|---|---:|
| Entered center | 60 × 80 in |
| Finished outside | 66 × 86 in |
| Target backing with 4 in extra each edge | 74 × 94 in |
| Recommended backing with 43-in WOF, 1-in joins, 1/8-yd shop increment | 5.25 yd |
| Batting with 4 in extra per edge, 96-in WOF | 2.625 yd |
| Straight-grain binding required (including 12-in tail) | 316 in |

Existing older output based on 60 × 80 instead of 66 × 86 is not valid for the combined project. Individual material tool pages share the confirmed outside geometry; the whole-quilt JSON includes a `dimensions` object; the shopping CSV and physical cut CSV are generated from the same border-aware engine. A screenshot is **not** a geometry verification substitute.

## Review invalidation

The manual quilt-top coverage fingerprint now includes the dimension meaning, entered sizes, border SKU/finished-width geometry, border seam allowance, and all quilt-top fabric cut groups. Changing any of these revokes the old signed review; changing only the shopping increment or screen unit preference should not.

The checkbox is a **user acknowledgment of a complete entered quilt-top cut list**, not independent physical proof. V2 files with an old review fingerprint are intentionally not treated as current signed coverage after the semantic change.

## Validation / release hold

Software tests: `tests/whole-project-dimensions.test.ts`, `tests/import.test.ts`, and the cross-page browser/export checks in `scripts/browser-smoke.mjs`. Evidence must include the exact GitHub workflow run and production-preview commit, not inferred from source changes.

Unresolved until actual measurement: true usable postwash fabric width, joins, 1:1 print calibration and sewn fabric cutting evidence. Unproven bias, mitered and diagonal methods remain HOLD.

**Domain:** future custom-domain indexable build must be checked **independently** from `quilt-calculator-566.pages.dev`. The `public/_headers` preview-host rules are an extra noindex defense, NOT a substitute for inspecting live headers and canonicals on both hosts.

**Security:** 2026-11-06 npm dependency inventory reports 8 total affected lockfile packages (3 critical / 3 high / 1 moderate / 1 low), including 5 packages in `--omit=dev` inventory. These are advisory counts, not proven exploitable paths on this static site. Production launch remains blocked pending applicability review and a tested update of Astro/Sharp/Vitest as needed; do not use `npm audit fix --force` on an untested release.
