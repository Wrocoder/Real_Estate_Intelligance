# WartoMetr Phase 18 Implementation

Date: 2026-09-25

## Scope

Phase 18 implements the first Wrocław-first validation slice without changing
valuation, confidence, coverage or ingestion logic.

The roadmap intent is to prioritize Wrocław as the controlled-beta market while
keeping other currently supported locations available.

## Changed

- Added a localized coverage note that identifies Wrocław as the primary
  validation market only when Wrocław is present in the live coverage payload.
- Added a localized area-detail action section that connects neighborhood
  evidence to the apartment-check workflow.
- Updated area-detail check links to preserve both `city` and `district` query
  parameters.
- Extended smoke/browser checks so the Wrocław area page keeps the new
  area-to-check path visible on desktop and mobile.

## Analytics Integrity

- No price, confidence, risk, comparable-property, ingestion or coverage
  calculation semantics were changed.
- The coverage copy does not claim nationwide readiness.
- The area CTA explicitly preserves uncertainty when evidence is too thin.

## Verification

Run after implementation:

- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

Additional local Playwright check:

- `/areas/wroclaw-krzyki` renders the area-to-check CTA on desktop and mobile.
- The CTA link preserves `city=Wrocław` and `district=Krzyki`.
- The checked desktop and mobile viewports do not introduce horizontal overflow.

Not completed in this local API state:

- `npm run browser:area-history` still requires an area with transaction price
  history. The local API fixture active during this phase exposed Wrocław areas
  without transaction history and did not expose `wroclaw-borek`, so the old
  chart-specific scenario could not be used as a valid Phase 18 verification.

## Remaining Work

- Run real Wrocław buyer report QA against current listings and manual review
  notes.
- Validate paid buyer demand in the Wrocław market; local tests do not prove
  product-market fit.
- Improve Wrocław acquisition pages only where source-backed area evidence
  exists.
- Keep second-city expansion behind the city-expansion checklist and validation
  gate.
