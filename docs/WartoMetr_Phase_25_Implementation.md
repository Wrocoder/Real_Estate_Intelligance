# WartoMetr Phase 25 Implementation

Date: 2026-09-29

## Scope

Phase 25 adds an internal, privacy-safe north-star analytics view for the buyer
decision funnel.

The goal is to let the team monitor whether buyers move from apartment checks
to completed analysis, optional outcome feedback and payment without exposing
raw journeys, users, listing URLs, reports or orders.

## Changed

- Added a `Buyer decision funnel` panel to the internal admin dashboard.
- Reused the existing `GET /api/v1/admin/product-funnel?days=30` aggregate API.
- Derived started checks, completed checks, helpful buyer decisions, paid checks
  and repeat check signal from stage-level aggregate counts.
- Added a stage table with unique-journey and event counts.
- Added frontend smoke coverage for the admin aggregate panel and privacy copy.
- Documented the admin funnel interpretation in the product analytics contract.

## Analytics Integrity

- No product analytics event schema, allowed properties, backend storage or
  endpoint contract was changed.
- No valuation, confidence, risk, negotiation or fair-value methodology was
  changed.
- `Helpful buyer decisions` is based on aggregate `buyer_outcome` journeys.
- `Repeat check signal` is only the aggregate difference between
  `check_started` event count and unique journeys. It is not a user-level repeat
  buyer metric.

## Verification

Run after implementation:

- `git diff --check`
- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

All commands passed. The frontend smoke suite passed with 887 assertions.

## Not Verified

- The rendered `/admin` page was not browser-tested in this phase. The route
  depends on many admin API calls and there is no focused browser harness for
  this internal page yet.
- No backend tests were run because this phase reuses the existing aggregate API
  and does not change backend behavior.

## Remaining Work

- Add a focused `/admin` browser harness or mocked admin API route when this
  dashboard becomes part of the release gate.
- Keep the panel aggregate-only. Do not join product analytics events to user,
  listing, report or billing records.
