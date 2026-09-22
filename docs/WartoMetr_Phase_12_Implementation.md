# WartoMetr Phase 12 Implementation

Date: 2026-09-22

## Scope

Phase 12 turns the existing post-viewing recalculation into a return workflow
for a buyer who has already seen the apartment. It preserves the original
analysis, applies only buyer-entered observations and explains what changed.

## Implemented

- Added `layout` to structured post-viewing observations so buyers can record
  functional layout problems separately from general condition.
- Extended deterministic post-viewing adjustments to price in layout issues and
  include them in applied findings, due-diligence red flags and next actions.
- Updated the post-viewing UI with:
  - condition, renovation, windows, noise, sunlight, smell, moisture, common
    areas, kitchen/bathroom and layout observations;
  - original verdict versus updated verdict;
  - risk and offer-ceiling adjustment;
  - a clear `What changed` explanation;
  - applied findings and next actions.
- Restored the last post-viewing recalculation on return to the same listing or
  draft from browser storage, keyed by apartment and buyer decision model
  version.
- Added browser smoke coverage for recalculation, updated verdict display and
  restoration after reload.

## Data Integrity

The workflow does not create new apartment facts by itself. Recalculation uses
only submitted observations and existing deterministic buyer-decision logic.
The original decision package remains available in the recalculation response.

The local restoration layer is a client convenience, not authoritative account
storage. Server-side draft persistence can still be added later if multi-device
continuity becomes part of the requirement.

## Verification Notes

Verified:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `python -m pytest tests/test_buyer_decision.py tests/test_api.py tests/test_user_submitted_listing_analysis.py`
- `npm run browser:buyer-result` against local API/frontend with 24 passed and
  0 failed, including the new post-viewing reload scenario.
