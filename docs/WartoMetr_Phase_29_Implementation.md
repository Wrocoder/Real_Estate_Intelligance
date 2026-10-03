# WartoMetr Phase 29 Implementation

Date: 2026-10-02

## Scope

Phase 29 separates the public browser-quality gate from the internal admin
browser harness in CI.

The goal is to preserve the public production-route boundary for `/admin` and
`/market` while still verifying the aggregate-only admin buyer funnel from
Phase 26.

## Changed

- Set `INTERNAL_ROUTES_ENABLED=false` for the main CI browser-quality frontend.
- Kept the broad public `npm run browser:quality` gate on port `3000`.
- Ran the privacy-safe buyer outcome browser check against the public frontend.
- Started a second internal frontend on port `3001` with
  `INTERNAL_ROUTES_ENABLED=true`.
- Ran `npm run browser:admin-funnel` against the internal frontend only.
- Uploaded the internal frontend log on browser-gate failure.
- Added smoke coverage so CI keeps public and internal browser gates separated.

## Product Integrity

- No buyer-facing route, valuation, confidence, risk, negotiation, fair-price or
  product analytics semantics were changed.
- `/admin` and `/market` remain guarded by the existing
  `InternalRouteBoundary`.
- The admin funnel harness still uses mocked aggregate admin data and does not
  render raw journeys, users, listings, reports, orders or URLs.

## Verification

Run after implementation:

- `npm run smoke` — passed with 915 assertions.
- `BROWSER_QUALITY_SCENARIO=production-route-separation npm run browser:quality`
  — passed against local frontend with `INTERNAL_ROUTES_ENABLED=false`.
- `npm run browser:admin-funnel` — passed against a separate local frontend on
  port `3001` with `INTERNAL_ROUTES_ENABLED=true`.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself was not observed until the workflow runs remotely.
- The full local `npm run browser:quality` suite was not rerun in this phase.

## Remaining Work

- Continue fixing the remaining broad browser-quality failures in separate,
  focused phases.
- Keep new internal/pro browser checks on an explicitly internal frontend rather
  than weakening the public route-separation gate.
