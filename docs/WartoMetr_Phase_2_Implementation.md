# WartoMetr Phase 2: Buyer Decision Result

Date: 2026-09-16. Scope: Phase 2 of the product transformation roadmap, building on the existing Phase 1 changes. Phase 3 is not included.

## Implementation

The apartment-check result and public listing analysis use the same focused `DecisionSummary` inside `BuyerDecisionPanel`. The overview shows the verdict, asking price, estimated range, difference from its midpoint, valuation confidence, evidence summary, one leading positive, one leading risk, a priority unknown and the next action. Other positives, risks and outstanding checks remain in the explanation disclosure.

The overview no longer leads with an aggregate score, intent score, opening offer, ceiling or acquisition budget. Negotiation, action-plan, cost, source and intent details remain available below it. On the check route, supporting scores, viewing follow-up, infrastructure, assistant, conclusions and comparables start collapsed. Save, compare, tracking and report actions follow the decision. Duplicate price summaries were removed.

The primary action opens negotiation only for a negotiate verdict with an available evidence-backed scenario; otherwise it opens the existing verification plan. Opening a section also moves keyboard focus to it. Source review opens the existing provenance section.

Listing headers use the apartment address and concise parameters; listing titles and full provenance remain in the evidence section. A missing decision renders available price information with an explicit unavailable-conclusion label rather than an empty result.

## Analytical Boundaries

- Backend verdict selection, valuation formulas, confidence thresholds, negotiation calculations, API contracts and storage were not changed.
- Check results now display `analysis.scores.fair_price_confidence_score` beside the valuation. Previously that display could use the submitted-listing result's general `confidence_score`. This changes which existing measure is displayed, not how either is calculated.
- The overview counts `analysis.comparables` as comparable **listings**. Transaction observation counts are shown separately in source details and explicitly are not called comparable-apartment counts.
- Existing limiting confidence factors are translated into consumer terms. Missing factors, confidence, range and comparison samples have explicit unavailable states; confidence zero remains a valid low-confidence value.
- A midpoint without both interval endpoints is not presented as a range in the focused overview. Other compact/report consumers retain their existing presentation mode.
- Price deviation explicitly refers to the interval midpoint. The positive sign was removed from the magnitude in phrases such as "below the midpoint".
- The frontend no longer describes an above-range asking price as near the range. A negotiation-positive explanation requires an available scenario. Outstanding checks are ordered by the backend's existing priority values, without changing their status or priority.
- RU/UK wording for a positive verdict now matches the cautious "worth considering" meaning used in PL/EN.

## Verification

During implementation, TypeScript, ESLint and the frontend build passed. Smoke checks passed with 847 assertions; the removed assertion referred to a deleted duplicate price block.

The new `browser:buyer-result` suite passed all 23 cases against the production build served locally. It exercises four languages at 1440, 768 and 390 pixels, disclosure and keyboard-focus behavior, all four verdicts, overpriced explanations, zero/missing confidence, an empty sample, transaction-context separation, missing range, missing verdict and a midpoint without interval endpoints. No console errors or horizontal overflow were detected in these cases.

The existing check-entry suite passed all 15 cases against the same build. The check-recovery suite passed all three groups: loading/report/save retries, partial/unsupported import outcomes and actionable report errors. Desktop/mobile screenshots were inspected during iteration and after the final build; this exposed and corrected header-button overlap and excess mobile header height. Longer localized summaries and their action buttons remain available by scrolling on mobile.

Browser tests use the local memory-backed demo API and controlled response fixtures. They validate presentation and workflow behavior, not market accuracy or live portal access. Browser artifacts are in `frontend/artifacts/buyer-result/` and `frontend/artifacts/check-entry/`.

## Limits

No production deployment, live portal validation, backend test suite, persistent-database integration or full historical browser-quality suite is claimed. Existing Phase 0 report/payment/private-comparison findings remain outside this phase. Very long source content remains accessible through scrolling and disclosure; it is not truncated to fit a viewport.

Phase 3 should strengthen valuation evidence and its data path. This phase only displays the evidence already available.

## Files

- `frontend/components/DecisionSummary.tsx`
- `frontend/components/BuyerDecisionPanel.tsx`
- `frontend/components/CheckListingExperience.tsx`
- `frontend/app/listings/[id]/page.tsx`
- `frontend/lib/buyerDecisionMessages.ts`
- `frontend/lib/decisionOverviewMessages.ts`
- `frontend/app/globals.css`
- `frontend/scripts/buyer-result.mjs`
- `frontend/scripts/browser-quality.mjs`, `frontend/scripts/smoke-ui.mjs`, `frontend/package.json`
