# Approved calculators — copied result-summary acceptance, 2026-11-07

**Scope:** existing nine approved calculator intents, including the homepage Project Planner. No new SEO URL or experimental cutting algorithm.

## User benefit

The original calculator provided numerical results and downloads (JSON, cut CSV, shopping CSV and print where appropriate), but no convenient short text to paste into project notes or messages. The new **Copy result summary** action copies an accepted, current on-screen result to the user's local clipboard. It does not send measurements to any server. A blocked clipboard leaves existing JSON/CSV downloads available; failure is announced honestly.

Each copied text shows the calculation name, FNV-like short source project tag, calculator version, actual calculation timestamp, entered/finished dimensions context, current readiness state, up to 28 on-screen numerical result cards, up to 35 per-SKU summary lines and up to 12 on-screen warnings or price disclosures. More extensive materials must be exported as source-matched CSV/JSON instead. User-entered material labels are flattened to bounded plain text, not interpreted as code or CSV formula cells.

## Safety cases

- **Accepted, feasible calculation:** explicitly described only as computationally feasible for entered measurements, **never** independently sewn/certified. It is not a full cutting schedule.
- **Whole-project incomplete, unchecked or impossible:** copied text says **NOT A PURCHASE ORDER**, with actual readiness code `TOP_CUT_LIST_NOT_REVIEWED`, `FIT_IMPOSSIBLE` or `NO_PHYSICAL_CUTS`. An incomplete summary is useful for troubleshooting, not purchasing.
- **Yard/inch/cm converter:** clearly `LENGTH CONVERSION ONLY` and not usable width, fabric area, purchase yardage or price.
- **Example data:** explicitly `SAMPLE PROJECT` and instructs the user to replace dimensions, fabrics and quantities.
- **Invalid/in-progress edit:** immediately revokes the previous summary and disables Copy alongside existing stale JSON/cut exports.
- **Another browser tab changed the saved project:** Copy is disabled on storage conflict or resume, and its click handler synchronously re-checks storage before accessing clipboard.
- **Unreadable protected local autosave:** must not expose obsolete calculation summaries.
- **Clipboard denied:** attempts the browser's local selection fallback; does not incorrectly state that text was copied when both are refused.

## Test and release gates

- Pure formatter tests cover accepted and incomplete statuses, converter scope, identifiers, sample marking, bounded user-entered material text, limits and malformed inputs.
- Chromium exercises the real Copy button on all 10 approved pages, inspecting its actual generated text (only clipboard permission is stubbed), plus rejection after invalid converter inputs and after a cross-tab conflict.
- TypeScript, Vitest, Astro/static unique URL/keyword/noindex checks, independent browser/print/mobile QA and exact-main Cloudflare preview are required before declaring completion.
- The original 218-row source keyword allocation (202 mapped / 16 HOLD) remains unchanged; no new indexable route or canonical on the unpurchased pages.dev preview.

**PHYSICAL FABRIC, BUYING AND UNVERIFIED BIAS GATES: unchanged.** Even a copied 'computed cut layout feasible' result is not independent sewing proof or a verified real fabric purchase.
