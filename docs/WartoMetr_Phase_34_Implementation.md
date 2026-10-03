# WartoMetr Phase 34 Implementation

Date: 2026-10-02

## Scope

Phase 34 adds a focused browser-quality scenario for the listing decision
hierarchy.

The goal is to make the first listing-result screen reproducible without
running the entire broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=listing-decision` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - desktop and mobile listing decision hierarchy;
  - buyer decision before evidence, actions and secondary analysis;
  - secondary evidence and analysis start collapsed;
  - primary contextual actions are visible;
  - negotiation action reveals its supporting evidence.
- Added smoke coverage so the focused listing-decision scenario remains wired.
- Updated the documentation index with Phase 34.

## Product Integrity

- No verdict, valuation, confidence, risk, negotiation or evidence calculation
  semantics were changed.
- The scenario preserves the decision-first contract: the buyer sees the
  conclusion and useful actions before detailed analytics.

## Verification

Run after implementation:

- `npm run smoke` — passed with 940 assertions.
- `BROWSER_QUALITY_SCENARIO=listing-decision npm run browser:quality`
  — passed against a local memory-backed backend/frontend pair:
  - desktop listing decision hierarchy at 1440px;
  - mobile listing decision hierarchy at 390px;
  - collapsed evidence/secondary sections and negotiation action reveal.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- The full local `npm run browser:quality` suite is not required for this
  focused phase unless the listing-decision scenario exposes a shared
  regression.

## Remaining Work

- If the broad browser-quality suite still fails after this phase, continue
  with the next failing scenario as another narrow phase rather than weakening
  decision-hierarchy assertions.
