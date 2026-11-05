# Quilt Studio — preview engineering acceptance, 2026-11-05

**Decision: PREVIEW ENGINEERING ACCEPTED; PRODUCTION RELEASE NOT APPROVED.**

This is a **scope-limited engineering acceptance** for the exact publicly deployed Git commit `d9b6ad6da39d64163e242b6c45e1ec7c17343fe2`, not a claim that all original 47 release gates have passed. Do not enable production indexing, declare fully verified fabric consumption, claim actual printed paper accuracy, or apply for AdSense based on this file alone.

## Exact-version evidence

| Test area | Result | Reproducible evidence |
| --- | --- | --- |
| Source revision | `d9b6ad6da39d64163e242b6c45e1ec7c17343fe2` | https://github.com/garrison2025/Quilt_Calculator/commit/d9b6ad6da39d64163e242b6c45e1ec7c17343fe2 |
| TypeScript, mathematics, import, property, purchase and source fixtures | **PASS — 187/187 automated Vitest cases across ten suites** | https://github.com/garrison2025/Quilt_Calculator/actions/runs/41977134975 |
| Astro static build, internal URL/link checks, preview robots and noindex, HOLD exclusion | **PASS** | Same quality workflow; static build checker |
| Chromium browser QA: live calculations, input state, imports, CSV, SVG, project persistence, mobile, browser print/Ctrl+P, keyboard and cross-tab safety | **PASS** | Same quality workflow; `quilt-browser-qa` artifact (retained for 7 days) |
| Automated axe-core A/AA scans on desktop, selected mobile and dark-mode routes | **PASS for automated violation checks**; incomplete/manual items **not signed off** | Same quality workflow |
| Public Cloudflare deployment at exact source revision, ten approved HTML routes, noindex and actual Chromium interactions | **PASS** | https://github.com/garrison2025/Quilt_Calculator/actions/runs/41977135059 |
| Physical roll identification: user SKU names collide with system roll names; both shopping and cutting CSV retain distinct, matching roll identities | **PASS in Vitest and local Chromium** | Same quality workflow (187 cases; multi-material collision scenario) |

Preview: https://quilt-calculator-566.pages.dev/

## Boundaries of this approval

The currently approved tools are the project planner and the dedicated backing, straight-grain binding, butted borders, generic rectangular yardage, quilt-top fabric SKU, yards-to-inches, single-piece batting and sashing calculators. The homepage embeds the planner. Unsupported bias binding, diagonal backing, rag quilting, unproved mitered construction and unverified WOF safety claims are not approved for indexed release. The Square-in-a-Square experiment is a noindex laboratory, not an accepted physical cutting recipe.

**Material caveats:** physically feasible *entered* rectangles do not prove every quilt-top piece has been supplied; an explicit quilt-top cut-list review is required for whole-project cut export. Postwash usable WOF must be measured, and purchase estimates are not proof of real fabric stretch, cross-grain shrinkage or seam performance. Diagram drawings are schematic, not 1:1 patterns. The preview has neither a production canonical/sitemap nor production ad code.

## Still open — not signable by software alone

- **Physical printer sign-off (original gate 28 / property P24): MANUAL_NOT_RUN.** Print https://quilt-calculator-566.pages.dev/qa/print-calibration/ at Actual size / 100%, without Fit-to-page. With a real ruler measure the 1-inch square width and height (25.4 mm each), 100 mm line and six-inch line (152.4 mm). Record measurements, printer, paper, date and reviewer in [PRINT_SCALE_PHYSICAL_SIGNOFF.md](./PRINT_SCALE_PHYSICAL_SIGNOFF.md). Suggested acceptance tolerances there are ±0.5 mm for each square edge and ±1 mm per reference line. **PDF measurement or CSS units alone are not physical evidence.**
- **Sewn Square-in-a-Square construction and real-fabric verification: NOT_RUN.** Requires physical sample, measured seam allowances, point clearance and pressed/finished sizes before the experimental method could become public and indexable. Its HOLD status remains in force.
- **Independent assistive technology and human UX review: PARTIAL.** Automated axe-core scans are not an endorsement of screen-reader announcements, 400% browser zoom, actual mobile-device touch and manually judged legibility. Document a human review separately.
- **Production owned domain, canonical, sitemap, GSC: WAIT_DOMAIN / WAIT_GSC.** Preview must remain `noindex` until a user-approved domain exists and the production-specific QA checklist is satisfied. No search indexing or rankings are asserted.
- **AdSense, ad slots, privacy/consent configuration: WAIT_ADS.** Do not fabricate approval, advertising impressions or `ads.txt` verification. These are conditional on later launch decisions and current region/vendor requirements.

The source-level original 47-gate classifications remain in [ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md](./ORIGINAL_V2_RELEASE_GATES_47_CURRENT.md): 23 AUTO_EVIDENCE, 17 PARTIAL, 1 MANUAL_NOT_RUN, 1 WAIT_DOMAIN, 3 WAIT_ADS, and 2 WAIT_GSC. These status labels predate this final digital readout and are retained conservatively rather than rewriting historical source NOT_RUN cells.

## Repeatable checks

```sh
npm ci --no-audit --no-fund
npm run lint
npm test
npm run build
node scripts/check-build.mjs
npm install --no-save --package-lock=false playwright axe-core
npx playwright install --with-deps chromium
node scripts/browser-smoke.mjs
# When the Cloudflare deployment for the current git SHA is live:
QUILT_PREVIEW_URL=https://quilt-calculator-566.pages.dev node scripts/live-preview-smoke.mjs
```

The final public smoke step may require CI's deployment credentials/availability and is independently captured in the linked Cloudflare workflow. No commands above certify the physical/manual or future production gates.

## Recommended next decision

Keep this build as an engineering-accepted **noindex preview**. For an eventual public launch, separately complete physical paper scale, sewn/fabric method confirmation where claimed, human accessibility review, then register a domain and run production SEO/consent/AdSense checks. None of those uncompleted steps is implicitly accepted by this document.
