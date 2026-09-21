# WartoMetr Phase 5 - Fair-Price Temporal Backtesting

Date: 2026-09-16

Phase 5 replaces the old listing-snapshot drift check with a reproducible
temporal transaction holdout backtest for fair-price estimates.

## What Changed

The admin backtest now evaluates historical transaction facts:

```text
historical transaction T
-> hide T.property_price_gross from the estimator
-> use only transactions dated before T
-> calculate fair-price range
-> compare midpoint/range with T.property_price_gross
```

The held-out target price is used only after scoring, when calculating error
metrics. It is not used as asking price, comparable evidence or area baseline.

## Leakage Rules

- Evidence must have `transaction_date < target.transaction_date`.
- Evidence must also have `observed_at < target.transaction_date`; a record that
  was imported after the held-out transaction is not treated as available.
- Same-day transactions are not eligible evidence for each other.
- Future transactions are excluded.
- Different versions of the same logical transaction are collapsed by the
  repository before backtesting.
- The target logical transaction id is excluded from its own evidence pool.
- In-memory demo listings are not converted into fake RCN transactions.

## Backend Contract

`RealEstateRepository` now exposes:

```text
list_transaction_observations(city, district, area_id, minimum_quality)
```

`PostgresRealEstateRepository` reads approved transaction observations, applies
quality/exclusion checks and returns the latest version of each logical
transaction. `InMemoryRealEstateRepository` returns an explicit transaction
fixture list, empty by default.

## Metrics

`ScoringBacktestResult` now includes:

- `backtest_version = fair-price-temporal-backtest-v1`
- `methodology = temporal_transaction_holdout`
- transaction counts and skipped-history count;
- MAE in PLN;
- mean absolute percentage error;
- median absolute percentage error;
- RMSE in PLN;
- prediction interval coverage;
- within-5% and within-10% shares;
- item-level fair-price low/mid/high and interval hit.

Existing `formula_version` remains the scoring formula version
(`domarion-scoring-v2` at implementation time).

## Segmentation

The report keeps existing `area_drift` and `period_drift` fields, and adds
`segments` for:

- city;
- district;
- market type;
- size band;
- rooms;
- building age band;
- confidence band;
- comparable count band.

These segments are monitoring aids. They do not prove calibration or production
accuracy by themselves.

## Admin UI

The admin scoring backtest panel now labels the workflow as transaction
backtesting and surfaces:

- evaluated transactions;
- MAPE;
- prediction interval coverage;
- mean error;
- RMSE;
- skipped transactions.

## Important Limits

- The backtest requires at least three prior transaction observations and known
coordinates for the target/evidence transactions. Rows without enough temporal
history are skipped and counted.
- Area baselines are reconstructed from prior transaction evidence in memory for
the backtest run; this is not a persisted recalibration.
- Confidence and fair-price range width are still heuristic from Phase 4. Phase
5 measures errors; it does not yet calibrate confidence into probabilities.
- Empty local demo results are expected unless explicit transaction fixtures or
Postgres RCN data are available.

## Verification So Far

Implemented targeted tests cover:

- temporal transaction holdout result shape;
- future transaction leakage prevention;
- same-day transaction leakage prevention;
- deterministic repeated runs;
- segmentation/report output;
- admin API compatibility in local memory mode.

Local targeted result before broader release checks:

```text
6 passed
```
