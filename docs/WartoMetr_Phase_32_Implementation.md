# WartoMetr Phase 32 Implementation

Date: 2026-10-02

## Scope

Phase 32 adds a focused browser-quality scenario for the buyer action plan.

The goal is to make action-plan localization, checklist persistence, evidence
disclosure and copy/export behavior reproducible without running the entire
broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=buyer-action-plan` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - localized buyer-decision/action-plan text in Polish, English, Russian and
    Ukrainian;
  - no internal action or risk codes leak into the consumer UI;
  - desktop and mobile checklist completion persistence;
  - action evidence provenance disclosure;
  - copy/export content for the buyer's plan.
- Added smoke coverage so the focused action-plan scenario remains wired.
- Updated the documentation index with Phase 32.

## Product Integrity

- No verdict, valuation, risk, negotiation, due-diligence or action-plan
  generation semantics were changed.
- The scenario preserves the action layer contract: the buyer sees concrete
  next steps, evidence remains inspectable, and implementation codes stay out
  of public UI.

## Verification

Run after implementation:

- `npm run smoke` — passed with 930 assertions.
- `BROWSER_QUALITY_SCENARIO=buyer-action-plan npm run browser:quality`
  — passed against a local memory-backed backend/frontend pair:
  - Polish, English, Russian and Ukrainian localized action-plan surfaces;
  - desktop and mobile checklist persistence;
  - action evidence disclosure and copy/export behavior.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- The full local `npm run browser:quality` suite is not required for this
  focused phase unless the action-plan scenario exposes a shared regression.

## Remaining Work

- If the broad browser-quality suite still fails after this phase, continue
  with the next failing scenario as another narrow phase rather than weakening
  action-plan assertions.
