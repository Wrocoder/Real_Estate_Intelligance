# Rental Observation Ingestion

## Purpose

WartoMetr stores long-term apartment rental observations separately from sale
listings and RCN transactions. They are used to estimate a monthly asking-rent
range and rental yield only when at least three relevant, recent observations
are available.

The asking sale price is never used to estimate monthly rent. It is used only
as the acquisition-price denominator for gross and net yield.

## Source approval gate

Do not register a rental source as approved until the operator has documented
permission to ingest and use the data for rental analytics and reports.

The `listing_sources` record must meet all of these conditions:

- `legal_status = 'approved'`;
- `is_active = true`;
- `is_demo = false`;
- `ingestion_method` is `partner_csv`, `admin_file_upload`,
  `authorized_feed`, or `authorized_api`;
- `allowed_use_json` explicitly contains `rental_analytics`;
- `base_url`, terms, retention and owner metadata identify the approved scope.

The importer rejects a source that does not pass this gate. An approval value
must describe a real legal decision; it must not be inserted merely to bypass
the check.

## CSV contract

The input must be UTF-8 CSV. Required headers are:

| Field | Meaning |
| --- | --- |
| `source_observation_id` | Stable offer ID assigned by the source |
| `observed_at` | ISO-8601 time when this version was observed |
| `city` | City name |
| `district` | District column; value may be empty |
| `monthly_rent_pln` | Base advertised monthly rent in PLN |
| `area_m2` | Apartment area in m² |

Supported optional headers:

- `source_url`, restricted to the registered source host;
- `active_status`: `active`, `removed`, or `expired`;
- `area_id`, `address`, `property_type`, `building_type`;
- `admin_fee_monthly_pln`, `rooms`, `floor`, `building_year`, `furnished`;
- `lat`, `lon`, `data_quality_score`, `currency`.

Only apartment observations in PLN are accepted. `monthly_rent_pln` is the
base rent and must not silently include administrative fees. If the source
provides those fees, put them in `admin_fee_monthly_pln`.

## Import

Validate a file without writing:

```bash
domarion import-rental-observations /data/rentals.csv \
  --source-name "Approved Rental Feed" \
  --dry-run
```

Import into PostgreSQL:

```bash
domarion import-rental-observations /data/rentals.csv \
  --source-name "Approved Rental Feed"
```

Non-dry imports require `DATA_REPOSITORY_BACKEND=postgres`.

## Version history

`rental_observations` keeps immutable content versions per source and stable
source observation ID. A later observation with unchanged content updates
`last_confirmed_at` on the existing version. A real field or status change
creates a new version. Analytics selects only the latest version and ignores
an offer whose latest status is removed or expired.

Import results distinguish:

- `observations_created`: new stable source IDs;
- `observations_changed`: new content versions of known IDs;
- `observations_reconfirmed`: unchanged observations seen again;
- `rows_rejected`: invalid or unsupported source rows.

## Analytical behavior

Rental comparables are selected in widening stages, beginning with the same
district, similar area, room count and building type. Observations older than
120 days since last confirmation are excluded.

With fewer than three relevant observations, API and UI return
`status = insufficient_data`; rent, gross yield and net yield remain `null`.
With enough evidence, WartoMetr exposes the sample, source names, period,
geographic scope, confidence, rent range, gross yield, net yield, vacancy and
operating-reserve assumptions. Net yield is before income tax, financing and
one-off repairs.

Demo observations exist only in explicit demo mode and must not be treated as
production evidence.
