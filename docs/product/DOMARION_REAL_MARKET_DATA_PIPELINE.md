# WartoMetr: Real Market Data Pipeline Audit and Delivery Plan

Status: implementation in progress; release gate is still open.
Date: 2026-09-05
Scope: Wroclaw apartment listing data, PostgreSQL persistence, history-aware market metrics, and the Check Apartment flow.

## Current State

The repository already has the main persistence primitives required for a
history-aware listing dataset:

- `listing_sources` stores source ownership, legal status, allowed use,
  retention, robots and Terms references, and activation state.
- `ingestion_jobs`, `data_quality_logs`, `source_check_jobs` and `source_errors`
  provide operational job, quality and source-health records.
- `raw_listings` stores the latest sanitized source payload keyed by
  `(source_id, source_listing_id)`.
- `properties` stores a deduplicated canonical property and normalized stable
  attributes such as city, district, address, area, rooms, floor, building year,
  coordinates and amenities.
- `property_sources` preserves the relationship between one canonical property
  and each source listing, including first/last seen time and active status.
- `listing_snapshots` stores observed price and listing attributes per timestamp.
- `listing_events` records price changes, removals, relistings and other history
  events. `property_deduplication_matches` stores explainable match decisions.
- `area_statistics` and `area_market_snapshots` expose area-level metrics to
  repositories and reports.

The current ingestion implementation is `partner_csv.py` plus
`db_writer.py`. It normalizes required listing fields, computes price per m2,
upserts raw/property/source/snapshot rows, creates deduplication decisions and
rebuilds price-history metrics. It is useful and should be reused.

The current Check Apartment flow is:

1. A user submits a private Otodom/OLX URL or manual fields.
2. The URL importer fetches one page and extracts minimal fields from
   JSON-LD/meta/text. It does not bulk crawl or retain prohibited content.
3. `analyze_user_submitted_listing` resolves an area statistic, builds a
   `Listing`, calls the shared scoring/comparable/risk/decision services and
   returns the report contract.
4. The repository factory selects PostgreSQL or memory. Demo data is only
   allowed in explicit local/test memory contexts.

The current system therefore has history-aware storage and report integration,
but the report dataset is only as real as the authorized data imported into
PostgreSQL. There is no source discovery adapter or scheduled Wroclaw feed
runner in the repository today.

## RCN Transaction Layer

The implementation now includes a separate `transaction_observations` table
and `domarion.ingestion.rcn_transactions`. The adapter accepts the official
RCN/GUGiK GML WFS response or a normalized GeoJSON export, including the RCN
`ms:lokale` fields used for apartment transactions. It follows only bounded
WFS `next` links from the same service path and requires an explicit bbox for
remote requests.

An observation stores the source identifier and version, transaction/document
date, gross local/property/transaction prices, usable area, derived price per
m², market type, apartment attributes, source geometry and quality score. It
does not create `RawListing`, `PropertySource` or `ListingSnapshot` rows. A
new source version is retained as a separate observation, which preserves the
transaction-register history.

`refresh_market_metrics` uses approved non-demo RCN observations as the
price-per-m² baseline when they exist. Active listings remain the source for
asking-price inventory, days on market, removals and supply. Transaction-only
areas expose `listing_metrics_available=false`; scoring uses a neutral
liquidity value and a warning rather than treating missing listing history as
positive evidence. If RCN geometry has no district, the record is aggregated
to `wroclaw-city`; no district is inferred from a weak address or projection.

## Reusable Functionality

- SQLAlchemy models and Alembic migration chain.
- `PartnerListingRecord`, CSV validation and Polish numeric/date parsing.
- `import_partner_records_in_session` and idempotent snapshot upsert.
- Price-history event derivation and removal handling.
- Explainable property deduplication with review thresholds.
- PostgreSQL and in-memory repository interfaces.
- Comparable selection, fair-price range, confidence, risk profile and buyer
  decision services.
- Source registry and source-compliance policy.
- Admin ingestion jobs, data-quality logs and source-error retry records.
- Existing API and report contracts, which should remain compatible.

## Gaps

### P0: trust and data integrity

- No authorized bulk discovery/feed adapter for Wroclaw.
- No production command that runs a complete source job from discovery through
  normalization, persistence and metric refresh.
