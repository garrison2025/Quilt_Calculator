# Quilt Cut Planner — production SEO fixes, 2026-11-08

## Scope and owner's instruction

The owner approved immediate website SEO fixes but **explicitly deferred Google Search Console**. This change neither accesses nor creates GSC properties, nor submits sitemaps, installs analytics or AdSense, invents live traffic/CWV numbers, or publishes unverified cutting methods.

## Changes in this release

| Finding | Corrective action | Verification |
|---|---|---|
| Homepage H1 lacked subject (only generic “Less guessing. More making.”) | Use an explicit **quilt fabric planning** H1 and supporting paragraph; retain the short brand slogan in visible body text. The existing `/calculators/` continues to own the distinct `quilt calculator` query. | Static SEO build + live H1 check |
| Website called “Quilt Studio” despite owner buying `quiltcutplanner.com` | Standardize page Title suffix, logo, footer/copyright, About, Privacy, OG site name and homepage first-party `WebSite` name to **Quilt Cut Planner**. Do not fabricate organization/reviews. | Static SEO build, schema inspection |
| Two long calculator page titles | Shorten Sashing and Yards-to-Inches titles without changing URL, keyword owner or functionality; also align other calculator Title suffixes. | Static titles and production rendering |
| Real About/method/feedback page was `noindex` | Make About **indexable on main production**, canonical to `/about/`. The About methods and limitations retain statements that physical sewing has not been certified. | Production build, Page HTML, live host check |
| Privacy was indexable but absent from production sitemap | Add `/privacy/` to sitemap and verify Canonical, consistency. | 12-URL Sitemap verification |
| About/Privacy inherited `WebApplication` JSON-LD | Only emit calculator application schema on real homepage/tool pages, not trust/legal pages. | Build + live no-fake-schema checks |
| Branding length may crowd mobile header | Adjust responsive header branding scale and hide redundant header CTA at narrow widths while retaining the Tools menu. | iPhone WebKit/Android simulated browser tests |
| Live CI previously assumed exactly ten sitemap URLs | Validate **10 homepage/tool routes + 2 indexable trust routes**; skip pre-deployment live SEO checks on PRs and wait for matching Cloudflare SHA before checking after main is deployed. | PR CI offline tests; post-merge true external header audit |
| GSC setup requested later, now explicitly deferred | No verification, no submission and no indexed-count claims. | No GSC account mutations |

## Unchanged protections

- Only the official Cloudflare Pages `main` production build enables indexation for its **12 approved URLs**.
- The `pages.dev` mirror must deliver HTTP `X-Robots-Tag: noindex` even though the static document shares indexable HTML.
- Non-production branch previews retain `noindex` HTML; `/lab/*` and `/qa/*` are always nonindexed.
- Bias, diagonal backing, mitered corner, rag and square algorithms remain excluded/HOLD. No thin doorway pages added.
- The 218 original Semrush records and one-intent-per-calculator keyword assignments remain unchanged.
- Real physical sewing or paper calibration has not been certified.

## Account-side limitation — www

As of the current DNS checks, `www.quiltcutplanner.com` has no A/CNAME record. The GitHub repository cannot create DNS records or Cloudflare zone-level redirect rules without Cloudflare account authorization. The root apex `https://quiltcutplanner.com` works; this is a **www convenience issue**, not evidence that the main Google crawl is blocked.

Cloudflare's official guide: https://developers.cloudflare.com/pages/how-to/www-redirect/

To configure when desired:
1. In Cloudflare DNS create a **proxied** `A` record for `www` with `192.0.2.1` (official Cloudflare placeholder destination for redirect-only hostname; do not treat it as the site origin).
2. Create a **Bulk Redirect** source `www.quiltcutplanner.com` → target `https://quiltcutplanner.com`, status 301; enable matching subpaths, preserve path suffix and query string.
3. Verify actual HTTPS certificate and HTTP 301 `Location` on `www`, including deep paths, after DNS propagation.
Do not claim the redirect is active until tested. No site code change can compensate for missing www DNS.

## Performance and real SEO data limitations

The static Astro site uses local WebP assets and no remote Google Fonts dependence in the reviewed CSS. This release avoids unvalidated “performance optimizations” whose measured effects are unknown. Prior automated Chromium and simulated iPhone/Android functional testing are **not** PageSpeed, field LCP, INP, CLS or real-device certification. These metrics need separate reliable measurement; no numerical score is invented here. Actual Google indexed pages, impressions, click-through rate and rankings are **unknown** because GSC is deliberately deferred.

## Acceptance

This document is release evidence, not an assertion that every external service has been configured. Only treat this as deployed after a new `main` commit has passed all CI jobs and the actual custom domain has been checked. GSC and www DNS/redirect remain separate owner-side steps.

## 2026-11-08 independent CI audit follow-up

After the application SEO release was deployed, GitHub's separate `Quilt public Cloudflare Pages verification` workflow failed because `scripts/live-preview-smoke.mjs` still **incorrectly required the main-branch Pages mirror HTML** to contain `noindex` and omit canonical/sitemap/metadata, even though Cloudflare serves the same production static HTML on both apex and Pages mirror. The **real** pages.dev `X-Robots-Tag: noindex` is the required protection and was independently verified in the live SEO host audit.

A narrow fix updates this additional live end-to-end browser workflow to validate the real production-mirror model: 10 calculator/home routes with indexable mirrored HTML, owned-domain canonical and real preview HTTP noindex, plus the 12-page production sitemap and indexed About/Privacy on production. The 10 original interactive calculator checks, QA/Lab exclusions and physical-method safety gates remain unchanged. An accidental over-escaped canonical exclusion regex for a research route was also corrected.

The separate mobile Lighthouse workflow previously used a **local preview noindex build** and reported simulated mobile Lighthouse **SEO=63**, even while the **live production site** was indexable. That 63 should **not** be reported as the production domain's SEO score. A revised Lighthouse workflow builds a local **simulated Cloudflare main production snapshot** (`CF_PAGES=1`, `CF_PAGES_BRANCH=main`) and logs individual failing SEO audits. Lab performance measurements are **not** real-user field LCP/INP/CLS and are not live public-host proof. Interpret the rerun only after its actual CI result.


## Final deployed acceptance — 2026-11-08
- PR #58 was merged; exact main SHA bfdf39d50ddca2b1c79727074ef81b6aec31c661 was observed on the owner-approved Cloudflare custom domain.
- The main-branch live audit passed the production host and Pages mirror for all 12 approved URLs, exact canonicals, HTTP preview noindex, sitemap, robots and research/QA/HOLD exclusions.
- The separate public Cloudflare browser smoke passed on exact SHA: all ten calculator/home routes plus two trust pages, public JS hydration, real sample/review workflow, multi-tab stale-data protection, safe exports and noindex physical-scale worksheet.
- The production-mode mobile Lighthouse rerun passed all 12 routes at 100 Performance / 100 SEO, with no failing SEO audits. These are lab results, not field Core Web Vitals.
- Current CI references: quality/production SEO/live host audit [42467960108](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960108); public Cloudflare smoke [42467960127](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960127); mobile Lighthouse [42467960113](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960113).
- Still deferred: GSC verification/submission, live query/index coverage, fresh localized SERP and Semrush metrics, field CWV, www alias, mail send/receive proof, AdSense setup and all physical signoffs.
