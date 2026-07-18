from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_openapi_exposes_recent_admin_analytics_and_report_endpoints() -> None:
    openapi = client.get("/openapi.json").json()

    expected_response_refs = {
        ("/api/v1/admin/listings/import-csv", "post"): "PartnerCsvImportResponse",
        ("/api/v1/admin/planned-investments/import", "post"): "PlannedInvestmentImportResponse",
        ("/api/v1/admin/scoring/backtest", "get"): "ScoringBacktestResult",
        ("/api/v1/admin/scoring/backtest-report", "get"): "ScoringBacktestReport",
        ("/api/v1/admin/area-market-snapshots", "post"): "AreaMarketSnapshotJobResult",
        ("/api/v1/admin/price-history/rebuild", "post"): "PriceHistoryRebuildResult",
        ("/api/v1/admin/infrastructure/enrich", "post"): "InfrastructureEnrichmentJobResult",
        ("/api/v1/areas/compare", "get"): "AreaComparison",
        ("/api/v1/api-lite/areas/compare", "get"): "AreaComparison",
        ("/api/v1/api-lite/listings", "get"): "ApiLiteListingSearchResponse",
        ("/api/v1/api-lite/listings/{listing_id}", "get"): "ApiLiteListingDetail",
        ("/api/v1/api-lite/usage", "get"): "ApiLiteUsageSummary",
        ("/api/v1/compare", "post"): "CompareResponse",
        (
            "/api/v1/enterprise/custom-dashboards/{dashboard_id}",
            "get",
        ): "CustomDashboardConfig",
        (
            "/api/v1/enterprise/custom-dashboards/{dashboard_id}",
            "patch",
        ): "CustomDashboardConfig",
        (
            "/api/v1/enterprise/custom-dashboards/{dashboard_id}/preview",
            "post",
        ): "CustomDashboardPreview",
        ("/api/v1/realtor/client-shortlists/preview", "post"): "RealtorClientShortlist",
        ("/api/v1/developers", "get"): "DeveloperRankingResponse",
        ("/api/v1/developers/{developer_id}", "get"): "DeveloperReputation",
        ("/api/v1/listings/{listing_id}/developer", "get"): "DeveloperReputation",
        ("/api/v1/listings/hidden-gems", "get"): "HiddenGemsResponse",
        ("/api/v1/market/dashboard", "get"): "MarketDashboard",
        ("/api/v1/market/intelligence-report", "get"): "MarketIntelligenceReport",
        ("/api/v1/mortgage/calculate", "post"): "MortgageCalculationResult",
        ("/api/v1/scoring/evaluate", "post"): "ScoringServiceResult",
        ("/api/v1/news/{article_id}", "get"): "NewsArticle",
        ("/api/v1/admin/news/articles/{article_id}", "patch"): "NewsArticle",
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
        ("/api/v1/admin/ingestion/source-errors/{error_id}", "patch"): "SourceError",
        (
            "/api/v1/admin/ingestion/source-errors/{error_id}/retry",
            "post",
        ): "SourceErrorRetryResult",
        (
            "/api/v1/admin/partner-referrals/{referral_id}/lead-score",
            "get",
        ): "PartnerLeadScore",
        ("/api/v1/partner-referrals/{referral_id}", "get"): "PartnerReferral",
        ("/api/v1/admin/partner-referrals/{referral_id}", "patch"): "PartnerReferral",
        ("/api/v1/admin/alerts/deliver-daily-email", "post"): "AlertDeliveryBatchResult",
        ("/api/v1/ai/data-contract", "get"): "AIAssistantDataContract",
        ("/api/v1/ai/areas/{area_id}/summary", "post"): "AreaImpactSummary",
        ("/api/v1/ai/news/{article_id}/summary", "post"): "NewsArticleAISummary",
        ("/api/v1/ai/compare/answer", "post"): "AICompareAnswer",
        ("/api/v1/ai/listings/{listing_id}/answer", "post"): "AIListingAnswer",
        (
            "/api/v1/ai/user-submitted-listing-drafts/{draft_id}/answer",
            "post",
        ): "AIListingAnswer",
        ("/api/v1/reports/object", "post"): "ObjectReport",
        ("/api/v1/reports/{report_id}/email", "post"): "ReportEmailResult",
        ("/api/v1/agencies/{agency_id}", "get"): "AgencyWorkspace",
        ("/api/v1/agencies/{agency_id}", "patch"): "AgencyWorkspace",
        (
            "/api/v1/agencies/{agency_id}/members/{membership_id}",
            "patch",
        ): "AgencyMembership",
    }

    for (path, method), schema_name in expected_response_refs.items():
        operation = openapi["paths"][path][method]
        schema = operation["responses"]["200"]["content"]["application/json"]["schema"]

        assert schema["$ref"] == f"#/components/schemas/{schema_name}"

    questions_operation = openapi["paths"]["/api/v1/ai/questions"]["get"]
    questions_schema = questions_operation["responses"]["200"]["content"]["application/json"][
        "schema"
    ]
    assert questions_schema["type"] == "array"
    assert questions_schema["items"]["$ref"] == "#/components/schemas/AIQuestionDescriptor"

    news_operation = openapi["paths"]["/api/v1/news"]["get"]
    news_schema = news_operation["responses"]["200"]["content"]["application/json"]["schema"]
    assert news_schema["type"] == "array"
    assert news_schema["items"]["$ref"] == "#/components/schemas/NewsArticleListItem"

    dashboards_operation = openapi["paths"]["/api/v1/enterprise/custom-dashboards"]["get"]
    dashboards_schema = dashboards_operation["responses"]["200"]["content"][
        "application/json"
    ]["schema"]
    assert dashboards_schema["type"] == "array"
    assert dashboards_schema["items"]["$ref"] == "#/components/schemas/CustomDashboardConfig"

    expected_created_refs = {
        ("/api/v1/admin/ingestion/source-checks", "post"): "SourceCheckJob",
        ("/api/v1/admin/ingestion/source-errors", "post"): "SourceError",
        ("/api/v1/admin/news/articles", "post"): "NewsArticle",
        ("/api/v1/agencies", "post"): "AgencyWorkspace",
        ("/api/v1/agencies/{agency_id}/members", "post"): "AgencyMembership",
        ("/api/v1/enterprise/custom-dashboards", "post"): "CustomDashboardConfig",
    }
    for (path, method), schema_name in expected_created_refs.items():
        operation = openapi["paths"][path][method]
        schema = operation["responses"]["201"]["content"]["application/json"]["schema"]

        assert schema["$ref"] == f"#/components/schemas/{schema_name}"