- The current partner CSV writer can overwrite the latest raw payload, while
  only normalized listing snapshots provide history; retention and provenance
  need to be explicit for every imported observation.
- Source registry defaults created by ingestion do not establish approval,
  terms, robots, allowed use or retention. A scheduled source must fail closed
  until the registry entry is approved.
- Broad portal labels can be mistaken for districts. A voivodeship such as
  `dolnośląskie` must never be stored as a Wroclaw district.

### P1: decision quality

- Market metrics need a single, documented active-latest observation query with
  freshness, sample-size and listing-vs-transaction semantics.
- Comparable selection needs to exclude stale/removed/low-quality rows and
  expose source scope and observation date in the evidence contract.
- There is no source health/coverage summary for a Wroclaw ingestion run.
- The Check flow can analyze a user-submitted listing using area fallback, but
  a report should identify when no real comparables exist and must not present
  demo or proxy data as local observed evidence.

### P2: operations

- No scheduler/runbook for approved feed refreshes, backoff, alerting and
  deletion requests.
- No ingestion metrics for pages/listings fetched, rejected fields,
  duplicates, freshness or status transitions.
- No source-specific adapter test fixtures for malformed Polish listing data.

## Risks and Guardrails

1. “All listings” cannot be guaranteed from a public portal. Coverage is
   limited by source licensing, robots/Terms, pagination/API limits, visibility,
   duplicates, removals and source outages. Product copy must say “observed in
   approved sources”, never “the complete Wroclaw market”.
2. Otodom/OLX pages remain private one-off references until source-specific
   legal review approves automated ingestion. Do not bypass login, captcha,
   paywalls, bot controls or robots rules. Do not use browser automation for
   bulk discovery.
3. Only minimum property fields may be retained. Strip photos, contacts, names,
   full descriptions and raw HTML before persistence. Keep a payload hash and
   normalized fields/provenance instead.
4. Asking listings are not RCN transaction observations. Reports must label the
   source type and avoid combining the two as if they were interchangeable.
5. Missing attributes remain unknown. Do not infer building year, district,
   condition or coordinates from weak text matches. Metrics with insufficient
   comparable rows return limited confidence and a visible explanation.
6. A source may be marked removed only after a complete successful source run or
   an explicit source removal signal; a partial/error run must not delete the
   remaining inventory.

## Target Architecture

```text
approved source feed/API/export
        |
        v
source policy gate -> bounded client (robots/Terms/rate limit/backoff)
        |
        v
source adapter -> minimal raw records -> canonical normalizer
        |                                  |
        |                                  v
        |                         quality/provenance checks
        v                                  |
ingestion job ----------------------------+
        |
        v
raw_listings -> properties/property_sources -> listing_snapshots
                                      |
                                      v
                              listing_events/history
                                      |
                                      v
                  active/fresh PostgreSQL market query
                                      |
                                      v
              comparables -> fair price/confidence -> decision report
```

The adapter boundary must support an authorized JSON/CSV/API feed first. A
portal adapter can only be enabled after its registry entry is approved and
must use an allowed endpoint or export supplied by the source. A generic
single-page JSON-LD parser is useful for private Check imports, but it is not a
bulk crawler and must remain separate from scheduled ingestion.

## Dependency Graph

```text
T0 audit and source policy
  -> T1 canonical observation contract and Wroclaw normalization
  -> T2 approved-source adapter/client and bounded discovery runner
  -> T3 ingestion schema/provenance/job metrics
  -> T4 history-safe persistence and active/latest market query
  -> T5 real-data comparables and Check Apartment integration
  -> T6 source health, scheduling, operational runbook
  -> T7 release gate and Wroclaw end-to-end verification
```

No scheduled source should be enabled before T0, T1 and T2 are complete.
No report should claim real market evidence before T4 and T5 are complete.

## Ordered Task List

### T0. Audit and policy gate — DONE

Document the existing architecture, source rules, reusable paths, risks and
acceptance criteria. No production code is changed before this audit.

### T1. Canonical Wroclaw observation contract and normalization

Add a typed source-observation boundary shared by feeds and CSV. Normalize
Polish price/area formats, market type, property type, dates, addresses,
district aliases and explicit unknown values. Reject or quarantine rows without
stable source IDs, city, price, area or valid currency. Ensure
`dolnośląskie`/`wrocławski` are region/powiat labels, not Wroclaw districts.

