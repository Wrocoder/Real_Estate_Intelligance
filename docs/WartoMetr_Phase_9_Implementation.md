# WartoMetr Phase 9 Implementation - Apartment Comparison Workflow

Date: 2026-09-22

## Changed

- Tightened the core apartment comparison flow to 2-4 apartments.
- Updated paid plan comparison limits from 5 to 4 to match the consumer workflow.
- Added a decision-first evidence block below the recommended apartment:
  - asking price versus estimated fair range;
  - total purchase cost and baseline monthly payment;
  - risk and valuation confidence;
  - negotiation action state.
- Kept the detailed comparison matrix available as progressive disclosure instead of making it the first evidence surface.
- Updated compare selection copy in English, Polish, Russian and Ukrainian.

## Product Rationale

The compare page should answer:

> Which apartment is the most rational choice for this buyer?

The page now starts with:

1. recommended choice;
2. reasons;
3. trade-offs;
4. compact evidence;
5. detailed matrix only after the buyer has the decision context.

This preserves the existing compare engine and avoids changing analytical semantics.

## Verified

- `ruff check domarion/schemas.py domarion/services/plans.py tests/test_api.py`
- `pytest tests/test_api.py::test_compare_requires_existing_ids tests/test_api.py::test_compare_keeps_available_selection_when_one_listing_is_missing tests/test_api.py::test_compare_rejects_duplicate_listing_ids tests/test_api.py::test_compare_rejects_more_than_four_listing_ids tests/test_api.py::test_compare_returns_decision_metrics_and_mortgage_baseline tests/test_api.py::test_compare_uses_saved_buyer_profile_for_recommendation tests/test_auth_subscriptions.py::test_free_plan_compare_limit_is_enforced tests/test_api_contract.py::test_openapi_exposes_recent_request_and_response_models`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright browser verification for `/compare?ids=wr-001,wr-002&intent=investment`:
  - desktop 1440px;
  - mobile 390px;
  - no console errors;
  - no failed requests;
  - no detected horizontal overflow in `main`;
  - detailed comparison matrix starts collapsed.

## Not Verified

- Real production data was not used; verification used memory-backed demo data.
- User accounts with every plan were not manually checked in browser.

## Remaining Risks

- Some deeper backend-generated analytical strings elsewhere on the page still reflect existing mixed-language fixture content. The new comparison evidence block avoids surfacing those raw strings.
- The compare engine remains deterministic and score-based; future phases may add richer buyer preference explanations, but should preserve the current decision/evidence/action order.

