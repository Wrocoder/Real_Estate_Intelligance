# WartoMetr Phase 8 Implementation - Real Payment Validation

Date: 2026-09-21

## Changed

- Hardened Buyer Report webhook fulfillment for Stripe, PayU and mock test flows.
- Added explicit order states for failed and refunded payments.
- Added webhook lifecycle handling for paid, failed, refunded and ignored events.
- Added amount and currency validation before a paid webhook can fulfill an order.
- Added checkout-reference validation when the order was created by the same live provider.
- Kept mock checkout available only in local, development and test environments.
- Preserved signed webhook verification for Stripe and PayU.
- Added audit events for rejected, failed and refunded payment webhooks.

## Payment Rules

- A paid webhook can fulfill an order only when:
  - the signature is valid;
  - the order exists;
  - the provider event has not already been recorded;
  - provider amount matches `ReportOrder.amount_grosz` when supplied;
  - provider currency matches `ReportOrder.currency` when supplied;
  - the provider checkout reference matches the order checkout event when available.
- Duplicate provider events return `duplicate` and do not generate another report.
- Failed payment events move unpaid orders to `failed` and do not generate a report.
- Refund events move the order to `refunded` and keep the generated report reference for auditability.
- Mock checkout is rejected outside `local`, `development` and `test`.

## Verified

- `ruff check domarion/services/payments.py domarion/api/routes.py domarion/report_order_store/base.py domarion/report_order_store/memory.py domarion/report_order_store/postgres.py domarion/schemas.py tests/test_payment_webhooks.py tests/test_paid_report_flow.py`
- `pytest tests/test_payment_webhooks.py tests/test_paid_report_flow.py`

Result: 25 passed, 2 warnings. The warnings are existing Starlette/httpx deprecation messages.

## Not Verified

- No real Stripe or PayU sandbox account was called from this environment.
- No browser checkout redirect was executed.
- No concurrent webhook race test was run against PostgreSQL.

## Remaining Risks

- Idempotency still depends on the persisted `payment_webhook_events` unique provider/event id record; production should monitor duplicate and rejected webhook rates.
- Refund handling records lifecycle state but does not revoke already delivered report access.
- Full payment readiness still requires provider sandbox credentials, hosted webhook URLs and operational monitoring in the deployed environment.

