# WartoMetr Phase 31 Implementation

Date: 2026-10-02

## Scope

Phase 31 stabilizes the focused browser-quality path for provenance and
evidence surfaces.

The goal is to keep source/method disclosures verifiable on listing and area
pages without running the entire broad browser-quality suite.

## Changed

- Added `BROWSER_QUALITY_SCENARIO=provenance-surfaces` to
  `frontend/scripts/browser-quality.mjs`.
- Scoped listing provenance checks to the opened market-evidence disclosure
  instead of relying on the first provenance element in the full page DOM.
- Scoped area provenance checks to the area evidence panel.
- Added smoke coverage so the focused provenance scenario remains wired.
- Updated the documentation index with Phase 31.

## Product Integrity

- No valuation, comparable, confidence, risk, negotiation or provenance
  calculation semantics were changed.
- The scenario preserves the trust contract: evidence can be inspected, source
  fields are localized, and internal source codes must not leak into consumer
  UI.

## Verification

Run after implementation:

- `npm run smoke` — passed with 925 assertions.
- `BROWSER_QUALITY_SCENARIO=provenance-surfaces npm run browser:quality`
  — passed against a local memory-backed backend/frontend pair.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself must still be observed after the workflow runs
  remotely.
- The full local `npm run browser:quality` suite is not required for this
  focused phase unless the provenance scenario exposes a shared regression.

## Remaining Work

- If the broad browser-quality suite still fails after this phase, continue
  with the next failing scenario as another narrow phase rather than weakening
  provenance assertions.
