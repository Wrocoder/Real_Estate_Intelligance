# WartoMetr Phase 22 Implementation

Date: 2026-09-28

## Scope

Phase 22 adds a focused browser verification path for the apartment-check result
page after a private listing analysis.

The goal is to close the Phase 21 render-check gap for the optional buyer
outcome prompt without changing valuation, verdict, confidence, risk,
negotiation or saved-draft semantics.

## Changed

- Added an isolated `CHECK_ENTRY_SCENARIO=outcome-prompt` browser scenario for
  `frontend/scripts/check-entry.mjs`.
- The scenario uses the real local `wr-001` analysis contract as its controlled
  result fixture and stubs only the private `/check` import, analysis and
  product-event endpoints needed to verify the rendered flow.
- Verified the rendered mobile outcome prompt after analysis, including privacy
  copy, intermediate decision-impact state, disabled submitted controls,
  horizontal-overflow guard and screenshot capture.
- Verified that the recorded `buyer_outcome` event remains categorical and
  privacy-bounded: `surface`, `outcome` and `decision_impact` only.
- Added a frontend smoke guard so the isolated browser scenario remains part of
  the maintained QA surface.

## Analytics Integrity

- No analytical calculations or data semantics were changed.
- The browser fixture is test-only and derived from the existing local listing
  analysis contract.
- The `buyer_outcome` event remains anonymous and must not include listing URL,
  address, listing id, report id, account details, phone or free-text notes.
- This phase improves QA evidence for the consumer check-result workflow only.

## Verification

Run after implementation:

- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `CHECK_ENTRY_SCENARIO=outcome-prompt npm run browser:check-entry`
- `git diff --check`

## Remaining Work

- Keep the broader `/check` browser journey healthy separately; this phase adds
  an isolated regression path for the rendered outcome prompt.
- Aggregate real buyer outcomes only through the existing admin funnel summary;
  do not join outcome events to private listings, users or billing records.
- Keep B2B Pro and second-city expansion behind the commercial validation gate.
