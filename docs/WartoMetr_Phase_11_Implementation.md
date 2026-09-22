# WartoMetr Phase 11 Implementation

Date: 2026-09-22

## Scope

Phase 11 makes the before-viewing assistant visible directly after the buyer
decision. It does not change valuation, risk scoring, verdicts or negotiation
semantics.

## Implemented

- Added a visible `Przygotuj mnie do oglądania` action block to the buyer
  decision panel.
- The block uses existing `pre_viewing` and `action_plan` data from the buyer
  decision package.
- Checklist cards show:
  - why the check matters;
  - what to inspect at the viewing;
  - what to ask the seller.
- Evidence remains source-backed through existing action-plan evidence and
  provenance details.
- The primary action now scrolls to the viewing-preparation block; negotiation
  remains available as a separate action when the verdict supports it.
- Mobile layout uses one-column checklist cards to avoid cramped text.

## Data Integrity

The implementation does not invent new risks or apartment facts. It only
reformats existing deterministic action-plan items and evidence labels. Missing
action-plan evidence falls back to an explicit unverified-information message.

## Verification Notes

Verification should cover:

- TypeScript compilation;
- production frontend build;
- rendered `/check` result desktop and mobile layout;
- CTA scroll/focus behavior;
- no horizontal overflow;
- no post-load console errors.