Acceptance criteria:

- Same input produces the same normalized record and provenance.
- Required-field and range validation produces quality logs, not fabricated
  defaults.
- Wroclaw district matching is explicit and tested.
- No prohibited content is persisted.

### T2. Approved-source adapter and bounded Wroclaw runner

Implement a source adapter protocol and an authorized feed adapter. Enforce
registry approval, allowed use, domain/URL scope, request timeout, request
budget, rate limiting, retry-after/backoff and no-bypass behavior. Support
pagination/cursors only when provided by the authorized source. Add a CLI
dry-run and non-dry-run command that creates an ingestion job and reports
coverage. Keep direct Otodom/OLX bulk crawling disabled unless legal approval
and a permitted endpoint/feed are configured.

Acceptance criteria:

- Unapproved/blocked sources fail closed before network ingestion.
- 403/429/robots/policy failures stop or back off without retries that resemble
  crawling.
- A permitted Wroclaw feed can be processed end-to-end with bounded work.
- Partial runs never mark the whole source inventory removed.

### T3. Provenance, quality and operations metadata

Record source/feed version, run ID, fetch time, observation time, source type,
field provenance, parser version, counts and errors. Reuse existing ingestion
jobs and quality logs; add a focused migration only where existing JSON is not
enough. Never expose private source URLs in public report output.

Acceptance criteria:

- Every market observation can be traced to source, timestamp and run.
- Quality summaries include accepted/rejected/quarantined counts and reasons.
- Retention and deletion behavior is documented and testable.

### T4. History-safe storage and market metrics

Use the existing raw/property/source/snapshot/event tables as the listing write
model and a separate transaction-observation table for RCN data.
Make snapshot writes idempotent by source listing ID plus observation timestamp,
derive price/availability events, and mark missing listings only on a complete
successful run. Build a PostgreSQL market query for active latest observations
with source scope, freshness window, minimum sample size and listing/transaction
separation. Recompute area statistics from those observations.

Acceptance criteria:

- Re-running the same feed does not duplicate snapshots or properties.
- Price changes and removals are visible in history.
- Failed/partial runs do not cause false removals.
- Metrics return limited/unknown confidence below the configured sample
  threshold and include provenance metadata.

### T5. Check Apartment integration

Keep private user URL import as a one-off extraction path. Resolve the imported
listing to a supported Wroclaw area only from validated city/district/address
data. Select real active comparables from PostgreSQL using the canonical
contract, calculate a fair-price range and confidence, and pass source scope,
sample size and freshness into the existing decision/report services. If the
dataset is empty or stale, show an explicit data limitation instead of demo
fallback or invented precision.

Acceptance criteria:

- A valid Wroclaw input uses real PostgreSQL comparables when available.
- The report distinguishes asking/listing evidence from transaction data.
- Verdict, range, confidence and comparable evidence are explainable.
- Unsupported or incomplete location produces a useful manual correction path.

### T6. Scheduling and production operations

Add a safe recurring execution path for approved feeds, source-health checks,
freshness alerts, metrics refresh and retention pruning. Provide OCI/systemd
runbook commands and environment variables without committing credentials.

Acceptance criteria:

- The scheduled job is disabled when source approval or required configuration
  is missing.
- Operators can inspect the last run, coverage, errors and source freshness.
- Backup, rollback and deletion procedures remain compatible with OCI.

### T7. Release gate — REQUIRED

Run formatting, lint, typecheck, focused and full backend tests, migration
validation, build, local API checks and the available browser/responsive QA.
Verify demo mode is not used for production market evidence. Update the
checklist only after the gate passes and record any environment limitation.

Acceptance criteria:

- A clean migration upgrades an empty PostgreSQL database.
- An approved fixture/feed passes ingest → history → metrics → Check report.
- Idempotency, partial failure, access policy, localization and error states
  are tested.
- Release-gate output and remaining limitations are documented.

## Proposed Schema Changes

Prefer the current tables. Add a migration only for fields that are required
for queryability and cannot safely live in `normalized_payload`:

- `listing_snapshots`: optional derived `price_per_m2` only if query volume
  requires it; source price remains the observed value and the derived field is
  labeled calculated.
