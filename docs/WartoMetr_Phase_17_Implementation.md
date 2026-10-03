# WartoMetr Phase 17 Implementation

Date: 2026-09-24

## Scope

Phase 17 extends privacy-safe product analytics for the buyer decision funnel.

This phase is local-only and does not deploy analytics changes to any hosted VM.
It does not change fair-price, confidence, comparable-property, risk or verdict
semantics.

## Implemented

- Added canonical Phase 17 funnel events while keeping existing event names:
  - `landing_viewed`;
  - `listing_parsed`;
  - `analysis_completed`;
  - `result_viewed`;
  - `saved`;
  - `payment_started`;
  - `payment_completed`;
  - `buyer_outcome`.
- Preserved existing events such as `check_completed`, `verdict_viewed`,
  `property_saved`, `checkout_started` and `purchase_completed` for backwards
  compatibility.
- Added allowlisted categorical values for optional anonymous buyer outcomes:
  - outcome: `bought`, `negotiated`, `rejected`, `still_checking`;
  - decision impact: `yes`, `no`, `unsure`.
- Instrumented the check-first landing/check flow for landing, URL parsing,
  analysis completion, result view, save/track and optional outcome events.
- Instrumented pricing checkout with Phase 17 payment aliases.
- Added a compact optional `/check` result prompt asking what the buyer did
  after the analysis and whether WartoMetr influenced the decision.

## Privacy Boundary

The product analytics contract remains categorical and write-only for consumer
events. The implementation does not send listing URLs, listing ids, draft ids,
report/order ids, addresses, coordinates, free-text notes, email, phone,
billing details or user-account foreign keys.

Outcome tracking is intentionally anonymous and optional. It records only the
selected categories needed to measure whether WartoMetr supports real buyer
decisions.

## Verification Notes

The relevant verification target for this phase is:

- backend product analytics contract tests;
- frontend OpenAPI type generation;
- frontend typecheck/lint/build;
- rendered `/check` desktop and mobile inspection.

Deployment and hosted analytics state are intentionally out of scope because the
OCI VM was removed and current work is local-only.
