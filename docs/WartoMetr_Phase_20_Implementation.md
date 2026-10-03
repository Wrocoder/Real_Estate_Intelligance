# WartoMetr Phase 20 Implementation

Date: 2026-09-27

## Scope

Phase 20 improves the result-page trust layer for the apartment-check workflow.

The goal is to help a private buyer understand the boundary between verified
listing facts, estimated analytical outputs and items WartoMetr could not
verify before acting on the verdict.

## Changed

- Added a trust-boundary preview directly under the main buyer verdict actions.
- The preview groups existing localized knowledge items into:
  - what is known from the listing and structured inputs;
  - what was estimated by the analysis;
  - what still needs verification before purchase.
- Added the check-completeness score when it is available.
- Styled the preview to remain secondary to the verdict while keeping the trust
  boundary visible before the viewing checklist and negotiation guidance.
- Extended frontend smoke checks to guard that the buyer result uses the
  localized knowledge boundary rather than raw backend labels.

## Analytics Integrity

- No fair-value, verdict, confidence, comparable-property, risk, negotiation or
  ingestion semantics were changed.
- The preview reads the existing buyer-decision knowledge matrix and localized
  consumer labels.
- Missing or unverified data remains explicit as "could not verify" rather than
  being converted into a neutral-looking score.
- The UI does not invent sources, prices, risks or verification status.

## Verification

Run after implementation:

- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

Rendered local QA:

- A targeted `/check` result-page browser check reached the buyer decision on a
  mobile viewport and verified the trust-boundary preview rendered with three
  consumer-facing columns.
- The targeted browser check confirmed no horizontal overflow on the mobile
  result page.
- The broad `browser:check-entry` harness was rerun after starting API and
  frontend servers with matching CORS origins. It completed the localized
  entry/confirmation and recovery paths except for one existing React hydration
  warning in the PL desktop screenshot path.
- The first broad browser attempt exposed a local CORS configuration issue
  caused by running the frontend on a non-default port; this was corrected for
  the rerun.

## Remaining Work

- Fold the focused trust-boundary assertion into the maintained
  `browser:check-entry` harness after the existing PL desktop hydration warning
  is handled.
- Continue improving source provenance only from backend-supported evidence;
  do not strengthen trust copy without stronger source data.
