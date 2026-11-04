# Original Quilt V2 research workbook sheets

Source: user-provided `Quilt_V2_Research_and_Build.xlsx` (2026-11-04). SHA-256 of full original XLSX: `8e327460e92a1acb4eeab6c74f19987a787dec2b98b85c7b471ce397a248880b`.

The three CSVs retain the original workbook sheet columns and cell contents. The synthetic row-index column added by the indexed file-text extraction was removed. The JSON is a parsed equivalent of the 39-row Golden worksheet to enable Vitest without external spreadsheet libraries at runtime.

- `V2_Golden_Fixtures_39.csv` — 39 original reference cases; **original `生产验证=NOT_RUN` left untouched**.
- `V2_Property_Test_Plan_24.csv` — 24 original invariants; **original `引擎状态=NOT_RUN` left untouched**.
- `V2_Release_Gates_47.csv` — 47 original G0–G4 acceptance gates; **original `结果=NOT_RUN` left untouched**.

**Important**: origin statuses are historical source data, not evidence of current engine execution. Any execution results are reported separately with current GitHub CI links and must not be backfilled into these source worksheets. Numeric fixture agreement is not proof of real fabric sewing, a calibrated 100% print template, a production domain, GSC ranking or AdSense approval.
