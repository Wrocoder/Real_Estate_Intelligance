# WartoMetr Phase 33 Implementation

Date: 2026-10-02

## Scope

Phase 33 adds a focused browser-quality scenario for available negotiation
guidance.

The goal is to make the negotiation surface reproducible without running the
entire broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=negotiation-available` to
  `frontend/scripts/browser-quality.mjs`.
- The focused scenario verifies:
  - desktop and mobile rendering of the available negotiation scenario;
  - opening-offer and realistic-range guidance from structured analysis data;
  - visible evidence source and scenario confidence;
  - copy/export behavior for a short negotiation justification;
  - browser health checks for the rendered route.
- Added smoke coverage so the focused negotiation scenario remains wired.
- Updated the documentation index with Phase 33.

## Product Integrity

- No fair-value, negotiation, confidence, risk or evidence calculation
  semantics were changed.
- The scenario preserves the negotiation contract: guidance is based on
  structured evidence, the buyer sees usable offer language, and source
  context remains visible.

## Verification

Run after implementation:

- `npm run smoke` — passed with 935 assertions.
- `BROWSER_QUALITY_SCENARIO=negotiation-available npm run browser:quality`
  — passed against a local memory-backed backend/frontend pair:
  - desktop negotiation guidance at 1440px;
  - mobile negotiation guidance at 390px;
  - evidence source, scenario confidence and copied negotiation brief.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- The full local `npm run browser:quality` suite is not required for this
  focused phase unless the negotiation scenario exposes a shared regression.

## Remaining Work

- If the broad browser-quality suite still fails after this phase, continue
  with the next failing scenario as another narrow phase rather than weakening
  negotiation assertions.
