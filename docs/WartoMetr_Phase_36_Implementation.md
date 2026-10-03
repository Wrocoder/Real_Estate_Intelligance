# WartoMetr Phase 36 Implementation

Date: 2026-10-02

## Scope

Phase 36 adds a focused browser-quality scenario for rental evidence.

The goal is to make rental estimate and insufficient-data failures
reproducible without running the entire broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=rental-evidence` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - estimated rental evidence in Polish, English, Russian and Ukrainian on
    mobile;
  - insufficient rental evidence in Polish, English, Russian and Ukrainian on
    mobile;
  - Polish desktop estimated rental evidence;
  - localized rental method copy;
  - no internal rental factor codes leak into consumer UI.
- Added smoke coverage so the focused rental-evidence scenario remains wired.
- Updated the documentation index with Phase 36.

## Product Integrity

- No rental, yield, valuation, confidence or evidence calculation semantics
  were changed.
- The scenario preserves the trust contract: rental economics are shown only
  when enough evidence exists, and insufficient data stays explicit.

## Verification

Completed locally on 2026-10-02:

- `npm run smoke` passed with 955 assertions.
- `BROWSER_QUALITY_SCENARIO=rental-evidence npm run browser:quality`
  passed against the local API/frontend test stand.
- `npm run lint` passed.
- `git diff --check` passed.

For local browser verification, the API test stand should explicitly use
in-memory stores when a developer `.env` points store backends at Postgres.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- The full local `npm run browser:quality` suite is not required for this
  focused phase unless the rental-evidence scenario exposes a shared
  regression.

## Remaining Work

- If the broad browser-quality suite still fails after this phase, continue
  with the next failing scenario as another narrow phase rather than weakening
  rental-evidence assertions.
