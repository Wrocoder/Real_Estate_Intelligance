# Product Analytics Contract

## Purpose

WartoMetr records only the minimum events needed to understand whether a buyer
reaches a useful apartment decision and proceeds to evidence, action, comparison
or purchase. The contract version is `1.0`.

Events are sent to `POST /api/v1/product-events`. The endpoint is write-only for
consumers. `GET /api/v1/admin/product-funnel?days=30` returns aggregate counts to
administrators and never returns raw journeys or event payloads.

## Privacy Boundary

Each event contains:

- a random journey UUID stored only in browser `sessionStorage`;
- event name and schema version;
- interface locale;
- a small allowlisted set of categorical properties.

The server rejects unknown property names and unbounded property values. Events
must never include a listing URL, listing identifier, report/order identifier,
full or partial address, coordinates, name, email, phone, billing data, custom
question, seller message, search text, IP address or user-agent string.

The event table has no user-account foreign key. Raw events are retained for at
most 180 days. The application removes expired rows while recording new events.

## Events

| Event | Meaning | Allowed properties |
| --- | --- | --- |
| `check_started` | Buyer starts a URL or manual apartment check | `surface`, `intent`, `market_type`, `entry_mode` |
| `check_completed` | Check returns a usable or partial result | `surface`, `intent`, `market_type`, `result_state`, `confidence_level` |
| `verdict_viewed` | A structured buyer verdict is shown | `surface`, `verdict`, `confidence_level` |
| `comparables_opened` | Comparable evidence is shown or explicitly opened | `surface`, `evidence_state` |
| `risk_opened` | The main risk explanation is shown | `surface`, `evidence_state` |
| `negotiation_opened` | Buyer opens negotiation guidance | `surface`, `evidence_state` |
| `negotiation_message_generated` | Grounded negotiation answer is generated | `surface`, `result_state` |
| `property_saved` | Apartment is successfully saved | `surface` |
| `comparison_started` | Comparison request starts with two to four apartments | `surface`, `intent`, `comparison_size` |
| `comparison_completed` | Comparison returns a complete or partial recommendation | `surface`, `intent`, `comparison_size`, `result_state` |
| `report_opened` | Buyer opens HTML or PDF report content | `surface`, `report_type` |
| `pricing_viewed` | Pricing route is shown | `surface` |
| `checkout_started` | A checkout session is created | `surface`, `report_type`, `payment_provider` |
| `purchase_completed` | A fulfilled order is observed after checkout | `surface`, `report_type`, `payment_provider` |

Allowed categorical values live in `domarion/services/product_analytics.py` and
are the source of truth. Frontend failures to send analytics are intentionally
ignored so measurement can never block the buyer workflow.

## Operations

Production must set `PRODUCT_ANALYTICS_STORE_BACKEND=postgres` and apply Alembic
migration `0040_product_analytics_events`. Local and test environments use the
deterministic memory store.

The admin aggregate supports windows from 1 to 90 days. Use unique-journey
counts to compare major stages; event counts also reveal repeated use. Do not
join the table to user, listing, report or billing records.
