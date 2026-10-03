# WartoMetr Phase 21 Implementation

Date: 2026-09-28

## Scope

Phase 21 hardens the optional buyer outcome prompt on the apartment-check result
page.

The goal is to make decision-impact measurement clearer and safer without
starting a new B2B or geographic expansion phase before the commercial
validation gate is met.

## Changed

- Made the result-page outcome prompt explicitly privacy-bounded in the UI.
- Reset the selected impact answer when the buyer changes the selected outcome.
- Prevented multiple `buyer_outcome` events from one rendered result.
- Added an explicit intermediate state telling the buyer to choose whether the
  analysis influenced the decision before the anonymous answer is sent.
- Added accessible pressed states to the outcome and impact chips.
- Extended frontend smoke checks to guard the outcome prompt and canonical
  `buyer_outcome` funnel event.
- Updated the product analytics contract documentation with the one-event local
  prompt behavior.

## Analytics Integrity

- No fair-value, verdict, confidence, comparable-property, risk, negotiation,
  payment or ingestion semantics were changed.
- The existing `buyer_outcome` schema remains categorical only:
  outcome plus decision-impact category.
- No listing URL, listing id, address, account id, report/order id, notes or
  free text is sent with the event.
- This phase improves measurement hygiene only. It does not claim commercial
  validation, paid demand or product-market fit.

## Verification

Run after implementation:

- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Remaining Work

- Render-check the prompt on desktop and mobile after the existing broad
  `/check` browser hydration warning is resolved.
- Aggregate real buyer outcomes only through the existing admin funnel summary;
  do not join outcome events to private listings, users or billing records.
- Keep B2B Pro and second-city expansion behind the commercial validation gate.
