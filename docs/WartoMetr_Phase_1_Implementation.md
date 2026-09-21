# WartoMetr Phase 1: Apartment Check Entry

Date: 2026-09-16. Scope: complete the in-progress Phase 1 from the product transformation roadmap. Phase 2 has not been started.

## Implemented

- `/` and `/check` share `CheckListingExperience`. The homepage prioritizes checking a listing; the existing explorer is preserved at `/search`.
- Recognized legacy root search queries redirect to `/search` with their values retained. Navigation and contextual search links use the explicit search route.
- URL import stops for review of extracted parameters. Missing district, city and market are not inherited from another apartment or the area-page context. Buyers complete required fields before analysis.
- New URLs clear property-specific values. Manual entry, area-prefilled entry, saved-draft reopening and import retry remain available.
- Authentication failures offer in-place sign-in. Session storage preserves the entry for up to 30 minutes for the same query. Anonymous entry checks session availability before requesting a private buyer profile, avoiding an unsolicited authentication notice.
- Results collapse the entry section, with edit and new-check actions. Save status remains visible beside result actions after the form collapses. Full-report creation is disabled until edited details have been analyzed.
- Updated route documentation and affected browser checks; added `npm run browser:check-entry`.

No backend/API contract, database schema, valuation formula or decision methodology was changed.

## Verification

Passed on the final application build:

- `npm run build`, including Next.js lint and TypeScript validation.
- Separate `npm run lint` and `npm run typecheck` during implementation.
- `npm run smoke`: 848 assertions.
- `node scripts/check-entry.mjs`: 15 cases. PL/EN/RU/UK entry and confirmation at 1440, 768 and 390 pixels; no premature analysis; reload recovery; old-property clearing; anonymous entry; legacy search redirect; area-context separation; sign-in preservation; one analysis request; saved-draft reopening; new-check reset.
- `node scripts/check-recovery.mjs`: all three groups passed, covering loading and report/save retries, partial/unsupported imports in four languages, and an actionable report error.
- Entry/confirmation cases check console errors, uncaught exceptions, failed requests, a single heading and horizontal overflow. Expected authentication failures are exercised separately.
- Inspected desktop entry and mobile entry/confirmation screenshots. Artifacts are in `frontend/artifacts/check-entry/`.
- `git diff --check` passed.

The browser plugin failed to connect because the environment omitted `sandboxPolicy`; verification used the repository's standalone Playwright installation instead.

The local frontend runs at `http://127.0.0.1:3000`; its existing `.env.local` selects API port 8010. The API was started in explicit test/demo mode with memory stores, disabled report artifact storage and disabled email/Telegram delivery. Environment files were not modified. Browser commands therefore used `BROWSER_API_BASE_URL=http://127.0.0.1:8010`.

## Not Verified And Remaining Risks

- Browser imports use controlled fixtures. These tests do not certify live Otodom/OLX access, extraction accuracy or source permissions.
- Authentication and analysis run against the local memory-backed API. The anonymous-entry guard is tested with an explicit unauthenticated session response; a deployed production environment was not exercised.
- The full browser-quality suite, backend suite, persistent-database integration and external map-provider reliability were not run as part of this continuation. Only the affected browser-quality entry/manual-input expectations were updated.
- Existing report data-integrity/payment findings and comparison of saved private checks remain as documented in the Phase 0 audit. This phase does not certify commercial readiness or repair those later-phase capabilities.
- The local API contains demo data and must not be mistaken for market evidence. Its changes are ephemeral and disappear when the process stops.

## Main Files

- `frontend/components/CheckListingExperience.tsx`
- `frontend/components/ExplorerExperience.tsx`
- `frontend/app/page.tsx`, `frontend/app/check/page.tsx`, `frontend/app/search/page.tsx`
- `frontend/lib/checkEntryMessages.ts`, `frontend/lib/searchRouting.ts`
- `frontend/components/LocalizedNavigation.tsx` and contextual search links
- `frontend/scripts/check-entry.mjs`, `frontend/scripts/check-recovery.mjs`, `frontend/scripts/browser-quality.mjs`, `frontend/scripts/smoke-ui.mjs`
- `docs/frontend_route_product_map.md`

Next recommended phase: Phase 2, consolidating the result hierarchy using existing decision and evidence components.
