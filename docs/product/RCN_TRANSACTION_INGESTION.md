# RCN Transaction Ingestion

Domarion treats RCN/GUGiK records as transaction observations, not listing
offers. They are stored in `transaction_observations` and are never written to
`listing_snapshots` or `property_sources`.

## Supported inputs

- official RCN WFS GML response, normally `typeNames=ms:lokale`;
- normalized GeoJSON export with the same canonical fields.

Remote WFS requests must include an explicit `BBOX`. The importer follows the
provider's `next` URL only while the scheme, host and path remain unchanged,
and stops at the configured page/row/response budgets. It does not crawl
portal pages or bypass authentication, robots, rate limits or other controls.

The official GUGiK layer may contain an address and EPSG:2180 point without a
district. In that case the importer keeps `geometry_x`, `geometry_y` and
`geometry_crs` and aggregates the observation to `wroclaw-city`. Districts are
assigned only by the explicit boundary join below; an unmatched point is not
assigned from an address guess.

## Wrocław district split

The official Wrocław Geoportal publishes the osiedle boundary ZIP:
`https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip`. The file is
in EPSG:2177; RCN point coordinates are retained in EPSG:2180 and PostGIS
performs the transformation for the spatial join. The boundaries are stored
separately in `district_boundaries`, with source and CRS provenance.

Load the boundaries once on a new environment:

```bash
domarion import-district-boundaries /srv/domarion/data/granice-osiedli.zip
```

Set `RCN_DISTRICT_BOUNDARIES_LOCATION` to that local ZIP path. On Oracle
staging, the daily task is launched by cron at 08:00 Europe/Warsaw and refreshes
the polygons before the transaction import. Covered observations receive the official
osiedle name and `area_id=wroclaw-<slug>`; unresolved points remain visible in
the city aggregate.

## Source registry gate

Before a write run, create an active non-demo `listing_sources` record with:

- `source_type=transaction_register`;
- `legal_status=approved`;
- `ingestion_method=rcn_wfs` or another explicitly approved open-data method;
- `allowed_use_json` containing `market_metrics` and `reports`;
- GUGiK owner, service URL, retention and current terms/licence decision.

The application does not mark the source approved automatically. The registry
is the operator's record of the current legal and operational review.

## Commands

Validate a bounded WFS request:

```bash
domarion import-rcn-transactions "$RCN_TRANSACTIONS_LOCATION" \
  --source-name "RCN GUGiK" --dry-run
```

Import and rebuild the market baseline:

```bash
domarion import-rcn-transactions "$RCN_TRANSACTIONS_LOCATION" \
  --source-name "RCN GUGiK" --max-rows 100000 --max-pages 500
```

`transaction_date` is the date of the transaction document. `observed_at` is
the import time. The price-per-m² calculation prefers `lok_cena_brutto`, then
`nier_cena_brutto`, then `tran_cena_brutto`; the selected basis is persisted.
Rows without a positive apartment area, price, date, stable source/version
identifier or Wrocław city are quarantined in `data_quality_logs`.

## Fair-price behavior

`refresh_market_metrics` uses approved RCN observations from the last three
years as the area price baseline when they exist. Listing snapshots continue
to drive asking-price inventory, days on market, removals and supply changes.
The existing fair-price scorer therefore receives the RCN median through
`AreaStatistics`, while `price_basis`, transaction sample size, source and
date range remain visible in the same contract.

If only RCN records exist, the report can still estimate a fair-price range,
but liquidity and listing supply are marked unavailable and do not receive a
positive default. With no RCN or approved listing observations, the system
returns no market baseline rather than showing demo data as evidence.

The daily task is idempotent: it uses the RCN source/version identifier as the
unique key, so unchanged rows become updates rather than duplicate facts. The
worker checks the last successful `transaction_register` job in the database
and will not run again before `RCN_TRANSACTIONS_INTERVAL_SECONDS` (86400 by
default) when invoked by the persistent worker. The Oracle cron launcher uses a
single explicit run at 08:00 and a filesystem lock. A successful write returns
counts for new, updated, rejected and district-assigned rows. Telegram is
optional and never turns a successful data import into a failed import.
