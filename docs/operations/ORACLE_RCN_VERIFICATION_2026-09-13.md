# Oracle RCN deployment verification: 2026-09-13

## Deployment

- Application revision: `6f18baa`, pushed to `main` and deployed by direct SSH.
- Environment: **staging**, as reported by the live `/health` endpoint.
- Database revision: `0042_transaction_money_bigint`.
- API, frontend, PostgreSQL and Redis containers report healthy; worker is running.
- Public frontend and API requests return HTTP 200.
- GitHub-hosted deployment is not verified as repaired. The last inspected
  deployment (`34763783213`) timed out connecting to SSH port 22. Successful
  workstation SSH does not prove that a hosted runner can reach the VM.

## Import results

The national run completed for all 16 voivodeships without a regional failure:
402,563 source rows seen, 370,140 accepted, 32,423 rejected, 307,822 new
transactions, 62,318 reconfirmed and none changed.

After the exact-city TERYT fallback was deployed, a separate Wielkopolskie
backfill completed successfully: 52,054 rows seen, 49,122 accepted, 2,932
rejected, 20,492 new transactions and 28,630 reconfirmed. Its JSON result is at
`/srv/domarion/data/rcn-region30-validation-20260913.json` on the VM.

Final database inventory: **401,726 stored observations across 16 voivodeships**.
Observations can include retained versions; this is not a count of unique
apartments or an assertion that all Polish transactions are available.

| City (exact TERYT) | Stored observations | District-assigned | Districts with observations |
| --- | ---: | ---: | ---: |
| Wroclaw (0264) | 22,919 | 22,919 | 48 |
| Lublin (0663) | 9,940 | 9,940 | 26 |
| Lodz (1061) | 6,304 | 6,304 | 34 |
| Krakow (1261) | 23,706 | 23,706 | 18 |
| Warszawa (1465) | 55,329 | 0 | 0 |
| Gdansk (2261) | 17,373 | 0 | 0 |
| Poznan (3064) | 19,065 | 0 | 0 |

Lublin has 27 loaded boundary polygons and Lodz has 36; not every polygon has
accepted observations. City totals above use exact TERYT, not city-name matches
which can include other localities sharing a name. Do not sum overlapping
city-level and district-level API aggregates as a transaction total.

The Poznan statistics endpoint returns 5,840 observations in its rolling
365-day baseline and 19,064 in its deduplicated history. Its median is
11,459 PLN/m2 and its current-window source dates are 2025-09-15 to 2026-07-10.
These are descriptive source statistics, not a validated apartment valuation.

The newest transaction document in the database is dated 2026-07-31. Importing
today does not make the source data current to today. The source-version
lookback is not a transaction-date filter; retained history starts in 1928.

## Repairs applied

- Monetary totals use BIGINT to avoid aborting regional imports on INTEGER
  overflow. This storage change does not establish that extreme source amounts
  are analytically valid apartment prices.
- Impossible dates and unsupported area values are rejected. Nine previously
  imported invalid-date observations were removed during maintenance; the
  final date validation query finds no out-of-range dates.
- EPSG:2180 GML points are parsed in declared northing/easting axis order.
  Stored coordinates for 381,234 existing RCN observations were corrected once,
  20,281 previous Wroclaw assignments were reset, and district assignments and
  metrics were recalculated. **Do not repeat the coordinate swap** on this
  repaired database; it would reintroduce the error.
- Exact major-city TERYT codes recover missing city names without inferring a
  city from a generic county code. The historical backfill with this fallback
  was run for region 30 only; older rejected rows elsewhere may still need a
  targeted backfill.

Backup references:

- `/srv/domarion/backups/postgres/domarion-postgres-20260913T150003Z.dump`
- `/srv/domarion/backups/postgres/domarion-post-axis-fix-20260913.dump`
  (85,105,388 bytes; despite its name, captured **before** the coordinate repair)
- `/srv/domarion/env/snapshots/oracle.env.20260913T150033Z`

## Verification and remaining work

- Backend suite: 471 passed, 1 skipped; focused RCN/Oracle suite: 37 passed.
- Ruff passed. IDE build reported success with limited diagnostics.
- Public area listing and Poznan statistics endpoints were checked against the
  database results. Frontend HTTP availability is verified, not rendered UX.
- PostGIS finds zero assigned EPSG:2180 points outside their named boundary.
- Browser verification could not start because the browser tool failed with
  missing `sandboxPolicy` metadata. Desktop/mobile rendering and console checks
  remain unverified.
- District boundaries for Warszawa, Gdansk and Poznan are not provisioned in
  the verified manifest. Their data remains city-level.
- Lublin DBF district names lose Polish characters; API area labels also need
  review before declaring district presentation complete. Verify the source
  encoding, repair names/identifiers with their references, and rebuild metrics.
- Investigate extreme monetary source values and their selected price basis;
  successful persistence alone is not an analytics-quality gate.
- Resolve hosted-runner SSH connectivity and rerun GitHub deployment. Reconcile
  the remote environment with `OCI_ENV_FILE` before allowing a workflow to
  overwrite it, particularly `PRODUCT_ANALYTICS_STORE_BACKEND=postgres` and
  national RCN settings.

The persisted import settings remain `RCN_TRANSACTIONS_SCOPE=poland`,
`RCN_POLAND_REGION_CODES=all`, initial lookback 730 days and overlap 14 days.
The region-30/730-day overlap override applied only to the backfill process.
`/etc/cron.d/domarion-rcn-daily` schedules the launcher at 08:00 Europe/Warsaw.
Staging health/readiness is not evidence that production launch gates pass.
