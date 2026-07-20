# Poland City Expansion Checklist

Date: 2026-07-20

This checklist defines when Domarion can expand beyond Wrocław/Dolnośląskie
without weakening report quality or creating source/legal risk. It is a go/no-go
tool for adding another Polish city to ingestion, scoring, maps and reports.

## Expansion Principle

Do not open a new city just because listings exist. Open it only when the product
can produce a defensible buyer/investor report with enough local comparables,
source citations, infrastructure context and confidence warnings.

The preferred expansion path is:

1. Open-data and registry readiness.
2. Partner/manual listing feed or permitted source access.
3. Geocoding and administrative boundary coverage.
4. Local scoring calibration.
5. Report QA with real addresses.
6. Paid beta demand in that market.

## City Readiness Gates

A city is ready for an MVP launch only if all critical gates pass.

| Gate | Minimum Requirement | Blocker If Missing |
| --- | --- | --- |
| Legal source status | Source registry has owner, legal status, retention and refresh policy. | Yes |
| Listing supply | At least 300 active or historical legal-first comparable flats, or a signed partner feed. | Yes |
| Transaction signal | RCN availability checked for the city/powiat, or explicit fallback to offer-market estimates. | Yes |
| Area baselines | District/municipality statistics exist for price/m2, liquidity, stock and demand proxy. | Yes |
| Geocoding | Address normalization supports city, districts, gminas, aliases and coordinate confidence. | Yes |
| Boundaries | Municipality/district/neighborhood references are loaded with source attribution. | Yes |
| Infrastructure | Transport, education, healthcare, parks/greenery and major-road/industrial proxies loaded. | Yes |
| Planning/risk | MPZP/Studium or equivalent zoning/risk layers are identified with legal-review flags. | Warning |
| Developer data | Primary-market developer/project matching is available or missing-data warnings are shown. | Warning |
| Report QA | At least 20 manually reviewed link/address reports across different districts. | Yes |
| Paid demand | At least 5 qualified buyer/realtor/investor leads in the city. | Warning |

## Data-Source Checklist

Use this checklist before importing any city-level source. Every source should be
registered in the source registry before production ingestion.

| Layer | Candidate Source | Validation |
| --- | --- | --- |
| Administrative geography | GUGiK/Geoportal, city GIS/SIP, TERYT/REGON references. | Confirm license, stable identifiers, geometry precision and update cadence. |
| Transaction prices | RCN through Geoportal/powiat availability. | Confirm availability for powiat, access method, allowed usage and freshness. |
| Demographics/economy | GUS BDL API. | Pin variable IDs, spatial units and update frequency. |
| Offer-market supply | Partner CSV/API, agency exports, user-submitted drafts. | Confirm rights, dedup rules, retention and no prohibited copied content. |
| Public transport | City open-data portal, GTFS/GTFS-RT where available. | Validate stop IDs, route shapes, service dates and attribution. |
| Schools/kindergartens | City open data, official education registers, OSM as fallback where allowed. | Validate type taxonomy and coordinates. |
| Healthcare | City/open registers and OSM fallback where allowed. | Validate hospitals/clinics taxonomy and duplicates. |
| Parks/greenery | City GIS/SIP, GUGiK/Geoportal, OSM fallback where allowed. | Validate geometry type, public access and category. |
| Roads/noise/rail/airport | City GIS, GDDKiA, rail/airport official layers, OSM fallback where allowed. | Mark proxy layers clearly if official risk data is missing. |
| MPZP/Studium | Municipal planning portal/SIP. | Confirm legal status, whether layer is binding, and parcel-level precision limits. |
| Flood/pollution | National or city risk portals where available. | Mark missing public layer warnings in reports. |
| Developer reputation | KRS/REGON, UOKiK, DFG, developer directories, partner inspection data. | Confirm entity matching, citation rules and dispute/removal process. |
| News/local events | Official city newsroom, transport authority, planning office, reputable local media. | Store article source URL/citation and category; do not copy full articles. |

## City Scoring Card

Score every candidate city from 0 to 100 before implementation.

| Factor | Weight | Scoring Notes |
| --- | ---: | --- |
| Buyer demand and lead quality | 15 | Search demand, paid beta leads, realtor pull. |
| Legal-first listing access | 20 | Partner feed strength, historical depth, dedup feasibility. |
| Transaction/open-data availability | 15 | RCN, GUS, city open data, zoning/risk layers. |
| Geospatial complexity | 10 | Boundaries, aliases, suburban spillover, commute patterns. |
| Report defensibility | 20 | Comparable density and local calibration confidence. |
| Monetization fit | 10 | Realtor/investor/buyer willingness to pay. |
| Operational effort | 10 | Source onboarding, QA, maintenance and monitoring cost. |

Decision thresholds:

- `80-100`: launch candidate after legal review and 20 report QA cases.
- `65-79`: limited beta with explicit confidence warnings and manual QA.
- `50-64`: research/backlog only, build data partnerships first.
- `<50`: do not expand yet.

## Recommended Polish City Order

Initial ranking should be re-scored with real leads and source checks:

1. Kraków: high demand, strong investor/realtor market, complex pricing.
2. Warszawa: highest demand and monetization, but high complexity and competition.
3. Poznań: strong data/market fit with manageable scope.
4. Trójmiasto: strong buyer/investor market, requires multi-city coastal logic.
5. Łódź: affordability/investor angle, requires careful area-risk calibration.
6. Katowice/GZM: useful for metro expansion, but complex multi-municipality model.

Do not treat this order as final. The first expansion city should be whichever
city scores highest after source legal review and paid beta lead validation.

## Implementation Steps

1. Create a city source registry entry for every candidate source.
2. Run legal/data review before importing production data.
3. Build a sample partner/open-data pack under `data/samples/`.
4. Add geocoding aliases and municipality/district references.
5. Import area statistics and at least one comparable feed.
6. Add infrastructure references and distance enrichment.
7. Run dedup/source-health checks.
8. Generate 20 buyer reports from real user-style addresses/URLs.
9. Document known missing layers and confidence warnings.
10. Enable city in frontend filters only after report QA passes.

## Definition Of Done

A city expansion is done when:

- Source registry has all active sources with legal status and refresh cadence.
- Import can run in dry-run and write modes without schema drift.
- Area statistics and comparables are sufficient for object reports.
- `/check` link/address reports do not fall back to unrelated proxy markets.
- Map layers render without blank/overlapping critical layers.
- Source health appears in admin monitoring.
- Report warnings clearly identify missing official risk/planning layers.
- Smoke tests cover at least one listing/search/report path for the city.

## Official Source References

- GUS BDL API: https://api.stat.gov.pl/Home/BdlApi?lang=en
- GUGiK/Geoportal data: https://www.geoportal.gov.pl/en/data/
- GUGiK official data overview: https://www.gov.pl/web/gugik-en/data
- Geoportal RCN: https://www.geoportal.gov.pl/pl/dane/rejestr-cen-nieruchomosci-rcn/
- GUGiK RCN availability note:
  https://www.gov.pl/web/gugik/w-serwisie-wwwgeoportalgovpl-sprawdzisz-dane-z-rejestru-cen-nieruchomosci
- GTFS overview: https://gtfs.org/documentation/overview/
