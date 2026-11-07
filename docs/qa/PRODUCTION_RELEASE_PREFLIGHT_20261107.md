# Production domain / pages.dev isolation gate — 2026-11-07

## State and scope

**NOT_RUN on a real production domain.** The owner has not purchased or authorized a custom domain. The existing Cloudflare Pages preview remains **noindex,follow**. This change is an engineering guard, not a domain purchase, actual launch, GSC verification, physical sewing signoff, or AdSense configuration.

The high-risk failure mode is host confusion: a production-indexable Astro build can also be served at a pages.dev alias. A build-time canonical/robots check alone cannot prove that the alias remains nonindexed. The actual HTTP response, final URL and HTML must be checked **on both hosts** after the domain is attached.

## Already executable now: production-mode dry-run

CI runs a *separate* production build with the reserved host https://quilt.example, using PUBLIC_INDEXABLE=1. This never uploads or deploys that hypothetical build. It verifies that the ten approved page routes contain exactly the expected index robots and absolute canonical URLs, and that research/physical QA pages remain noindex without canonical. The ordinary preview job continues to test a separate noindex build.

The same CI runs the offline self-test command:

    node scripts/check-live-hosts.mjs --self-test

This checks the live release preflight's parsing, canonical, response and header guard logic **without making any network requests**.

## Future operation: real host release only after owner approval

1. Purchase/approve a real domain and explicitly configure the separate production-host indexing release. Never turn PUBLIC_INDEXABLE on merely to accelerate the no-domain preview.
2. GitHub Actions → **Quilt approved-domain dual-host release preflight** → Run workflow → enter the exact real HTTPS origin, e.g. https://your-registered-domain.com, with no trailing path.
3. Inspect the check logs. It requires 10 distinct indexable production paths, exact absolute canonical, WebApplication metadata, consistent source SHA, preview meta+HTTP noindex and *no preview sitemap*. It separately checks noindex on eight experimental/physical QA paths at both hosts, exact ten-URL sitemap, production robots Sitemap line and three HOLD paths returning 404.
4. A **FAIL is a release blocker**. In particular, if pages.dev serves indexable meta from a shared production build, do not waive the preflight merely because its HTTP header says noindex. Use independently verified host isolation/redirects/deployments, then rerun.
5. After PASS, independently confirm Cloudflare domain ownership/HTTPS, chosen www/non-www and redirects, public images, GSC site ownership, user consent/ads policies, human accessibility checks, physical print/ruler measurements and actual fabrics. This script deliberately does not claim those are completed.

## Honest boundaries

- The script is **read-only**. It cannot enable indexing, create a domain, push a deployment, inspect GSC accounts, approve ads, or measure real physical sewing.
- A pass establishes a **point-in-time live response snapshot** across checked paths, not Google's eventual indexing behavior. It cannot replace Search Console, field INP/CrUX or manual content/physical signoff.
- Preview and production must refer to the same 40-character Git SHA to prevent mislabeling two different versions as a successful split-host check.
- The original 47 release-gate statuses are unchanged. The current milestone remains **software preview accepted**, **production search release WAIT_DOMAIN**.

Evidence once executed: link to the individual GitHub Actions run and the matching deployed commit. Do not substitute a passing local production dry-run for a live host verification.
