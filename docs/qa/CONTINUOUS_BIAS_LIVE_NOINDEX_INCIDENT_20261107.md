# 2026-11-07 — Continuous-bias research HTTP noindex incident

**Disposition: falsely failing live test due to JavaScript regular-expression escaping, not a confirmed Cloudflare Pages header omission.**

## Exact evidence and chronology

1. PR #28 (merged `803a10c`) added an independently nonindexed A/B/C physical specimen observation workbook, preserving `NOT_RUN` for all actual samples.
2. PR #29 (merged `85eb838`) added strict tests to `scripts/live-preview-smoke.mjs` for three live `/lab/` routes and actual browser-generated audit HOLD. The public-preview run `42316678807` failed at the new lab `X-Robots-Tag` check.
3. PR #30 (merged `8d2d826`) added explicit Cloudflare `/lab/*` and `/qa/*` `_headers` noindex rules. These are sensible defense in depth, including future custom-domain use, but **they were not proven to be the fix**. The new public-preview run `42317350513` still failed the same check.
4. Reviewing the **exact old source bytes** exposed the actual bug: the lab matcher contained `/\\\\bnoindex\\\\b/i` as TWO literal backslash characters before each `b` inside a regex literal. In JavaScript this matches textual `\\b` rather than a word boundary. The prior working check on the ten approved calculator routes contained only one backslash (`/\\bnoindex\\b/i`).
5. PR #31 (merged `4554c78`) replaced the erroneous lab assertion with a token matcher and included diagnostic output of actual live response headers and redirect metadata if any genuine mismatch occurs. Its exact main deployed Cloudflare `public-preview` run **`42318261601` succeeded**, checking the three lab research routes at their actual deployed commit, server `X-Robots-Tag`, HTML robots meta, lack of canonical/JSON-LD, default A/B/C `NOT_RUN`, intentionally synthetic under-yield `OBSERVATION_HOLD`, and noncertifying JSON export.
6. This follow-up corrects and consolidates the live preview response-header matcher for BOTH the approved calculator routes and research routes. It adds self-test fixtures for valid and invalid header tokens, so future accidental escape mistakes fail fast.

## Contract

- The approved nine calculator routes retain existing preview noindex and exact-commit verification. `/lab/*` and `/qa/*` remain nonindexed and excluded from production SEO.
- Physical fabric data were **NOT measured**. Browser tests only exercised synthetic numbers; they do not count as production yield validation.
- No `safeToPurchase` outcome or true continuous-bias purchasing guidance is released.
- Production launch/official domain, real human textile sampling, physical print calibration, manual expert review and indexable bias SEO remain separate pending gates.

## Root-cause discipline

The two earlier action runs were genuine test failures but **not evidence that Cloudflare omitted noindex**. The source-level double escape explains why those checks returned false. The first subsequent corrected exact-main live run succeeded. The `/lab/*` and `/qa/*` header additions remain in source as explicit host-independent safety defaults, but should not be credited with resolving the regex defect.
