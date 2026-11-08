# Quilt Cut Planner — owner-approved production domain release (2026-11-08)

## Owner inputs and policy
- Owned main domain: **https://quiltcutplanner.com** (attached to existing Cloudflare Pages project).
- Public contact: **contact@quiltcutplanner.com** (mail forwarding DNS seen; real inbox receipt/sending not independently proven).
- On 2026-11-08 owner **explicitly requested removing the manual indexing environment-variable gate**. The official domain may be made indexable by publishing source code from main.
- Current accepted scope: 9 calculator intents + homepage = **10 original homepage/calculator URLs + 2 genuine trust pages = 12 sitemap URLs**. Lab/QA, unverified bias/diagonal/miter/rag/square methods remain nonindexable or unpublished. Physical print and fabric checks are not certified.
- One static Cloudflare Pages production build is served on both the custom domain and `quilt-calculator-566.pages.dev`: do not rely on differing static HTML for SEO. The latter MUST send `X-Robots-Tag: noindex` even when the HTML says `index`.

## Automatic build rules — no manual variables
- Cloudflare Pages injects `CF_PAGES=1`, `CF_PAGES_BRANCH=<branch>` automatically.
- **Only** `CF_PAGES=1` with `CF_PAGES_BRANCH=main` generates `index,follow,max-image-preview:large`, exact canonical `https://quiltcutplanner.com/<path>`, first-party OG image links, twelve-URL production sitemap and sitemap declaration in robots.txt.
- Cloudflare PR/branch previews, localhost, generic CI, and local builds retain `noindex,follow`, omit canonical and production sitemap.
- Independently of build mode, `/lab/*` and `/qa/*` are explicitly `noindex` with `public/_headers` plus HTML; the preview hostname and per-branch aliases are protected by hostname-specific noindex headers.
- The obsolete `PUBLIC_INDEXABLE` and `PUBLIC_SITE_URL` settings do **not** control this release. There is no need to configure them in Cloudflare.
- Note: Cloudflare Pages might expose the same physical `sitemap.xml` file at the pages.dev hostname. This does not make preview URLs indexable if `X-Robots-Tag: noindex` is present and the only `<loc>` entries point to `https://quiltcutplanner.com`.

## Verification gates (after Github main is deployed)
1. Ensure the Cloudflare Pages project `quilt-calculator` builds and deploys **main** from GitHub (Production branch). No manual Cloudflare env work is required.
2. Verify `https://quiltcutplanner.com/` serves the new exact main `<meta name="quilt-build-commit">` and its HTML robots tag is `index,follow,max-image-preview:large`; production response header MUST NOT include `noindex`. Check the 10 approved calculator/home URLs plus About and Privacy.
3. Each of the 12 indexable routes must have one exact absolute canonical URL on `https://quiltcutplanner.com/` (never pages.dev).
4. Verify `https://quiltcutplanner.com/sitemap.xml` HTTP 200 with exactly the ten approved calculator/home URLs plus About and Privacy; `https://quiltcutplanner.com/robots.txt` references it.
5. Verify `https://quilt-calculator-566.pages.dev/` and all approved preview copies return HTTP `X-Robots-Tag: noindex`, matching production's Git SHA and with no accidental alternative canonical destination.
6. Verify `/lab/*` and `/qa/*` on **both** domains remain noindex, and HOLD keyword URLs are 404.
7. Run read-only release audit with Node 22+: `node scripts/check-live-hosts.mjs --production=https://quiltcutplanner.com`. It must PASS after the deploy. It checks each source SHA, index meta, canonical, HTTP headers, sitemap, lab/QA and HOLD.
8. If www is desired, add `www.quiltcutplanner.com` DNS/TLS and an actual permanent 301/308 redirect **to the apex**, not a second indexable website. At the time of initial check, www DNS was not found.
9. Separately test that `contact@quiltcutplanner.com` **receives** a sent message and that outbound replies work. MX SPF records are not sufficient proof of deliverability.
10. **GSC is expressly deferred by the owner** as of 2026-11-08: no account verification or sitemap submission authorized in this phase. Later, when approved, domain ownership verification and sitemap submission are separate from software deployment. AdSense also requires separate publisher configuration and accurate privacy/consent work.

## Evidence and statuses
- Prior to this no-env code release, the registered custom domain was live but HTML carried `noindex` and sitemap was 404.
- The PR CI runs both a **no-env, noindex** build with full quality/browser tests and a **simulated official Cloudflare main** build with index/canonical/sitemap validation.
- Each live external observation requires timestamped confirmation; merging code alone is not proof that Cloudflare published it.
- If post-release audit fails, correct code/configuration; do not falsely report launch PASS. If an unsafe production noindex/preview-isolation issue arises, revert the SEO release PR and redeploy main to return to noindex.

## Site architecture note
A single static bundle is served at the production custom host **and** its pages.dev host. The exact same meta robots tag may appear in both. That is safe only because Cloudflare Pages sends the HTTP `X-Robots-Tag: noindex` header on the preview host; Cloudflare explicitly documents this policy in its Pages `_headers` and preview-deployment docs. Verify this on the real hosts after the release.


## Exact production deployment verification — 2026-11-08
- Deployed commit: bfdf39d50ddca2b1c79727074ef81b6aec31c661 on main.
- The post-merge workflow waited until https://quiltcutplanner.com/ exposed the exact expected quilt-build-commit value, then passed the read-only dual-host audit: [CI run 42467960108](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960108).
- All 12 approved routes passed production indexability + exact canonical checks on the custom domain and HTTP X-Robots-Tag noindex on the Pages mirror. Research/physical worksheets remained nonindexed on both hosts; sitemap, robots and HOLD exclusions passed.
- The independent public Cloudflare interaction workflow passed the exact same SHA and exercised the deployed site, including review, import, stale-tab, export, print and recovery protections: [run 42467960127](https://github.com/garrison2025/Quilt_Calculator/actions/runs/42467960127).
- The earlier conditional checklist above is now verified for this commit, except for separately listed account/physical/manual items such as GSC, email deliverability, optional www redirect and actual paper/fabric measurements.
