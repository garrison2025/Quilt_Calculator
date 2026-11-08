# Quilt Cut Planner — approved domain and controlled SEO release (2026-11-08)

## Owner-provided facts (do not claim separately verified)
- Purchased primary domain: `quiltcutplanner.com`.
- Public contact mailbox: `contact@quiltcutplanner.com`. Mail delivery and inbox setup still require a real sent/received test.
- Domain attached to Cloudflare by the owner. The actual webpage is publicly accessible at `https://quiltcutplanner.com/`.

## Checked publicly on 2026-11-08
- `https://quiltcutplanner.com/` served the Quilt Studio website, source meta commit `a337c7f7f65c057b249433326240480559abca0e`.
- The same Git revision was visible at `https://quilt-calculator-566.pages.dev/`.
- The custom domain still returned HTML robots `noindex,follow` (not publicly indexable).
- Production `/sitemap.xml` was not present (404).
- OG/Twitter social preview image used a `pages.dev` origin: update comes only with an approved-domain, production-indexable build.
- `https://www.quiltcutplanner.com/` was not verified as a functional redirect/host. Configure optional www-to-apex 301/308 redirect in Cloudflare after confirming its TLS and DNS.
- These facts are a point-in-time external read, not a proof of a completed indexing launch or email deliverability.

## Already accepted software scope
Nine approved calculator intents plus home/Project Planner. No new calculator routes, keyword claims, bias yield estimates, unverified sewing methods, or real physical fabric claims are authorized by this domain purchase.

## Mandatory production release steps (owner Cloudflare account)
1. Workers & Pages → select the *existing* Pages project that serves `quilt-calculator-566.pages.dev` → Custom domains. Verify `quiltcutplanner.com` is attached and Active and HTTPS serves the correct project.
2. Settings → Variables and Secrets / Environment variables → **Production** build environment (not Preview), set `PUBLIC_SITE_URL` = `https://quiltcutplanner.com` and `PUBLIC_INDEXABLE` = `1`. They are public build-time settings, not secrets.
3. Trigger a **new production deployment from main**, rather than assuming changing an environment variable rewrites existing static HTML. Verify the source SHA after deployment.
4. Run `node scripts/check-live-hosts.mjs --production=https://quiltcutplanner.com` in a network-enabled Node 22+ environment. This is a *read-only gate*, not an indexing or DNS setter. It requires all ten approved pages on production to have correct absolute canonicals and indexable robots, and the same-source pages.dev copies to have HTTP `X-Robots-Tag: noindex`.
5. Verify `https://quiltcutplanner.com/sitemap.xml` has exactly ten production URLs; `robots.txt` must reference it; all experimental `/lab/` and `/qa/` URLs remain noindex and excluded from sitemap; unsupported tool pages return 404.
6. Because a single Pages project can expose the same static files on both hostnames, the sitemap may return 200 on pages.dev after enabling the production build. This is not a false-negative release failure provided **all <loc> URLs are https://quiltcutplanner.com/** and the pages.dev sitemap has an HTTP noindex header. The live host checker enforces this behavior. A 404 on preview is also allowed.
7. Set `www.quiltcutplanner.com` to redirect permanently to `https://quiltcutplanner.com` (not the reverse) if the www hostname is added. Ensure certificate/DNS and an actual 301/308 test; do not assume www is configured.
8. Verify the publicly visible `mailto:contact@quiltcutplanner.com` link. Separately send and receive a real test message to verify the mailbox and MX/SPF/DKIM/DMARC setup; the website alone cannot prove email delivery.
9. Add the domain to Google Search Console, complete actual domain ownership verification and submit `https://quiltcutplanner.com/sitemap.xml`. Record actual indexing/coverage results rather than calling this step complete based on successful submission.
10. If/when adding AdSense: use the actual account's approved publisher ID and ads.txt guidance, revise privacy/consent disclosures for deployed scripts and relevant visitor geographies, and verify non-obstructive ad placement. Do not invent publisher IDs or enable ad scripts prematurely.

## Release statuses
| Task | Status on 2026-11-08 |
|---|---|
| User-owned domain and contact email identified | OWNER_CONFIRMED |
| HTTPS custom apex loads live site | LIVE_OBSERVED |
| Production indexable HTML / canonical / sitemap | NOT_YET_DEPLOYED |
| Preview noindex isolation after production release | REQUIRES_LIVE_GATE |
| www redirects | NOT_VERIFIED |
| Mail sending and receiving | NOT_VERIFIED |
| GSC / AdSense account verification | NOT_CONFIGURED |
| Physical fabric / printer / accessibility manual signoff | OUTSIDE_ACCEPTED_SOFTWARE_SCOPE |
| Bias and other unverified special algorithms | HOLD |

## Safe rollback
If any production gate fails, reset Production `PUBLIC_INDEXABLE` to `0`, redeploy, and recheck noindex on both hosts. Do not mark release PASS until the failed condition is fixed and verified.