- `transaction_observations`: source/version key, transaction date, property
  price, transaction price, area, derived price per m², market/property type,
  geometry CRS and normalized source payload. This table must never be used as
  a listing snapshot.
- `area_statistics`: price basis, transaction sample/freshness, source names
  and a listing-metrics availability flag.
- `ingestion_jobs.metadata_json`: feed cursor/version, completeness, counts and
  coverage scope; existing column is sufficient.
- `listing_snapshots.normalized_payload`: field-level provenance and parser
  version for values that are not stable columns.
- Optional `source_ingestion_runs` should be avoided unless existing
  `ingestion_jobs` cannot represent a source run and completeness state.

The key design rule is that `Property` is the deduplicated current identity,
while `ListingSnapshot` is the immutable observation history. Price and
availability must be read from snapshots/events, not from a mutable property
row.

## Implementation Status

- T0: DONE. Architecture, database, source policy, risks and acceptance
  criteria are documented here.
- T1: DONE for the authorized JSON feed boundary. It requires authoritative
  coordinates, validates Wrocław districts and rejects prohibited fields.
  Legacy partner CSV remains compatible and is intentionally less strict.
- T2: DONE for bounded approved JSON exports/API responses. The CLI and worker
  enforce registry approval, URL scope and a maximum item/response budget.
  Direct Otodom/OLX bulk discovery remains BLOCKED until a permitted API/feed
  and source-specific legal approval are supplied.
- T3: DONE for RCN row validation, source/version provenance, quality logs and
  transaction-specific ingestion job metadata. Field-level provenance beyond
  the normalized payload remains follow-up work.
- T4: DONE for separate listing/transaction persistence and metrics. The
  refresh uses approved RCN observations as the price baseline and removes
  stale area rows when neither live listings nor RCN observations remain.
- T5: PARTIALLY DONE. Check Apartment now consumes the RCN-backed area price
  baseline and reports transaction sample/provenance through `AreaStatistics`.
  Transaction-level comparable evidence and a dedicated UI evidence list remain
  follow-up work.
- T6: PARTIALLY DONE. `authorized-market-feed` is available as a worker task
  with OCI environment variables. A deployed operator still needs to configure
  an approved provider feed and an appropriate worker cadence.
- T7: PARTIALLY DONE. Ruff, full backend tests, CLI help, compose config
  validation with placeholders, local non-demo `/health`/`/ready` checks and
  a live GUGiK GML parse pass. The database ingest portion remains BLOCKED
  until an approved RCN registry entry and a live PostgreSQL run verify ingest
  → metrics → Check on the deployed dataset. Browser QA was not applicable to
  these backend-only changes.

## Release Gate Record

- `ruff check .`: passed.
- `pytest -q`: `391 passed, 1 skipped`.
- Targeted RCN and market-metrics tests: `10 passed`.
- `git diff --check`: passed.
- Live GUGiK WFS `ms:lokale` bbox response: parsed one real Wrocław feature
  from GML and normalized its transaction price, area and price per m².
- `domarion --help`: passed after forcing UTF-8 CLI output on Windows.
- `docker compose -f compose.oracle.yaml config --quiet`: passed with
  non-secret validation placeholders; real OCI env was not read locally.
- Local API in non-demo mode: `/health=200`, `/ready=200`.
- Not verified: PostgreSQL migration against a live OCI database, a complete
  Wrocław RCN export, district boundary enrichment, transaction-level report
  evidence rendering, or rendered browser QA.

## Report Data Contract

The report must expose, where available:

- asking price and calculated PLN/m2;
- comparable count, source type, geographic scope and observation freshness;
- fair-value range, not unsupported single-number precision;
- confidence and the factors that produced it;
- explicit “no sufficient data” state;
- source/provenance details through the existing reusable trust components.

The report must not expose raw HTML, copied descriptions, contacts, photos or
private user-submitted URLs.

## Final Readiness Definition

This pipeline is ready for a real Wroclaw source only when an approved source
feed/export is available and T1–T7 pass. The repository can be made production
ready without pretending that a portal can be exhaustively crawled. Until an
approved feed is configured and a successful run is recorded, the product must
describe market coverage as unavailable/limited and must not claim that Check
Apartment is backed by the complete Wroclaw market.
