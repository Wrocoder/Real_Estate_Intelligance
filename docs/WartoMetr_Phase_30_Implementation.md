# WartoMetr Phase 30 Implementation

Date: 2026-10-02

## Scope

Phase 30 adds a focused browser-quality scenario for the apartment comparison
decision workflow.

The goal is to make comparison failures around `.compare-recommendation`
reproducible without running the entire broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=compare-decision` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - mobile comparison recommendation in Polish, English, Russian and Ukrainian;
  - desktop comparison recommendation in Polish;
  - partial comparison behavior when one selected apartment is unavailable.
- Added smoke coverage so the focused comparison scenario remains wired.
- Updated the documentation index with Phase 30.

## Product Integrity

- No comparison scoring, recommendation, valuation, confidence, risk,
  negotiation or fair-price semantics were changed.
- The scenario preserves the decision-first comparison contract:
  recommendation first, then detailed evidence.

## Verification

Run after implementation:

- `npm run smoke` — passed with 920 assertions.
- `BROWSER_QUALITY_SCENARIO=compare-decision npm run browser:quality`
  — passed against local memory-backed frontend/backend:
  - Polish, English, Russian and Ukrainian mobile comparison recommendations;
  - Polish desktop comparison recommendation;
  - partial comparison with one unavailable apartment.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself was not observed until the workflow runs remotely.
- The full local `npm run browser:quality` suite was not rerun in this phase.

## Remaining Work

- If the focused comparison scenario fails, repair the comparison workflow in a
  separate narrow change rather than weakening the assertion.
- After the scenario is green, consider adding it as an explicit CI step if the
  broad suite remains slow to diagnose.
