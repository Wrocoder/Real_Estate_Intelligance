# WartoMetr Final Product Review

Review date: 2026-09-12

## Decision

The repository is ready for a controlled buyer beta. It is not yet cleared for
an unrestricted paid production launch because payment-provider, delivery,
backup/restore, monitoring, legal/source approval and commercial validation
require external evidence that cannot be produced by repository tests.

The primary consumer journey follows the intended hierarchy:

`decision -> explanation -> evidence -> action -> comparison -> monitoring`

No additional consumer feature module is justified before the remaining
production and commercial gates are closed.

## Scenarios A-E

| Scenario | Result | Verified outcome |
| --- | --- | --- |
| A. Check an apartment | DONE | URL/manual entry leads to a buyer verdict, fair-price range, confidence, risks and next actions. Save and compare remain in context. |
| B. Incomplete data | DONE | Missing facts lower coverage/confidence and produce explicit unknown, insufficient or partial states; they do not become neutral scores or fabricated evidence. Error and retry states preserve user input. |
| C. Negotiate | DONE | Guidance distinguishes available from insufficient evidence and exposes an opening offer, target/range and ceiling only when supported by the versioned negotiation contract. |
| D. Compare | DONE | Two to five stable listing IDs produce one intent-aware recommendation with reasons and trade-offs before the detailed matrix. An unavailable property is removed without losing the remaining comparison. |
| E. Save and monitor | PARTIAL / EXTERNAL DELIVERY BLOCK | A signed-in buyer can save an apartment, reopen it in My apartments, create an object watch and inspect its triggers and delivery state. Real-recipient delivery and OCI worker cadence are not yet proven. |

## Production Surface

- Public navigation is limited to the buyer check, search, saved apartments and
  areas. Contextual routes remain reachable from the relevant workflow.
- `/admin` and the internal `/market` dashboard return `404` in the public
  production frontend. They require an explicit
  `INTERNAL_ROUTES_ENABLED=true` on a separate protected deployment.
- Admin API operations still require the server-side admin role; hiding or
  disabling the page is not treated as authorization.
- Demo data requires explicit local/development/test opt-in. Staging and
  production startup reject demo mode and persistent demo identity fallbacks.
- `/beta` and `/realtors` remain public commercial entry pages, not internal or
  demo application surfaces.

## Data Gaps And Limitations

- Current geographic evidence is strongest for Wroclaw and the available RCN,
  listing and registered source coverage. Unsupported places must remain
  unavailable or low-confidence.
- Rental outputs remain insufficient until a legally approved independent
  rental feed supplies at least the required fresh comparable sample.
- Legal title, technical condition, interior defects and source photos are
  frequently unknown until the buyer verifies documents and views the property.
- Future-infrastructure conclusions remain conditional on source status,
  district assignment and incomplete distance/impact evidence.
- Paid report sources and consumer legal/tax wording still require a recorded
  human approval. Product estimates do not replace legal, tax, valuation,
  technical or bank advice.
- A fulfilled mock order proves repository state transitions, not a live Stripe
  or PayU checkout, webhook, refund or settlement.

## Measurement

The versioned product analytics contract contains 14 privacy-bounded events
from `check_started` through `purchase_completed`. The admin endpoint exposes
aggregate event and unique-journey counts only. No production baseline is
claimed until the deployed PostgreSQL store has real, consent-compatible
traffic.

The controlled-beta validation target remains one of:

- 20 paid buyer reports; or
- 3 paid realtor pilots;

plus at least 5 recorded decision-impact outcomes. Funnel conversion, failure
rate, repeat use and purchase completion should be evaluated only after enough
real observations exist; repository demo traffic is not commercial evidence.

## Remaining Roadmap

| Task | Status | Evidence required to close |
| --- | --- | --- |
| P0-05 | BLOCKED / EXTERNAL | Live provider checkout/webhook/refund, offsite backup and restore drill, uptime/error/source/payment/cost alerts, private artifact recovery, legal/source approval and paid-report QA. |
| P1-09 | PARTIAL / BLOCKED | Real SMTP or Telegram recipient delivery, deployed worker cadence, timezone/frequency confirmation and delivery audit on OCI. |
| P1-12 | PARTIAL / BLOCKED | Live checkout and server-side fulfillment on staging, immutable paid artifact verification and final commercial copy approval. |
| P2-11 / T6-03 | REPOSITORY REVIEW DONE / EXTERNAL GATE OPEN | Close after P0-05 evidence is attached and scenarios A-E are repeated against the deployed production candidate. |

## Repository Verification

- Ruff and the full backend suite passed with `448 passed, 1 skipped`, covering
  analytics, auth, tenant isolation, payments, alerts, comparison, reports,
  missing data and deployment contracts.
- Frontend ESLint, TypeScript, `836` smoke assertions, npm audit with zero
  vulnerabilities and the production build passed.
- Repository Playwright passed PL/EN/RU/UK on desktop, tablet and mobile,
  loading, partial, empty, unavailable, error, retry, negotiation, comparison,
  saved/monitoring and production route separation.
- The production server returned `404` for `/admin` and `/market` with the
  public default, and returned `200` after the explicit internal runtime flag
  was enabled.
- Generated QA artifacts remain untracked and are not product or production
  evidence.

## Production Recheck

After the external gates are configured, repeat the following against the
deployed candidate before changing P2-11/T6-03 to DONE:

1. Complete one real supported-provider checkout and verify webhook
   idempotency, entitlement and report access.
2. Confirm backup timer output, offsite object, clean restore and artifact
   recovery.
3. Trigger and receive one object-watch delivery; verify its user-visible audit
   record and configured timezone/frequency.
4. Verify uptime, error, source-freshness, payment-webhook and OCI cost alerts.
5. Attach legal/source approval and manual paid-report QA evidence.
6. Repeat scenarios A-E on desktop and mobile with production-safe data.
