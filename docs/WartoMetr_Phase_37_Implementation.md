# WartoMetr Phase 37 Implementation

Date: 2026-10-02

## Scope

Phase 37 adds a focused browser-quality scenario for apartment-check flow
states.

The goal is to make the successful manual check flow and the user-facing
failure state reproducible without running the entire broad browser-quality
suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=check-flow-states` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - manual apartment detail entry;
  - generated buyer decision rendering;
  - partial-data guidance for missing details;
  - saving the checked apartment;
  - navigation into comparison;
  - unsupported listing URL failure copy remains user-facing.
- Hardened the check-flow scenario so the check page waits for hydration before
  manual form input.
- Hardened critical-flow failure reporting so screenshot capture cannot hide
  the original Playwright error.
- Added smoke coverage so the focused check-flow scenario remains wired.
- Updated the documentation index with Phase 37.

## Product Integrity

- No listing import, manual-check, comparison, scoring, valuation or save
  semantics were changed.
- The scenario preserves the apartment-check contract: users can get a decision
  from manual data, understand missing data, save, compare and see a useful
  error when a link cannot be handled.

## Verification

Completed locally on 2026-10-02:

- `npm run smoke` passed with 955 assertions.
- `npm run typecheck` passed.
- `npm run build` passed.
- `BROWSER_QUALITY_SCENARIO=check-flow-states npm run browser:quality`
  passed against the local API/frontend test stand.
- Full `npm run browser:quality` passed against the local public
  API/frontend test stand.
- `npm run browser:release-gate` passed against the local internal
  API/frontend test stand, covering the privacy-safe buyer outcome prompt and
  aggregate admin buyer funnel on desktop and mobile.
- `npm run lint` passed.
- `git diff --check` passed.

For local browser verification, the API test stand should explicitly use
in-memory stores when a developer `.env` points store backends at Postgres.
The public frontend stand should set `INTERNAL_ROUTES_ENABLED=false`, matching
CI route-separation checks.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- Remote GitHub artifact upload and hosted browser execution were not observed
  in this local phase. GitHub CLI (`gh`) is not installed in the current local
  environment, so remote run inspection was not available from this machine.

## Remaining Work

- After this phase, the remaining release gate is remote CI observation.
