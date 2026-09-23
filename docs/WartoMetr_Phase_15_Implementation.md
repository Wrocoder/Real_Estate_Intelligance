# WartoMetr Phase 15 Implementation

Date: 2026-09-23

## Scope

Phase 15 turns the existing buyer action-plan section into a due-diligence
workspace for the checked apartment.

This phase does not add document upload, OCR, AI document extraction or legal
advice. It displays the existing deterministic `buyer_decision.due_diligence`
data more clearly.

## Implemented

- Added a due-diligence workspace inside the buyer decision details.
- Displays explicit buyer-facing states:
  - verified;
  - requires check;
  - risk;
  - unknown;
  - insufficient data.
- Shows critical checks, risk signals, requested documents and seller questions.
- Keeps the existing action-plan checklist below the due-diligence overview.
- Added a clear caveat that the workspace is not legal advice and that KW,
  contract, deposit and technical condition require professional confirmation.
- Localized checklist labels using the existing buyer-decision message catalog.

## Data Integrity

The UI maps existing backend statuses without changing API semantics:

- `known` -> verified;
- `verify_required` -> requires check;
- `estimated` -> insufficient data;
- `unknown` and `not_applicable` -> unknown.

Risk count comes from existing `due_diligence.red_flags`.

No automated result is presented as legal certainty or clean-title
confirmation.

## Verification Notes

Verified:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `BROWSER_API_BASE_URL=http://127.0.0.1:8010 npm run browser:buyer-result`
  against local frontend plus local memory/demo API, with 26 passed and 0 failed.
