# WartoMetr Phase 28 Implementation

Date: 2026-10-02

## Scope

Phase 28 hardens the browser CI environment so release gates use deterministic
memory-backed stores for buyer checks and privacy-safe product analytics.

The goal is to make the CI browser job match the memory-backed environment
already documented for local Phase 23 and Phase 24 browser verification.

## Changed

- Added explicit memory-backed store settings to the `browser-quality` CI job:
  - `USER_STORE_BACKEND`;
  - `AUTH_STORE_BACKEND`;
  - `REPORT_STORE_BACKEND`;
  - `REPORT_ORDER_STORE_BACKEND`;
  - `USER_SUBMITTED_LISTING_STORE_BACKEND`;
  - `PRODUCT_ANALYTICS_STORE_BACKEND`.
- Added smoke coverage so the browser CI job keeps these deterministic stores.
- Updated the documentation index with Phase 28.

## Product Integrity

- No product analytics event names, allowed properties, storage schema or
  aggregate semantics were changed.
- No valuation, confidence, risk, negotiation, fair-price or recommendation
  logic was changed.
- Production guidance remains unchanged: production must use
  `PRODUCT_ANALYTICS_STORE_BACKEND=postgres`.

## Verification

Run after implementation:

- `npm run smoke` — passed with 906 assertions.
- `npm run lint` — passed.
- `git diff --check` — passed.

## Not Verified

- GitHub CI execution itself was not observed until the workflow runs remotely.
- This phase does not repair unrelated broad browser-quality assertions around
  route separation, comparison rendering or localized action-plan expectations.

## Remaining Work

- Keep browser-gate environment variables explicit when adding new store
  backends that affect buyer verification.
- Continue fixing broad browser-quality failures in focused phases rather than
  hiding them behind the release-gate wrapper.