def test_openapi_exposes_report_templates_as_a_public_contract() -> None:
    openapi = client.get("/openapi.json").json()
    operation = openapi["paths"]["/api/v1/reports/templates"]["get"]
    schema = operation["responses"]["200"]["content"]["application/json"]["schema"]

    assert schema["type"] == "array"
    assert schema["items"]["$ref"] == "#/components/schemas/ReportTemplateDescriptor"


def test_openapi_exposes_pdf_report_exports_as_pdf_contract() -> None:
    openapi = client.get("/openapi.json").json()

    saved_report = openapi["paths"]["/api/v1/reports/{report_id}/pdf"]["get"]
    object_report = openapi["paths"]["/api/v1/reports/object/{listing_id}.pdf"]["get"]

    assert "application/pdf" in saved_report["responses"]["200"]["content"]
    assert "application/pdf" in object_report["responses"]["200"]["content"]


def test_openapi_exposes_dataset_exports_as_file_contract() -> None:
    openapi = client.get("/openapi.json").json()
    dataset_export = openapi["paths"]["/api/v1/datasets/listings/export"]["get"]
    content = dataset_export["responses"]["200"]["content"]

    assert "application/json" in content
    assert "text/csv" in content


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

    roadmap_schema = paths["/api/v1/admin/ingestion/open-data-roadmap"]["get"]["responses"][
        "200"
    ]["content"]["application/json"]["schema"]
    assert roadmap_schema["type"] == "array"
    assert roadmap_schema["items"]["$ref"] == "#/components/schemas/OpenDataRoadmapItem"

    infrastructure_import_schema = paths["/api/v1/admin/infrastructure/import"]["post"][
        "responses"
    ]["200"]["content"]["application/json"]["schema"]
    assert infrastructure_import_schema["$ref"] == (
        "#/components/schemas/InfrastructureReferenceImportResponse"
    )

    checks_schema = paths["/api/v1/admin/ingestion/source-checks"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"]
    errors_schema = paths["/api/v1/admin/ingestion/source-errors"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"]
    assert checks_schema["type"] == "array"
    assert checks_schema["items"]["$ref"] == "#/components/schemas/SourceCheckJob"
    assert errors_schema["type"] == "array"
    assert errors_schema["items"]["$ref"] == "#/components/schemas/SourceError"

    retention_prune_schema = paths[
        "/api/v1/admin/ingestion/sources/prune-retained-raw-payloads"
    ]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
    deletion_request_schema = paths["/api/v1/admin/data-deletion-requests"]["post"][
        "responses"
    ]["201"]["content"]["application/json"]["schema"]
    deletion_request_process_schema = paths[
        "/api/v1/admin/data-deletion-requests/{request_id}/process"
    ]["post"]["requestBody"]["content"]["application/json"]["schema"]
    audit_logs_schema = paths["/api/v1/admin/audit-logs"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"]
    assert retention_prune_schema["$ref"] == "#/components/schemas/SourceRetentionPruneResult"
    assert deletion_request_schema["$ref"] == "#/components/schemas/DataDeletionRequest"
    assert deletion_request_process_schema["$ref"] == (
        "#/components/schemas/DataDeletionRequestProcess"
    )
    assert audit_logs_schema["type"] == "array"
    assert audit_logs_schema["items"]["$ref"] == "#/components/schemas/AdminAuditLog"


def test_openapi_exposes_recent_request_and_response_models() -> None:
    openapi = client.get("/openapi.json").json()
    schemas = openapi["components"]["schemas"]

    expected_schemas = {
        "AIInsight",
        "AIInsightListItem",
        "AIAnswerCitation",
        "AIAnswerGuardrail",
        "AICompareAnswer",
        "AICompareAnswerRequest",
        "AIAssistantDataContract",
        "AIListingAnswer",
        "AIListingAnswerRequest",
        "AIQuestionDescriptor",
        "AgencyMemberCreate",
        "AgencyMemberUpdate",
        "AgencyMembership",
        "AgencyWorkspace",
        "AgencyWorkspaceCreate",
        "AgencyWorkspaceSummary",
        "AgencyWorkspaceUpdate",
        "AdminAuditLog",
        "ApiLiteListing",
        "ApiLiteListingDetail",
        "ApiLiteListingEvent",
        "ApiLiteListingScore",
        "ApiLiteListingSearchResponse",
        "ApiLiteUsageLog",
        "ApiLiteUsageSummary",
        "AreaComparison",
        "AreaComparisonItem",
        "AreaImpactSummary",
        "AmenityReference",
        "AreaMarketSnapshotJobResult",
        "CompareItemMetrics",
        "CompareMortgageAssumptions",
        "CompareResponse",
        "CompareSummary",
        "CustomDashboardConfig",
        "CustomDashboardCreate",
        "CustomDashboardPreview",
        "CustomDashboardUpdate",
        "CustomDashboardWidgetSnapshot",
        "DataDeletionRequest",
        "DataDeletionRequestCreate",
        "DataDeletionRequestProcess",
        "DeveloperAlias",
        "DeveloperProfile",
        "DeveloperProject",
        "DeveloperQualitySignal",
        "DeveloperRankingResponse",
        "DeveloperReputation",
        "DeveloperSourceCitation",
        "DistrictReference",
        "GenerateUserSubmittedDraftReportRequest",
        "HiddenGemItem",
        "HiddenGemsResponse",
        "IndustrialZoneReference",
        "InfrastructureEnrichmentItem",
        "InfrastructureEnrichmentJobResult",
        "InfrastructureReferenceImportResponse",
        "KindergartenReference",
        "LocationReference",
        "MarketDashboard",
        "MarketDashboardArea",
        "MarketIntelligenceFinding",
        "MarketIntelligenceKpi",
        "MarketIntelligenceReport",
        "MarketDistributionBucket",
        "MortgageAffordability",
        "MortgageCalculationRequest",
        "MortgageCalculationResult",
        "MortgageCostBreakdown",
        "MortgageScenario",
        "MunicipalityReference",
        "NewsArticle",
        "NewsArticleAISummary",
        "NewsArticleCreate",
        "NewsArticleListItem",
        "NewsArticleUpdate",
        "ObjectReport",
        "OpenDataRoadmapItem",
        "AlertDeliveryBatchRequest",
        "AlertDeliveryBatchResult",
        "AlertDeliveryBatchSkip",
        "PartnerReferral",
        "PartnerReferralCreate",
        "PartnerLeadScore",
        "PartnerLeadScoreComponent",
        "PartnerReferralUpdate",
        "PartnerCsvImportResponse",
        "PlannedInvestmentImportResponse",
        "PriceHistoryRebuildResult",
        "RealtorClientShortlist",
        "RealtorClientShortlistItem",
        "RealtorClientShortlistRequest",
        "ReportBranding",
        "ReportEmailRequest",
        "ReportEmailResult",
        "ReportOrderBillingDetails",
        "ReportTemplateDescriptor",
        "SchoolReference",
        "ScoringBacktestDriftSegment",
        "ScoringBacktestErrorBucket",
        "ScoringBacktestReport",
        "ScoringBacktestResult",
        "ScoringServiceComparable",
        "ScoringServiceRequest",
        "ScoringServiceResult",
        "ScoringServiceValuation",
        "SourceReferencePreview",
        "SourceReferencePreviewRequest",
        "SourceCheckJob",
        "SourceCheckJobCreate",
        "SourceError",
        "SourceErrorCreate",
        "SourceErrorRetryResult",
        "SourceErrorUpdate",
        "SourceUrlImportFields",
        "SourceUrlImportRequest",
        "SourceUrlImportResult",
        "TransportRouteReference",
        "TransportStopReference",
        "SourceRegistryEntry",
        "SourceRegistryEntryCreate",
        "SourceRegistryEntryUpdate",
        "SourceRetentionPruneResult",
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

    agencies_list_schema = openapi["paths"]["/api/v1/agencies"]["get"]["responses"]["200"][
        "content"
    ]["application/json"]["schema"]
    assert agencies_list_schema["type"] == "array"
    assert agencies_list_schema["items"]["$ref"] == "#/components/schemas/AgencyWorkspaceSummary"

    agency_create_schema = openapi["paths"]["/api/v1/agencies"]["post"]["requestBody"][
        "content"
    ]["application/json"]["schema"]
    assert agency_create_schema["$ref"] == "#/components/schemas/AgencyWorkspaceCreate"

    agency_member_create_schema = openapi["paths"][
        "/api/v1/agencies/{agency_id}/members"
    ]["post"]["requestBody"]["content"]["application/json"]["schema"]
    assert agency_member_create_schema["$ref"] == "#/components/schemas/AgencyMemberCreate"

    report_request = schemas["ReportRequest"]
    assert report_request["properties"]["branding"]["anyOf"][0]["$ref"] == (
        "#/components/schemas/ReportBranding"
    )

    email_operation = openapi["paths"]["/api/v1/reports/{report_id}/email"]["post"]
    email_request_schema = email_operation["requestBody"]["content"]["application/json"]["schema"]
    assert email_request_schema["$ref"] == "#/components/schemas/ReportEmailRequest"

    report_order_operation = openapi["paths"]["/api/v1/report-orders"]["post"]
    report_order_request_schema = report_order_operation["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert report_order_request_schema["$ref"] == "#/components/schemas/ReportOrderCreate"
    report_order_create_schema = schemas["ReportOrderCreate"]
    assert report_order_create_schema["properties"]["billing_details"]["anyOf"][0]["$ref"] == (
        "#/components/schemas/ReportOrderBillingDetails"
    )

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
    partner_referral_type_schema = schemas["PartnerReferralCreate"]["properties"][
        "referral_type"
    ]
    assert {"buyer_beta", "realtor_beta"} <= set(partner_referral_type_schema["enum"])

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

    admin_partner_lead_score_list_schema = openapi["paths"][
        "/api/v1/admin/partner-referrals/lead-scores"
    ]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert admin_partner_lead_score_list_schema["type"] == "array"
    assert admin_partner_lead_score_list_schema["items"]["$ref"] == (
        "#/components/schemas/PartnerLeadScore"
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
