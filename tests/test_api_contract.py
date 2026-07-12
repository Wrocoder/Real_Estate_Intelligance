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
        (
            "/api/v1/user-submitted-listings/reference-preview",
            "post",
        ): "SourceReferencePreview",
        (
            "/api/v1/user-submitted-listings/import-from-url",
            "post",
        ): "SourceUrlImportResult",
        (
            "/api/v1/user-submitted-listings/analyze",
            "post",
        ): "UserSubmittedListingAnalysis",
        (
            "/api/v1/user-submitted-listings/report",
            "post",
        ): "UserSubmittedListingReport",
        (
            "/api/v1/user-submitted-listings/drafts/{draft_id}",
            "get",
        ): "UserSubmittedListingDraft",
        (
            "/api/v1/user-submitted-listings/drafts/{draft_id}/reports/generate",
            "post",
        ): "GeneratedReport",
        ("/api/v1/ai-insights/{insight_id}", "get"): "AIInsight",
        (
            "/api/v1/admin/user-submitted-listing-drafts/prune-expired",
            "post",
        ): "UserSubmittedListingDraftPruneResult",
        ("/api/v1/partner-referrals/{referral_id}", "get"): "PartnerReferral",
        ("/api/v1/admin/partner-referrals/{referral_id}", "patch"): "PartnerReferral",
        ("/api/v1/admin/alerts/deliver-daily-email", "post"): "AlertDeliveryBatchResult",
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
        "AIInsight",
        "AIInsightListItem",
        "AmenityReference",
        "AreaMarketSnapshotJobResult",
        "DistrictReference",
        "GenerateUserSubmittedDraftReportRequest",
        "IndustrialZoneReference",
        "KindergartenReference",
        "LocationReference",
        "MarketDashboard",
        "MarketDashboardArea",
        "MarketDistributionBucket",
        "MortgageAffordability",
        "MortgageCalculationRequest",
        "MortgageCalculationResult",
        "MortgageCostBreakdown",
        "MortgageScenario",
        "MunicipalityReference",
        "ObjectReport",
        "AlertDeliveryBatchRequest",
        "AlertDeliveryBatchResult",
        "AlertDeliveryBatchSkip",
        "PartnerReferral",
        "PartnerReferralCreate",
        "PartnerReferralUpdate",
        "PartnerCsvImportResponse",
        "PlannedInvestmentImportResponse",
        "PriceHistoryRebuildResult",
        "ReportBranding",
        "ReportEmailRequest",
        "ReportEmailResult",
        "ReportTemplateDescriptor",
        "SchoolReference",
        "ScoringBacktestResult",
        "SourceReferencePreview",
        "SourceReferencePreviewRequest",
        "SourceUrlImportFields",
        "SourceUrlImportRequest",
        "SourceUrlImportResult",
        "TransportRouteReference",
        "TransportStopReference",
        "SourceRegistryEntry",
        "SourceRegistryEntryCreate",
        "SourceRegistryEntryUpdate",
        "UserSubmittedListingAnalysis",
        "UserSubmittedListingDraft",
        "UserSubmittedListingDraftPruneResult",
        "UserSubmittedListingRequest",
        "UserSubmittedListingReport",
        "UserSubmittedListingReportRequest",
    }

    assert expected_schemas <= set(schemas)

    ai_insights_list_schema = openapi["paths"]["/api/v1/ai-insights"]["get"]["responses"][
        "200"
    ]["content"]["application/json"]["schema"]
    assert ai_insights_list_schema["type"] == "array"
    assert ai_insights_list_schema["items"]["$ref"] == "#/components/schemas/AIInsightListItem"

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

    reference_operation = openapi["paths"][
        "/api/v1/user-submitted-listings/reference-preview"
    ]["post"]
    reference_request_schema = reference_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert reference_request_schema["$ref"] == (
        "#/components/schemas/SourceReferencePreviewRequest"
    )

    import_operation = openapi["paths"][
        "/api/v1/user-submitted-listings/import-from-url"
    ]["post"]
    import_request_schema = import_operation["requestBody"]["content"]["application/json"][
        "schema"
    ]
    assert import_request_schema["$ref"] == "#/components/schemas/SourceUrlImportRequest"

    user_listing_operation = openapi["paths"]["/api/v1/user-submitted-listings/analyze"]["post"]
    user_listing_request_schema = user_listing_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert user_listing_request_schema["$ref"] == "#/components/schemas/UserSubmittedListingRequest"

    user_report_operation = openapi["paths"]["/api/v1/user-submitted-listings/report"]["post"]
    user_report_request_schema = user_report_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert user_report_request_schema["$ref"] == (
        "#/components/schemas/UserSubmittedListingReportRequest"
    )

    draft_list_schema = openapi["paths"]["/api/v1/user-submitted-listings/drafts"]["get"][
        "responses"
    ]["200"]["content"]["application/json"]["schema"]
    assert draft_list_schema["type"] == "array"
    assert draft_list_schema["items"]["$ref"] == "#/components/schemas/UserSubmittedListingDraft"

    admin_draft_list_schema = openapi["paths"]["/api/v1/admin/user-submitted-listing-drafts"][
        "get"
    ]["responses"]["200"]["content"]["application/json"]["schema"]
    assert admin_draft_list_schema["type"] == "array"
    assert admin_draft_list_schema["items"]["$ref"] == (
        "#/components/schemas/UserSubmittedListingDraft"
    )

    draft_report_operation = openapi["paths"][
        "/api/v1/user-submitted-listings/drafts/{draft_id}/reports/generate"
    ]["post"]
    draft_report_request_schema = draft_report_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert draft_report_request_schema["$ref"] == (
        "#/components/schemas/GenerateUserSubmittedDraftReportRequest"
    )

    partner_referral_operation = openapi["paths"]["/api/v1/partner-referrals"]["post"]
    partner_referral_response_schema = partner_referral_operation["responses"]["201"]["content"][
        "application/json"
    ]["schema"]
    partner_referral_request_schema = partner_referral_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert partner_referral_response_schema["$ref"] == "#/components/schemas/PartnerReferral"
    assert partner_referral_request_schema["$ref"] == "#/components/schemas/PartnerReferralCreate"

    partner_referral_list_schema = openapi["paths"]["/api/v1/partner-referrals"]["get"][
        "responses"
    ]["200"]["content"]["application/json"]["schema"]
    assert partner_referral_list_schema["type"] == "array"
    assert partner_referral_list_schema["items"]["$ref"] == "#/components/schemas/PartnerReferral"

    admin_partner_referral_list_schema = openapi["paths"]["/api/v1/admin/partner-referrals"][
        "get"
    ]["responses"]["200"]["content"]["application/json"]["schema"]
    assert admin_partner_referral_list_schema["type"] == "array"
    assert admin_partner_referral_list_schema["items"]["$ref"] == (
        "#/components/schemas/PartnerReferral"
    )

    admin_partner_referral_update_schema = openapi["paths"][
        "/api/v1/admin/partner-referrals/{referral_id}"
    ]["patch"]["requestBody"]["content"]["application/json"]["schema"]
    assert admin_partner_referral_update_schema["$ref"] == (
        "#/components/schemas/PartnerReferralUpdate"
    )

    daily_email_alert_operation = openapi["paths"][
        "/api/v1/admin/alerts/deliver-daily-email"
    ]["post"]
    daily_email_alert_request_schema = daily_email_alert_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert daily_email_alert_request_schema["anyOf"][0]["$ref"] == (
        "#/components/schemas/AlertDeliveryBatchRequest"
    )
