# WartoMetr Phase 35 Implementation

Date: 2026-10-02

## Scope

Phase 35 adds a focused browser-quality scenario for score explainability.

The goal is to make score explanation failures reproducible without running the
entire broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=score-explainability` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - localized score explanation controls in Polish, English, Russian and
    Ukrainian on mobile;
  - Polish desktop score explanations;
  - exactly five independently explained listing scores;
  - coverage and confidence copy;
  - no internal score factor or model-version codes leak into consumer UI.
- Added smoke coverage so the focused score-explainability scenario remains
  wired.
- Updated the documentation index with Phase 35.

## Product Integrity

- No score, valuation, confidence, risk, liquidity, rental or negotiation
  semantics were changed.
- The scenario preserves the explainability contract: scores can exist only
  with understandable reasons, coverage and confidence.

## Verification

Run after implementation:

- `npm run smoke` — passed with 945 assertions.
- `BROWSER_QUALITY_SCENARIO=score-explainability npm run browser:quality`
  — passed against a local memory-backed backend/frontend pair:
  - Polish, English, Russian and Ukrainian mobile score explanations;
  - Polish desktop score explanations;
  - coverage, confidence and internal-code leakage checks.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- The full local `npm run browser:quality` suite is not required for this
  focused phase unless the score-explainability scenario exposes a shared
  regression.

## Remaining Work

- If the broad browser-quality suite still fails after this phase, continue
  with the next failing scenario as another narrow phase rather than weakening
  score-explainability assertions.
