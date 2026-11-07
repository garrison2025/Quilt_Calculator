# 2026-11-07 · Printable workbook efficiency and independent QA scope

## Purpose

The prior physically complete downloadable cutting workbook produced **108 US Letter landscape PDF pages** for the validated 30-SKU / 2,000-piece stress case. The product is correct digitally, but excessive page count consumes paper and makes cutting sheets hard to keep with the correct roll. The accepted V2 user keyword data and nine existing calculators are not being changed.

## Changes intended for this branch

- Print-only, script-free CSS uses more efficient spacing with **11 CSS px (~8.25-point)** table text, still keeping full-precision coordinate values, piece labels and a physical checkbox per cut. Screen display remains unchanged and prints remain **SCHEMATICS, NOT 1:1 patterns**.
- The `thead` of **every physical roll** contains an explicit repeatable identification row: original project roll number, physical roll/SKU ID and source Project V2 8-hex fingerprint. The repeatable column headings are separate. If a paper stack gets shuffled, every page containing cuts should still identify its roll and columns, not just the first page of a roll.
- Run **actual Chromium PDF rendering** against the real download and require a substantial page-count reduction from baseline **108** to **≤85** on the same 2,000-cut fixture. Preserve US Letter landscape dimensions and no external resources.
- Test every one of the 2,000 unique cut labels and 30 original roll IDs against the full CSV, 8-digit source fingerprint, repeated per-page identity + coordinate headers, and real text bounding boxes on paper. Repeat the original mobile/keyboard/reduced-motion and source safety tests.
- Keep `noindex` on the Cloudflare Pages preview, all experimental methods HOLD, and all original Semrush keyword data unchanged.

**Evidence status:** Proposed engineering checks above are NOT `PASS` until this exact branch CI succeeds, is merged and the exact main git SHA is seen on the Cloudflare public preview. Do not confuse PDF word coordinates with a real printer, paper and fabric measurements.

## Scope of tasks the assistant cannot independently close

1. The original V2 physical print gate requires **a human to print with a real printer at 100%, then measure with a ruler**. Use the existing /qa/print-calibration/ worksheet and keep its `MANUAL_NOT_RUN` status until that happens.
2. Real cloth widths, grain, postwash shrinkage and completed sewn-block dimensions require user-provided physical specimens and independent observations. They cannot be synthesized from software tests.
3. Real iPhone/Android screen readers and native 400% browser zoom require hardware/manual sessions to fully sign off; automated 320-CSS-pixel reflow proxy already covers all ten approved routes. Manual NVDA/VoiceOver remains open.
4. Production domain ownership, actual DNS/HTTPS, indexable canonicals/sitemap and dual-host index isolation require an approved custom domain. No domain purchase or release was authorized. GSC and AdSense need real user-account permission and postlaunch evidence.
5. Bias binding, diagonal backing, mitered borders, rag quilt and square-in-square **remain unsupported or noindex research**; numerical simulation is not a substitute for independent sewing method validation and production buyer-ready approval.

Do not repeat historic US SERP research or count optional unreleased methods as V2 required production pages.
