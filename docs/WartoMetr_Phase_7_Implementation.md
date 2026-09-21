# WartoMetr Phase 7 Implementation

Date: 2026-09-21

## Scope

Phase 7 productizes the core paid offer as one clear `Buyer Report`.
It reuses the existing report-order, payment and fulfillment infrastructure
instead of adding another checkout path.

## Changed

- Renamed the core buyer paid product from `Buyer Check` to `Buyer Report`.
- Kept the stable product code `object_report` for checkout/webhook/backward
  compatibility.
- Made the Buyer Report price configurable through
  `BUYER_REPORT_AMOUNT_GROSZ`; the default remains `4900` grosz.
- Limited the pricing page buyer offer to the single core `object_report`
  product, while leaving extended products available for compatibility flows.
- Added a paid `buyer_report_v1` report variant for fulfilled `object_report`
  orders with:
  - fair-price and confidence evidence summary;
  - comparable-evidence disclosure;
  - negotiation plan;
  - total move-in cost;
  - due-diligence checks;
  - scenario matrix.
- Updated paid-beta and deployment documentation.

## Product Guardrails

- Critical known risks are not hidden behind payment.
- The paid report adds depth, evidence and action planning.
- Analytical calculations were not changed.
- Existing payment providers, order events and fulfillment lifecycle remain the
  source of truth.

## Verification Target

The intended verification set is:

- targeted paid report flow tests;
- report artifact contract tests;
- frontend typecheck, lint and build;
- rendered `/pricing` check with a listing context;
- documentation index test.

## Remaining Risks

- Phase 8 still needs live Stripe/PayU validation, webhook idempotency in a real
  PSP sandbox and refund/failure handling review.
- Legal/commercial review is still needed before the paid report is sold at
  scale.
