# Post-GEO production release acceptance — 2026-11-08

## Release identity
- Repository: garrison2025/Quilt_Calculator
- Merged change: PR #58 (answer-first page content, visible FAQ schema and Privacy & Terms); the prior merged GEO authorship/citation work is also present.
- Exact deployed main commit: bfdf39d50ddca2b1c79727074ef81b6aec31c661.
- Official production origin: https://quiltcutplanner.com/
- Cloudflare Pages mirror: https://quilt-calculator-566.pages.dev/ (same static HTML; protected by HTTP X-Robots-Tag: noindex).

## What changed in the GEO/SEO content layer
1. Homepage and all nine calculator pages put a direct answer immediately below the H1, before the interactive tool.
2. Each calculator FAQPage JSON-LD is derived from the same visible route FAQ data; the build validates nonempty questions and answers.
3. Natural question-form headings are used where they match actual user intent.
4. The privacy route and footer link are labelled Privacy & Terms, and the terms explain that estimates are planning aids, not guaranteed cutting instructions.
5. The earlier GEO pass adds visible project-level attribution, one consistent publisher entity, task-specific independent background references, and corresponding WebPage citations.
6. No named professional author, credentials, endorsements, first-publication date or formula certification was invented.

## Automated and live evidence

| Gate | Result | Evidence |
|---|---|---|
| Vitest | PASS — 400 tests in 38 files | [Quality run 42467960108](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960108) |
| TypeScript, Astro build, static SEO and route validation | PASS | Same quality run and production SEO dry run |
| Browser functionality | PASS | Calculator workflows, unit conversion, edits, imports, exports, local persistence, multi-tab conflict and recovery |
| PDF and print rendering | PASS — digital/browser scope | Chromium generated 65 US Letter landscape pages for the 30-roll/2,000-cut stress case; all 2,000 unique cuts and 30 rolls were reconciled. It remains a schematic, not a 1:1 cutting pattern. |
| Responsive and automated accessibility | PASS — automated scope | 320px reflow proxy; 360, 390, 768, 1024 and 1440px layouts; axe-core scans. Some axe checks remain marked for manual review. |
| Mobile touch | PASS — simulated devices | iPhone 13 WebKit and Pixel 7 Chromium pan, zoom, tap selection, recenter and reset. Physical phones and assistive technology were not tested. |
| Production SEO dry run | PASS | 12 approved sitemap URLs, exact production canonicals, index policy, HOLD and research noindex checks |
| Live dual-host audit | PASS | Exact main SHA on custom domain; all 12 approved routes passed production index + preview HTTP noindex checks; sitemap, robots and exclusions passed |
| Exact-commit public Cloudflare smoke | PASS | [Run 42467960127](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960127); tested live hydration, reviewed project, stale-tab protection, import/export, print and recovery |
| Mobile Lighthouse lab | PASS — 12/12 pages | [Run 42467960113](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960113); Performance 100 and SEO 100 on every URL; lab LCP 903–1,663ms, CLS 0.000, TBT 0–48ms |

## Indexing model
- The official custom domain is indexable for the 12 approved routes.
- The Pages mirror is not a second indexable site: the shared HTML may carry the production canonical and robots metadata, but the mirror sends HTTP X-Robots-Tag: noindex.
- Research, print-calibration and physical-method QA pages remain nonindexed and outside the production sitemap.
- This proves technical crawl eligibility and deployment consistency, not that Google has crawled, indexed or ranked the pages.

## Remaining gates — do not mark as software failures
- Google Search Console: explicitly deferred; no verification or sitemap submission was performed. Indexed URLs, queries, impressions, clicks, CTR and positions remain unknown.
- Fresh keyword/SERP evidence: the 218-row Semrush source is historical. Current US-localized Top-10 exports and fresh Volume/KD/CPC remain uncollected.
- Field performance: Lighthouse is simulated lab data, not CrUX or real-user LCP/INP/CLS.
- Optional www alias: DNS and a permanent redirect to the apex need separate verification/configuration.
- Email: DNS forwarding records do not prove that contact@quiltcutplanner.com receives messages and can send replies.
- Advertising: AdSense publisher setup, consent configuration, live ad rendering and revenue have not been verified by this release.
- Physical print: MANUAL_NOT_RUN until an actual printed 1-inch square, 100mm line and 6-inch line are measured with a ruler at 100% / Actual Size.
- Real fabric and sewing: MANUAL_NOT_RUN; real WOF, shrinkage, cut dimensions, seam take-up and sewn block/top dimensions require actual material and independent measurement.
- Real devices and assistive technology: physical iOS/Android, VoiceOver and NVDA manual sessions remain open.
- Unsupported methods: bias binding, diagonal backing, mitered/pieced borders, rag and square-in-square production claims remain HOLD/noindex unless separately validated.

## Decision
Software, production SEO configuration and automated deployment acceptance: PASS for commit bfdf39d50ddca2b1c79727074ef81b6aec31c661. Physical, field, Search Console, email and advertising evidence is explicitly not included in that PASS.