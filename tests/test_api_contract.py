from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_openapi_exposes_recent_admin_analytics_and_report_endpoints() -> None:
    openapi = client.get("/openapi.json").json()

    expected_response_refs = {
        ("/api/v1/admin/listings/import-csv", "post"): "PartnerCsvImportResponse",
        ("/api/v1/admin/planned-investments/import", "post"): "PlannedInvestmentImportResponse",
        ("/api/v1/admin/scoring/backtest", "get"): "ScoringBacktestResult",
        ("/api/v1/admin/area-market-snapshots", "post"): "AreaMarketSnapshotJobResult",
        ("/api/v1/admin/price-history/rebuild", "post"): "PriceHistoryRebuildResult",
        ("/api/v1/market/dashboard", "get"): "MarketDashboard",
        ("/api/v1/mortgage/calculate", "post"): "MortgageCalculationResult",
        ("/api/v1/reports/object", "post"): "ObjectReport",
        ("/api/v1/reports/{report_id}/email", "post"): "ReportEmailResult",
    }

    for (path, method), schema_name in expected_response_refs.items():
        operation = openapi["paths"][path][method]
        schema = operation["responses"]["200"]["content"]["application/json"]["schema"]

        assert schema["$ref"] == f"#/components/schemas/{schema_name}"


def test_openapi_exposes_report_templates_as_a_public_contract() -> None:
    openapi = client.get("/openapi.json").json()
    operation = openapi["paths"]["/api/v1/reports/templates"]["get"]
    schema = operation["responses"]["200"]["content"]["application/json"]["schema"]

    assert schema["type"] == "array"
    assert schema["items"]["$ref"] == "#/components/schemas/ReportTemplateDescriptor"


def test_openapi_exposes_source_registry_contract() -> None:
    openapi = client.get("/openapi.json").json()
    paths = openapi["paths"]

    list_schema = paths["/api/v1/admin/ingestion/sources"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"]
    create_schema = paths["/api/v1/admin/ingestion/sources"]["post"]["responses"]["201"][
        "content"
    ]["application/json"]["schema"]
    update_schema = paths["/api/v1/admin/ingestion/sources/{source_id}"]["patch"][
        "responses"
    ]["200"]["content"]["application/json"]["schema"]
    request_schema = paths["/api/v1/admin/ingestion/sources"]["post"]["requestBody"][
        "content"
    ]["application/json"]["schema"]

    assert list_schema["type"] == "array"
    assert list_schema["items"]["$ref"] == "#/components/schemas/SourceRegistryEntry"
    assert create_schema["$ref"] == "#/components/schemas/SourceRegistryEntry"
    assert update_schema["$ref"] == "#/components/schemas/SourceRegistryEntry"
    assert request_schema["$ref"] == "#/components/schemas/SourceRegistryEntryCreate"


def test_openapi_exposes_recent_request_and_response_models() -> None:
    openapi = client.get("/openapi.json").json()
    schemas = openapi["components"]["schemas"]

    expected_schemas = {
        "AreaMarketSnapshotJobResult",
        "MarketDashboard",
        "MarketDashboardArea",
        "MarketDistributionBucket",
        "MortgageAffordability",
        "MortgageCalculationRequest",
        "MortgageCalculationResult",
        "MortgageCostBreakdown",
        "MortgageScenario",
        "ObjectReport",
        "PartnerCsvImportResponse",
        "PlannedInvestmentImportResponse",
        "PriceHistoryRebuildResult",
        "ReportBranding",
        "ReportEmailRequest",
        "ReportEmailResult",
        "ReportTemplateDescriptor",
        "ScoringBacktestResult",
        "SourceRegistryEntry",
        "SourceRegistryEntryCreate",
        "SourceRegistryEntryUpdate",
    }

    assert expected_schemas <= set(schemas)

    report_request = schemas["ReportRequest"]
    assert report_request["properties"]["branding"]["anyOf"][0]["$ref"] == (
        "#/components/schemas/ReportBranding"
    )

    email_operation = openapi["paths"]["/api/v1/reports/{report_id}/email"]["post"]
    email_request_schema = email_operation["requestBody"]["content"]["application/json"]["schema"]
    assert email_request_schema["$ref"] == "#/components/schemas/ReportEmailRequest"

    mortgage_operation = openapi["paths"]["/api/v1/mortgage/calculate"]["post"]
    mortgage_request_schema = mortgage_operation["requestBody"]["content"]["application/json"][
        "schema"
    ]
    assert mortgage_request_schema["$ref"] == "#/components/schemas/MortgageCalculationRequest"
