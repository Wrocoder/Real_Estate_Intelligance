from domarion.schemas import OpenDataRoadmapItem, OpenDataRoadmapStatus

OPEN_DATA_ROADMAP: tuple[OpenDataRoadmapItem, ...] = (
    OpenDataRoadmapItem(
        id="gus-bdl",
        name="GUS Local Data Bank API",
        provider="Glowny Urzad Statystyczny",
        domains=["demographics", "socioeconomics", "municipality_context"],
        access_method="REST API JSON/XML",
        ingestion_method="scheduled_rest_api_pull",
        documentation_url="https://api.stat.gov.pl/Home/BdlApi?lang=en",
        data_url="https://bdl.stat.gov.pl/api/v1",
        license="public statistics API; API limits apply",
        legal_status="approved",
        legal_notes=(
            "Use X-ClientId for higher API limits; store only aggregate public statistics."
        ),
        refresh_cadence="monthly",
        priority=10,
        status="ready_for_import",
        target_tables=["area_market_snapshots", "municipality_references"],
        next_step="Map BDL unit ids for Wroclaw districts/municipality and pin variable ids.",
        risks=["Variable ids and aggregation levels must be versioned."],
        metadata={
            "source_family": "official_statistics",
            "first_candidate_variables": [
                "population",
                "age_structure",
                "housing_stock",
                "new_dwellings",
            ],
        },
    ),
    OpenDataRoadmapItem(
        id="gugik-geoportal-services",
        name="GUGiK Geoportal spatial services",
        provider="Glowny Urzad Geodezji i Kartografii",
        domains=["boundaries", "addresses", "topography", "spatial_reference"],
        access_method="WMS/WMTS/WFS/WCS/ATOM/CSW services",
        ingestion_method="wfs_or_atom_spatial_import",
        documentation_url="https://www.geoportal.gov.pl/en/services/",
        data_url="https://mapy.geoportal.gov.pl",
        license="official geodetic and cartographic resources; dataset terms vary",
        legal_status="review_required",
        legal_notes="Confirm dataset-specific terms before persisting derived commercial features.",
        refresh_cadence="weekly",
        priority=20,
        status="ready_for_import",
        target_tables=["municipality_references", "district_references", "location_references"],
        next_step="Start with WFS/ATOM boundaries and address dictionaries, then normalize CRS.",
        risks=["Service schemas differ by dataset and may require CRS transforms."],
        metadata={"source_family": "national_geospatial"},
    ),
    OpenDataRoadmapItem(
        id="gugik-rcn",
        name="GUGiK / powiat Rejestr Cen Nieruchomosci",
        provider="GUGiK and powiaty",
        domains=["transaction_prices", "market_benchmarking", "valuation_context"],
        access_method="Geoportal RCN module plus WMS/WFS services",
        ingestion_method="legal_review_then_wfs_transaction_import",
        documentation_url="https://www.geoportal.gov.pl/pl/dane/rejestr-cen-nieruchomosci-rcn/",
        data_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
        license="public register; no-fee access, dataset scope depends on powiat publication",
        legal_status="review_required",
        legal_notes=(
            "Treat as market benchmark data only; validate allowed retention and attribution terms."
        ),
        refresh_cadence="weekly",
        priority=30,
        status="needs_legal_review",
        target_tables=["area_market_snapshots", "price_history_points", "listing_events"],
        next_step=(
            "Run legal review for retention/commercial use, then prototype one powiat import."
        ),
        risks=[
            "Coverage varies by powiat.",
            "Attributes may not be sufficient for direct listing comparables.",
        ],
        metadata={"source_family": "official_transaction_prices"},
    ),
    OpenDataRoadmapItem(
        id="wroclaw-sip",
        name="Wroclaw Spatial Information System",
        provider="Miasto Wroclaw",
        region="Wroclaw",
        domains=["mpzp", "addresses", "districts", "education", "environment", "planning"],
        access_method="downloadable GML/SHP files and WFS services",
        ingestion_method="scheduled_spatial_file_import",
        documentation_url="https://geoportal.wroclaw.pl/en/resources/",
        data_url="https://geoportal.wroclaw.pl/en/resources/",
        license="dataset-specific; many resources marked no restrictions",
        legal_status="review_required",
        legal_notes="Confirm terms per dataset before using in paid reports.",
        refresh_cadence="daily_to_monthly",
        priority=40,
        status="ready_for_import",
        target_tables=[
            "district_references",
            "location_references",
            "schools",
            "kindergartens",
            "amenities",
            "planned_investments",
        ],
        next_step="Import districts, addresses and local plan regulation layers first.",
        risks=["Some MPZP regulation layers are analytical and not legally binding."],
        metadata={"source_family": "municipal_spatial"},
    ),
    OpenDataRoadmapItem(
        id="wroclaw-open-data",
        name="OpenData Wroclaw catalog",
        provider="Centrum Uslug Informatycznych we Wroclawiu",
        region="Wroclaw",
        domains=["transport", "public_services", "municipal_open_data"],
        access_method="open data catalog datasets",
        ingestion_method="dataset_catalog_pull_then_file_import",
        documentation_url="https://open-data.cui.wroclaw.pl/",
        data_url="https://open-data.cui.wroclaw.pl/",
        license="dataset-specific open data terms",
        legal_status="review_required",
        legal_notes="Confirm license and attribution for each dataset before publication.",
        refresh_cadence="daily_to_monthly",
        priority=50,
        status="candidate",
        target_tables=["transport_stops", "transport_routes", "amenities"],
        next_step="Select stable GTFS/public transport and public service datasets.",
        risks=["Catalog URLs and dataset ids can change."],
        metadata={"source_family": "municipal_open_data"},
    ),
    OpenDataRoadmapItem(
        id="openstreetmap",
        name="OpenStreetMap",
        provider="OpenStreetMap Foundation and contributors",
        domains=["amenities", "parks", "roads", "transport", "poi_context", "walkability"],
        access_method="OSM extracts / Overpass-style queries",
        ingestion_method="extract_import_with_attribution",
        documentation_url="https://www.openstreetmap.org/copyright",
        data_url=None,
        license="Open Database License (ODbL)",
        legal_status="review_required",
        legal_notes="Requires attribution and careful handling of derived database obligations.",
        refresh_cadence="weekly",
        priority=60,
        status="needs_legal_review",
        target_tables=["amenities", "transport_stops", "industrial_zones"],
        next_step="Decide whether to import via licensed extracts or use query-time enrichment.",
        risks=["ODbL share-alike obligations for derived databases must be handled explicitly."],
        metadata={"source_family": "community_geospatial"},
    ),
)


def list_open_data_roadmap(
    *,
    domain: str | None = None,
    status: OpenDataRoadmapStatus | None = None,
) -> list[OpenDataRoadmapItem]:
    domain_filter = domain.lower() if domain else None
    items = list(OPEN_DATA_ROADMAP)
    if domain_filter:
        items = [
            item
            for item in items
            if any(candidate.lower() == domain_filter for candidate in item.domains)
        ]
    if status:
        items = [item for item in items if item.status == status]
    return sorted(items, key=lambda item: (item.priority, item.id))
