# WartoMetr Phase 6 Implementation

Date: 2026-09-21

## Scope

Phase 6 adds a public methodology and trust page for buyers. The page explains
how WartoMetr uses source data, fair-price ranges, confidence, limits and
temporal backtesting without exposing internal dashboards or promising
unsupported accuracy.

## Changed

- Added `/methodology` as a public Next.js route with localized Polish, English,
  Russian and Ukrainian copy.
- Added the methodology page to the discovery navigation and sitemap.
- Described fair price as a practical range, not a precise appraisal.
- Described confidence as data-quality evidence, not decoration.
- Described backtesting as an internal transaction holdout process and avoided
  publishing metrics before production sample quality review.
- Listed buyer-relevant limitations: legal status, hidden technical defects,
  seller acceptance and official valuation limits.

## Product Guardrails

- The page supports the decision hierarchy: decision, explanation, evidence,
  action.
- It does not invent public performance numbers.
- It does not present WartoMetr as an official `operat szacunkowy`.
- It directs users back to the apartment-check flow instead of ending at raw
  methodology.

## Verification Target

The intended verification set is:

- frontend typecheck;
- frontend lint;
- frontend production build;
- documentation index test;
- rendered `/methodology` check on desktop and mobile when local browser
  automation is available.

## Remaining Risks

- Public methodology still needs production data governance review before real
  accuracy metrics can be published.
- Commercial trust surfaces such as legal entity details, privacy, terms and
  pricing proof remain separate release gates.
