# Authorized Listing Feed Contract

`domarion import-authorized-feed` accepts a bounded UTF-8 JSON export or an
approved JSON API response. It does not crawl portal search pages and does not
follow `next` links.

Before production use, create a `listing_sources` registry entry with:

- `legal_status=approved`;
- `is_active=true` and `is_demo=false`;
- `ingestion_method=authorized_feed`, `authorized_api`, `partner_feed` or
  another explicitly permitted feed method;
- `allowed_use` containing `analytics`, `market_metrics`, `price_history` or
  `reports`;
- owner, Terms/licence/robots notes, retention and source URL scope.

For OLX, use the official Developer Portal/API and obtain the provider's
approval and credentials; do not treat public web pages as an API. For Otodom,
obtain a written feed/API permission and record its Terms/robots decision in the
registry before enabling scheduled ingestion. The application intentionally
does not implement a portal HTML crawler.

## JSON Shape

The document is either an array or:

```json
{
  "listings": [
    {
      "source_listing_id": "provider-123",
      "source_url": "https://approved-provider.example/listings/provider-123",
      "title": "Mieszkanie 3 pokoje",
      "city": "Wrocław",
      "district": "Fabryczna",
      "address": "Nowy Dwór 12",
      "market_type": "secondary",
      "price": 690000,
      "currency": "PLN",
      "area_m2": 59.2,
      "rooms": 3,
      "lat": 51.1117,
      "lon": 16.9653,
      "observed_at": "2026-09-05",
      "first_seen_at": "2026-08-20",
      "building_type": "apartment_block",
      "building_year": 2014,
      "floor": 4,
      "building_floors": 8,
      "renovation_state": "ready_to_move",
      "parking_type": "underground",
      "developer_name": "Example Development"
    }
  ]
}
```

Required fields are source ID, source URL, title, city, district, address,
market type, price, area, rooms and authoritative coordinates. The importer
calculates `price_per_m2`; it does not accept a conflicting source value as
fact. Dates are ISO-8601 dates. District must be a local Wrocław district, not
`dolnośląskie`, `wrocławski` or `powiat wrocławski`.

Photos, contact data, names of private sellers, full descriptions and raw HTML
are prohibited. A feed containing those fields is rejected rather than silently
copied.

## Operations

Dry-run validation:

```bash
domarion import-authorized-feed /path/to/wroclaw.json \
  --source-name "Approved Wroclaw Partner" --dry-run
```

Write observations and refresh area metrics:

```bash
domarion import-authorized-feed /path/to/wroclaw.json \
  --source-name "Approved Wroclaw Partner" \
  --mark-missing-removed
```

`--mark-missing-removed` is applied only when every row passes validation. A
partial or failed run never marks the unseen inventory removed. The importer
stores a job, quality errors, normalized property/source rows, immutable
timestamped snapshots and derived listing events. The final refresh reads
approved non-demo snapshots and calculates Wrocław area statistics for the
Check Apartment repository.

For an authorized remote API, set `MARKET_DATA_FEED_LOCATION` and
`MARKET_DATA_FEED_SOURCE_NAME`, then add `authorized-market-feed` to
`WORKER_TASKS`. The worker remains blocked when either value is missing or the
source registry is not approved.
