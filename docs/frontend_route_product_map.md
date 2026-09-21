# Frontend Route Product Map

This map records the intended product role for every current `frontend/app` route during the consumer productization work. It keeps backend contracts and existing route files intact, but separates discovery pages, the core buyer journey, contextual tools, pro/internal surfaces, and admin tooling.

Primary consumer navigation:

- `/` and `/check` - shared apartment check: import an Otodom or OLX URL, confirm details, then request a buyer verdict.
- `/search` - apartment search for buyers who are still looking. Recognized legacy root search queries redirect here with their parameters preserved.
- `/saved` - My apartments for saved checks and listings; `/check/drafts` remains a compatibility redirect.
- `/compare` - comparison entry and selected-apartment comparison.
- `/guides` - buyer guides.
- `/methodology` - public methodology and trust explanation.
- `/areas` - area decision support.
- `/account` - profile/account.

## Route Classification

| Route | Classification | Current role | Product direction |
| --- | --- | --- | --- |
| `/` | Consumer primary | Shared URL-first apartment check | Primary buyer entry. |
| `/check` | Consumer primary | Same apartment check, including saved-draft and area-context entry | Preserve existing links and recovery. |
| `/search` | Consumer discovery | Existing listing filters, map, selection and pagination | Preserve search and contextual alerts. |
| `/saved` | Consumer primary, authenticated/personal | Saved checks and listings | My apartments; do not index. |
| `/check/drafts` | Compatibility redirect | Redirects to `/saved` | Preserve older links; do not index. |
| `/areas` | Public discovery + consumer primary | Area index | Keep public and in sitemap. |
| `/areas/[areaId]` | Public discovery + contextual | Area detail | Keep public and in sitemap via static area pages. |
| `/areas/compare` | Contextual | Area comparison | Keep reachable from Areas, but not primary sitemap. |
| `/guides` | Public acquisition | Editorial guide index | Keep public and in sitemap. |
| `/guides/[guideId]` | Public acquisition | Editorial guide detail | Keep public and in sitemap via static guide pages. |
| `/methodology` | Public trust | Methodology, confidence, limits and backtesting explanation | Keep public and in sitemap; publish validated metrics only after data-quality review. |
| `/listings/[id]` | Contextual | Listing detail from search | Keep reachable from search/comparison; not a standalone discovery route. |
| `/compare` | Contextual decision tool | Compare selected apartments | Keep reachable after selecting 2-4 apartments; do not index until it has a useful empty-state entry. |
| `/alerts` | Contextual retention tool | Alert management | Keep reachable from saved apartment/search; do not index. |
| `/mortgage` | Contextual calculator | Standalone mortgage calculator | Move primary usage into property analysis; do not promote standalone route. |
| `/pricing` | Monetization/contextual | Report purchase and plan surface | Keep reachable from property/report context; do not index while mock/manual references remain. |
| `/reports` | Personal/pro workspace | Generated report list and creation | Keep out of primary consumer navigation; do not index. |
| `/account` | Personal/pro workspace | Profile, subscription and CRM workspace | Keep as profile entry; later split consumer account from agency CRM. |
| `/developers` | Pro/contextual evidence | Developer ranking | Keep reachable from developer evidence blocks; not primary consumer navigation. |
| `/developers/[developerId]` | Pro/contextual evidence | Developer profile | Keep reachable from developer evidence blocks; not primary consumer navigation. |
| `/market` | Internal/pro analytics | Market dashboard | Move useful area insights into `/areas`; do not index. |
| `/news` | Contextual content | Area news list | Keep reachable from area/listing context; not primary consumer navigation. |
| `/beta` | Legacy/acquisition | Buyer beta landing | Keep available for direct campaigns only; do not index as production surface. |
| `/realtors` | Pro/acquisition | Realtor landing | Keep available for direct campaigns only; do not index as consumer surface. |
| `/admin` | Admin/internal | Ingestion/admin console | Keep blocked from search indexing and outside public navigation. |

## Sitemap And Robots Policy

The public sitemap should contain only:

- `/`
- `/check`
- `/search`
- `/methodology`
- `/areas`
- `/guides`
- static `/areas/[areaId]` pages
- static `/guides/[guideId]` pages

Contextual, personal, pro, beta, and admin routes remain accessible by direct navigation or product links, but they should not be promoted as public discovery routes until their UX matches the consumer product standard.

## Apartment Check Entry

`CheckListingExperience` owns the workflow for both entry routes. Import does not run an analysis automatically: buyers review extracted fields and complete missing location/market values first. A new URL clears property-specific fields. Area context may prefill manual entry but is not treated as an imported fact.

Authentication errors offer in-place sign-in. Entry state is retained in session storage for up to 30 minutes for the same query string, with in-memory recovery when storage is unavailable. Saved-draft URLs restore the owner-scoped API result instead. These changes do not alter API contracts or valuation formulas.

## Next Cleanup Implications

- Move consumer-relevant mortgage, reports, alerts, developer, and market data into the apartment or area context.
- Split `/account` into a normal buyer profile view and hidden/pro agency CRM sections.
- Remove public copy that exposes implementation terms such as mock payments, listing IDs, area IDs, private draft wording, and score thresholds.
- Revisit sitemap/robots after the monetization UX is production-ready.
