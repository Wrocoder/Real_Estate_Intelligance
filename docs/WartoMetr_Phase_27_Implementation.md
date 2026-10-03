# WartoMetr Phase 27 Implementation

Date: 2026-10-02

## Scope

Phase 27 turns the newest focused browser checks from Phases 21-26 into one
release-gate command that can run in CI alongside the existing broad browser
quality suite.

The goal is not to add product surface. It is to protect the buyer decision
workflow and the privacy-safe aggregate admin funnel before starting any larger
post-validation work.

## Changed

- Added `npm run browser:release-gate`.
- Added `frontend/scripts/browser-release-gate.mjs` to run:
  - the privacy-safe buyer outcome prompt check;
  - the aggregate-only admin buyer funnel check.
- Kept the existing CI browser-quality step and added the focused release-gate
  command after it.
- Extended CI failure artifact upload to include check-entry and admin-funnel
  screenshots.
- Added smoke coverage so the release-gate command keeps the buyer/admin checks
  wired together.

## Product Integrity

- No valuation, confidence, risk, negotiation, fair-price or product analytics
  semantics were changed.
- No B2B, CRM, dashboard or nationwide expansion work was started.
- The admin funnel check remains aggregate-only and does not expose raw journeys,
  users, listings, reports, orders or URLs.

## Verification

Run after implementation:

- `npm run smoke` — passed with 899 assertions.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run browser:release-gate` — passed against local frontend/backend:
  - buyer outcome prompt passed;
  - admin funnel passed on desktop and mobile.
- `git diff --check` — passed.

## Not Verified

- CI execution itself was not observed until the workflow runs on GitHub.
- The release gate still uses the deterministic local backend and mocked admin
  responses; it is not a live production-data validation.
- The broad historical `npm run browser:quality` suite was attempted separately
  against the local dev server and did not pass in that environment because of
  pre-existing broad-suite failures around public admin-route separation,
  compare rendering/API timeouts, provenance visibility, mobile keyboard
  navigation and localized action-plan assertions. This phase keeps that suite
  as its own CI gate rather than treating those broad failures as Phase 27
  implementation changes.

## Remaining Work

- Keep the gate focused on buyer decision quality and privacy boundaries.
- Add only high-value browser checks; avoid turning the gate into a slow
  catch-all for unrelated internal pages.
