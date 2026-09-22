# WartoMetr Phase 13 Implementation

Date: 2026-09-22

## Scope

Phase 13 improves the negotiation assistant presentation. It uses the existing
deterministic negotiation scenario, evidence references and guardrails. It does
not change fair-price, offer-ceiling or negotiation-score calculations.

## Implemented

- Replaced the consumer-facing `Realistic deal` wording with `Target range` so
  the UI does not imply a predicted accepted transaction price.
- Added a concise seller/agent message generated from existing structured
  negotiation data:
  - suggested opening offer;
  - target range;
  - maximum rational price;
  - evidence-backed reasons;
  - a condition that documents, technical state and costs still need checking.
- Added a separate copy action for the seller/agent message while preserving
  the full negotiation brief copy action.
- Kept negotiation evidence visible through existing provenance details.
- Added browser smoke coverage for the negotiation assistant, including the
  target-range label, seller message and copy action.

## Data Integrity

The message is derived only from the available negotiation scenario and
localized evidence-backed arguments. It avoids claims that the seller will
accept a given price and keeps the scenario conditional.

When the negotiation scenario is unavailable, no seller message is generated.

## Verification Notes

Verified:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run browser:buyer-result` against local API/frontend with 25 passed and
  0 failed, including the new negotiation-assistant scenario.
