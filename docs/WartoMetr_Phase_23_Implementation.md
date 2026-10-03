# WartoMetr Phase 23 Implementation

Date: 2026-09-28

## Scope

Phase 23 makes the maintained apartment-check browser QA easier to run in
small, meaningful slices.

The goal is to keep the broad `/check` journey healthy without forcing every
developer or CI job to run the slowest sign-in, analysis and draft-reopening
path whenever they only need to verify a focused regression.

## Changed

- `frontend/scripts/check-entry.mjs` now accepts a scenario name as a CLI
  argument, while preserving the existing `CHECK_ENTRY_SCENARIO` environment
  variable and default full run.
- Added npm scripts:
  - `npm run browser:check-entry:outcome`
  - `npm run browser:check-entry:sign-in`
- Added a fail-fast scenario-name guard so a mistyped scenario cannot pass with
  zero browser tests.
- Extended frontend smoke checks to keep the focused `/check` browser scripts
  and outcome scenario wiring visible.

## Local Browser QA Notes

For isolated local `/check` browser runs, start the API with memory-backed
stores for private listing drafts as well as auth, reports and analytics:

```powershell
$env:DEMO_MODE_ENABLED="true"
$env:DATA_REPOSITORY_BACKEND="memory"
$env:USER_STORE_BACKEND="memory"
$env:AUTH_STORE_BACKEND="memory"
$env:REPORT_STORE_BACKEND="memory"
$env:REPORT_ORDER_STORE_BACKEND="memory"
$env:PRODUCT_ANALYTICS_STORE_BACKEND="memory"
$env:USER_SUBMITTED_LISTING_STORE_BACKEND="memory"
```

When using a non-default frontend port, include that origin in `CORS_ORIGINS`
for the backend process.

## Analytics Integrity

- No fair-value, verdict, confidence, comparable-property, risk, negotiation,
  draft-retention or analytics-event semantics were changed.
- This phase changes only QA ergonomics and documentation for already existing
  consumer check flows.

## Verification

Run after implementation:

- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run browser:check-entry:outcome`
- `npm run browser:check-entry:sign-in`
- `git diff --check`

## Remaining Work

- Keep periodically running the full `npm run browser:check-entry` journey when
  the local API environment is configured for all private-draft stores.
- Continue aggregating real buyer outcomes only through the existing admin
  funnel summary.
- Keep B2B Pro and second-city expansion behind the commercial validation gate.
