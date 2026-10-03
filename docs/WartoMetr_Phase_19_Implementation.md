# WartoMetr Phase 19 Implementation

Date: 2026-09-26

## Scope

Phase 19 continues the acquisition/SEO foundation for Wrocław area pages.

The goal is to make an organic area-page visit useful within seconds by showing
what the area evidence can and cannot prove before sending the buyer into the
apartment-check workflow.

## Changed

- Added a localized area evidence summary near the top of area detail pages.
- The summary shows existing area fields only:
  - reference price per m²;
  - evidence basis;
  - observation count;
  - time window;
  - update date.
- Added explicit copy that neighborhood evidence is not a valuation of a
  specific apartment.
- Updated the area decision-guide search action to preserve both city and
  district query parameters.
- Extended frontend smoke checks for the new evidence summary and city-preserving
  search link.

## Analytics Integrity

- No valuation, comparable-property, confidence, ingestion, coverage, risk or
  price-history calculation semantics were changed.
- The new summary reads already exposed `AreaStatistics` fields and preserves
  demo-data limitations.
- Missing time/update/source fields remain visible as unknown rather than being
  replaced with neutral values.

## Verification

Run after implementation:

- `npm run smoke`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

Rendered local QA:

- `/areas/wroclaw-krzyki` renders the evidence summary on desktop and mobile.
- The area-to-check CTA preserves `city=Wrocław` and `district=Krzyki`.
- The area search action preserves `city=Wrocław` and `district=Krzyki`.
- Desktop and mobile checks did not show horizontal overflow or browser errors.

## Remaining Work

- Add richer, source-backed Wrocław neighborhood acquisition pages only where
  transaction history and provenance are strong enough.
- Keep generated area copy conservative until live data, source attribution and
  legal review support stronger claims.
