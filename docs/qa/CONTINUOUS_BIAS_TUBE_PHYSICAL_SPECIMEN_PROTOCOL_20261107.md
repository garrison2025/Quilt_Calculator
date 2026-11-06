# Continuous Bias Tube — real specimen validation protocol
Date: 2026-11-07
Status: **PREPARED · NO PHYSICAL SPECIMEN MEASUREMENTS RECORDED**

This protocol is the next gate after the corrected 2D software model. The successful software run does not imply the fabric construction has been physically verified. Do not use the model length as a buying quantity.

## Purpose

Compare the engineering model with real continuous-bias-tube construction, using the exact APQS-style sequence:
1. Split a square diagonally into two triangles.
2. Place the triangles right sides together, use equal tip overhangs at both ends, sew the first short-edge seam and press open.
3. Mark full unfolded strip widths parallel to a bias edge.
4. Bring the parallelogram short edges together with a one-line offset; match the drawn lines at the actual sewing line, sew the tube seam and press open.
5. Check continuity, cut ONE layer along the spiral, square both ends and measure the finished strip.

Reference procedure: [APQS bias-binding guide](https://www.apqs.com/a-guide-to-bias-binding/) and [APQS bias-binding chart, page 2](https://www.apqs.com/wp-content/uploads/2021/02/21_APQS_0171_BiasBindingChart_020221.pdf). APQS describes the equal ¼-inch tip overhang, one-line offset, checking the line continuity and cutting along the continuous drawn line. This protocol adds the measurements needed to compare that physical process with the project's equations.

## Specimen matrix

Use the same nominal ¼-inch allowance on BOTH seams for these first comparisons. Measure the actual allowance; do not assume the machine setting equals the sewn result.

| Specimen | Measured source square S | Full strip width W | Allowance a | Model full bands N | Post-first-seam height H1 | Tube run Q | Model squared-end length |
|---|---:|---:|---:|---:|---:|---:|---:|
| A | 30.000 in | 2.500 in | 0.250 in | 8 | 21.0364 in | 41.3657 in | 328.426 in |
| B | 24.000 in | 2.250 in | 0.250 in | 7 | 16.7938 in | 32.8805 in | 227.913 in |
| C | 18.000 in | 2.000 in | 0.250 in | 6 | 12.5511 in | 24.3952 in | 144.371 in |

These are predicted values for the current convention, not a claim that the fabric will produce them. The expected number of full bands is `floor(H1/W)`; count the actual full-width bands on the sewn/marked piece. If the observed count differs, record it and stop to investigate rather than forcing the input to the expected count.

## Published comparison fixture (not a project-run sample)

[Geta's Quilting Studio](https://www.getasquiltingstudio.com/2018/04/continuous-bias-binding.html) reports measuring **120in of 2.5in-wide continuous bias from an 18in × 18in square**. The article does not detail the exact end-trim measurement, fabric stretch or measuring tension. Under the current model convention (`a=0.25in`, `N=5`), the prediction is **119.476in**, 0.524in / 0.44% below the published measurement.

| Reference | S | W | a | N | Model length | Published measured length | Difference |
|---|---:|---:|---:|---:|---:|---:|---:|
| Geta 18in square | 18in | 2.5in | 0.25in | 5 | 119.476in | 120in | −0.524in |

This is a single external reference point, not a controlled specimen made for this project. Use it as a regression benchmark, then make the project specimens below to test repeatability and boundary cases.

## Measurements to record

### A. Before sewing
- Fabric type, weave, weight, prewash status and pressing/starch treatment.
- Square side measured in both directions after squaring; record usable WOF.
- Actual diagonal cut line and whether the two triangles are congruent.
- Strip width W measured perpendicular to the marked bias lines.

### B. First triangle-assembly seam
- Actual seam allowance at five positions along the seam.
- Tip overhang at both ends (left/top and right/bottom): the current model expects the same `a` at both ends.
- Whether the seam is sewn with right sides together and pressed open.
- Finished parallelogram long-edge length and perpendicular height after pressing.
- Actual first-seam stitch-line endpoints and any fabric distortion, puckering or edge mismatch.

Model targets:
```
L1 = sqrt(2) * (S-a)
H1 = (S-a) / sqrt(2)
first seam face take-up = S² - (S-a)²
```

### C. Marking and second tube seam
- Count complete width-W lanes and measure the final partial-width remainder.
- Actual seam allowance at five positions on the tube seam.
- Confirm the first line on one edge is aligned to the raw edge on the other edge, with the offset direction correct.
- Before sewing, record each cut-line intersection at the sewing line. After sewing and pressing open, inspect every crossing; for N bands the topology model expects N-1 tube-seam crossings.
- Record the maximum visible mismatch between the two marks at each stitch-line crossing.
- Measure the distance along each cut boundary between the left and right tube stitch lines. The current model expects Q.

Model targets:
```
Q = sqrt(2) * (S-3a)
second tube seam take-up = 2*a*(S-a)
unused partial-band area = (H1-NW)*Q
```

### D. Spiral cutting and terminal trim
- Cut through ONE fabric layer only. Confirm the line remains continuous across both seams.
- Record whether the strip width stays at W; measure at the beginning, end, every seam crossing and at least ten evenly spaced positions.
- Measure the untrimmed continuous strip length without pulling or stretching it.
- Square both ends perpendicular to the strip length; record the removed shape and each end's length-equivalent trim.
- Measure finished strip length without tension, preferably at the centerline and along both edges. Record the three values separately if they differ.
- Record any cut interruption, accidental second-layer cut, fraying, seam bulk, stretch or local width narrowing.

Model targets:
```
full-band run before end trim = N*Q
two terminal offcuts = W²/2 each
total terminal end-trim area = W²
modeled square-ended length = N*Q-W
```

## Blank observation sheet

| Field | Specimen A | Specimen B | Specimen C |
|---|---|---|---|
| Actual square side, both directions | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Actual WOF | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Actual first-seam allowance range | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Actual tip overhang, both ends | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Measured first-seam long edge / height | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Observed complete full-width bands | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Actual tube-seam allowance range | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Maximum stitch-line mark mismatch | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Actual full-band run Q | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Strip width range after cutting | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Untrimmed strip length | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Length removed at each terminal end | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Finished strip length, no tension | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Continuous one-layer cut? | NOT RECORDED | NOT RECORDED | NOT RECORDED |
| Photos / ruler evidence | NOT RECORDED | NOT RECORDED | NOT RECORDED |

## Acceptance decision rules

1. **Construction/topology:** all N-1 tube-seam mark crossings must form one continuous path. Any broken or ambiguous crossing is a fail for that specimen.
2. **Dimensional fit:** the observed complete-band count must be explainable by the measured sewn-face height. No fractional-width band may be counted as full width.
3. **Width integrity:** the finished strip must remain at the specified full cut width within a tolerance agreed before the test. Do not invent a tolerance after seeing the result.
4. **Length:** compare the model prediction with the measured, square-ended, unstretched strip. Record absolute and percentage error; do not average away an overestimate.
5. **Purchase safety:** before any purchase calculator is enabled, the model must not overstate usable length on any accepted specimen, and repeated specimens must demonstrate that the chosen safety margin covers operator and fabric variation. If any sample yields less than the model, revise the geometry or apply a defensible conservative factor and repeat.
6. **Scope:** passing the three sample configurations is an initial validation set, not proof for every fabric, square size, width, seam allowance or rectangular source piece. Broader support requires additional boundary and material tests.

## Current state

- Software geometry, area closure and browser interaction: see [2D development QA](CONTINUOUS_BIAS_TUBE_2D_DEVELOPMENT_20261106.md).
- Physical fabric measurements: **NOT_RUN**.
- Full Continuous Bias Binding purchase calculator: **HOLD**.
- Seven bias SEO intents: **HOLD**.
- Research route: **noindex,follow**; no canonical or sitemap entry.
