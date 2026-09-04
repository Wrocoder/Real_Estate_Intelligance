/**
 * This file is auto-generated from FastAPI's /openapi.json.
 * Do not make direct changes; run npm run generate:openapi.
 */

export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Readiness */
        get: operations["readiness_ready_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/runtime-context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Runtime Context */
        get: operations["runtime_context_runtime_context_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Register */
        post: operations["register_api_v1_auth_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Session */
        get: operations["session_api_v1_auth_session_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout */
        post: operations["logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Listings */
        get: operations["list_listings_api_v1_listings_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/hidden-gems": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Hidden Gems */
        get: operations["list_hidden_gems_api_v1_listings_hidden_gems_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/areas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Areas */
        get: operations["list_areas_api_v1_areas_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/coverage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Coverage */
        get: operations["get_coverage_api_v1_coverage_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/areas/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Compare Areas */
        get: operations["compare_areas_api_v1_areas_compare_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/news": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List News Articles */
        get: operations["list_news_articles_api_v1_news_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/news/{article_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get News Article */
        get: operations["get_news_article_api_v1_news__article_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/news/articles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Admin News Article */
        post: operations["create_admin_news_article_api_v1_admin_news_articles_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/news/articles/{article_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin News Article */
        patch: operations["update_admin_news_article_api_v1_admin_news_articles__article_id__patch"];
        trace?: never;
    };
    "/api/v1/developers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Developers */
        get: operations["list_developers_api_v1_developers_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/developers/{developer_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Developer */
        get: operations["get_developer_api_v1_developers__developer_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/developers/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Import Admin Developer Feed */
        post: operations["import_admin_developer_feed_api_v1_admin_developers_import_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/developers/profiles/{developer_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Upsert Admin Developer Profile */
        put: operations["upsert_admin_developer_profile_api_v1_admin_developers_profiles__developer_id__put"];
        post?: never;
        /** Delete Admin Developer Profile */
        delete: operations["delete_admin_developer_profile_api_v1_admin_developers_profiles__developer_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/developers/projects/{project_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Upsert Admin Developer Project */
        put: operations["upsert_admin_developer_project_api_v1_admin_developers_projects__project_id__put"];
        post?: never;
        /** Delete Admin Developer Project */
        delete: operations["delete_admin_developer_project_api_v1_admin_developers_projects__project_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/developers/aliases/{alias_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Upsert Admin Developer Alias */
        put: operations["upsert_admin_developer_alias_api_v1_admin_developers_aliases__alias_id__put"];
        post?: never;
        /** Delete Admin Developer Alias */
        delete: operations["delete_admin_developer_alias_api_v1_admin_developers_aliases__alias_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/developers/signals/{signal_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Upsert Admin Developer Quality Signal */
        put: operations["upsert_admin_developer_quality_signal_api_v1_admin_developers_signals__signal_id__put"];
        post?: never;
        /** Delete Admin Developer Quality Signal */
        delete: operations["delete_admin_developer_quality_signal_api_v1_admin_developers_signals__signal_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/developers/signals/{signal_id}/moderation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin Developer Quality Signal Moderation */
        patch: operations["update_admin_developer_quality_signal_moderation_api_v1_admin_developers_signals__signal_id__moderation_patch"];
        trace?: never;
    };
    "/api/v1/locations/municipalities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Municipalities */
        get: operations["list_municipalities_api_v1_locations_municipalities_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/locations/districts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List District References */
        get: operations["list_district_references_api_v1_locations_districts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/locations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Location References */
        get: operations["list_location_references_api_v1_locations_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/infrastructure/transport-stops": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Transport Stops */
        get: operations["list_transport_stops_api_v1_infrastructure_transport_stops_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/infrastructure/transport-routes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Transport Routes */
        get: operations["list_transport_routes_api_v1_infrastructure_transport_routes_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/infrastructure/schools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Schools */
        get: operations["list_schools_api_v1_infrastructure_schools_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/infrastructure/kindergartens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Kindergartens */
        get: operations["list_kindergartens_api_v1_infrastructure_kindergartens_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/infrastructure/amenities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Amenities */
        get: operations["list_amenities_api_v1_infrastructure_amenities_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/infrastructure/industrial-zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Industrial Zones */
        get: operations["list_industrial_zones_api_v1_infrastructure_industrial_zones_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/planned-investments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Planned Investments */
        get: operations["list_planned_investments_api_v1_planned_investments_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/plans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Plans */
        get: operations["list_plans_api_v1_plans_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/market/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Market Dashboard */
        get: operations["get_market_dashboard_api_v1_market_dashboard_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/market/intelligence-report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Market Intelligence Report */
        get: operations["get_market_intelligence_report_api_v1_market_intelligence_report_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/scoring/evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Evaluate Scoring Service Listing Endpoint */
        post: operations["evaluate_scoring_service_listing_endpoint_api_v1_scoring_evaluate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/enterprise/custom-dashboards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Enterprise Custom Dashboards */
        get: operations["list_enterprise_custom_dashboards_api_v1_enterprise_custom_dashboards_get"];
        put?: never;
        /** Create Enterprise Custom Dashboard */
        post: operations["create_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/enterprise/custom-dashboards/{dashboard_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Enterprise Custom Dashboard */
        get: operations["get_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__get"];
        put?: never;
        post?: never;
        /** Delete Enterprise Custom Dashboard */
        delete: operations["delete_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__delete"];
        options?: never;
        head?: never;
        /** Update Enterprise Custom Dashboard */
        patch: operations["update_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__patch"];
        trace?: never;
    };
    "/api/v1/enterprise/custom-dashboards/{dashboard_id}/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Preview Enterprise Custom Dashboard */
        post: operations["preview_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__preview_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/api-lite/listings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Api Lite Listings */
        get: operations["list_api_lite_listings_api_v1_api_lite_listings_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/api-lite/listings/{listing_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Api Lite Listing Detail */
        get: operations["get_api_lite_listing_detail_api_v1_api_lite_listings__listing_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/api-lite/areas/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Compare Api Lite Areas */
        get: operations["compare_api_lite_areas_api_v1_api_lite_areas_compare_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/api-lite/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Api Lite Usage */
        get: operations["get_api_lite_usage_api_v1_api_lite_usage_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/mortgage/calculate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Calculate Mortgage Budget */
        post: operations["calculate_mortgage_budget_api_v1_mortgage_calculate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/partner-referrals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Partner Referrals */
        get: operations["list_partner_referrals_api_v1_partner_referrals_get"];
        put?: never;
        /** Create Partner Referral */
        post: operations["create_partner_referral_api_v1_partner_referrals_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/partner-referrals/{referral_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Partner Referral */
        get: operations["get_partner_referral_api_v1_partner_referrals__referral_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/partner-referrals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Partner Referrals */
        get: operations["list_admin_partner_referrals_api_v1_admin_partner_referrals_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/partner-referrals/lead-scores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Partner Referral Lead Scores */
        get: operations["list_admin_partner_referral_lead_scores_api_v1_admin_partner_referrals_lead_scores_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/partner-referrals/{referral_id}/lead-score": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Admin Partner Referral Lead Score */
        get: operations["get_admin_partner_referral_lead_score_api_v1_admin_partner_referrals__referral_id__lead_score_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/paid-beta/tracking": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Paid Beta Tracking */
        get: operations["list_admin_paid_beta_tracking_api_v1_admin_paid_beta_tracking_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/paid-beta/tracking/{referral_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin Paid Beta Tracking */
        patch: operations["update_admin_paid_beta_tracking_api_v1_admin_paid_beta_tracking__referral_id__patch"];
        trace?: never;
    };
    "/api/v1/admin/partner-referrals/{referral_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin Partner Referral */
        patch: operations["update_admin_partner_referral_api_v1_admin_partner_referrals__referral_id__patch"];
        trace?: never;
    };
    "/api/v1/user-submitted-listings/reference-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Preview User Submitted Listing Reference */
        post: operations["preview_user_submitted_listing_reference_api_v1_user_submitted_listings_reference_preview_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/import-from-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Import User Submitted Listing From Url */
        post: operations["import_user_submitted_listing_from_url_api_v1_user_submitted_listings_import_from_url_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/analyze": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Analyze User Submitted Listing Endpoint */
        post: operations["analyze_user_submitted_listing_endpoint_api_v1_user_submitted_listings_analyze_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create User Submitted Listing Report */
        post: operations["create_user_submitted_listing_report_api_v1_user_submitted_listings_report_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List User Submitted Listing Drafts */
        get: operations["list_user_submitted_listing_drafts_api_v1_user_submitted_listings_drafts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/drafts/{draft_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get User Submitted Listing Draft */
        get: operations["get_user_submitted_listing_draft_api_v1_user_submitted_listings_drafts__draft_id__get"];
        put?: never;
        post?: never;
        /** Delete User Submitted Listing Draft */
        delete: operations["delete_user_submitted_listing_draft_api_v1_user_submitted_listings_drafts__draft_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/drafts/{draft_id}/post-viewing-verdict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Recalculate User Submitted Listing Post Viewing Verdict */
        post: operations["recalculate_user_submitted_listing_post_viewing_verdict_api_v1_user_submitted_listings_drafts__draft_id__post_viewing_verdict_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/drafts/{draft_id}/watch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create User Submitted Listing Object Watch */
        post: operations["create_user_submitted_listing_object_watch_api_v1_user_submitted_listings_drafts__draft_id__watch_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/user-submitted-listings/drafts/{draft_id}/reports/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate User Submitted Listing Draft Report */
        post: operations["generate_user_submitted_listing_draft_report_api_v1_user_submitted_listings_drafts__draft_id__reports_generate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/user-submitted-listing-drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin User Submitted Listing Drafts */
        get: operations["list_admin_user_submitted_listing_drafts_api_v1_admin_user_submitted_listing_drafts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/user-submitted-listing-drafts/prune-expired": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Prune Admin User Submitted Listing Drafts */
        post: operations["prune_admin_user_submitted_listing_drafts_api_v1_admin_user_submitted_listing_drafts_prune_expired_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Ingestion Jobs */
        get: operations["list_admin_ingestion_jobs_api_v1_admin_ingestion_jobs_get"];
        put?: never;
        /** Create Admin Ingestion Job */
        post: operations["create_admin_ingestion_job_api_v1_admin_ingestion_jobs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/source-health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Ingestion Source Health */
        get: operations["list_admin_ingestion_source_health_api_v1_admin_ingestion_source_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/source-checks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Source Check Jobs */
        get: operations["list_admin_source_check_jobs_api_v1_admin_ingestion_source_checks_get"];
        put?: never;
        /** Create Admin Source Check Job */
        post: operations["create_admin_source_check_job_api_v1_admin_ingestion_source_checks_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/source-errors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Source Errors */
        get: operations["list_admin_source_errors_api_v1_admin_ingestion_source_errors_get"];
        put?: never;
        /** Create Admin Source Error */
        post: operations["create_admin_source_error_api_v1_admin_ingestion_source_errors_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/source-errors/{error_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin Source Error */
        patch: operations["update_admin_source_error_api_v1_admin_ingestion_source_errors__error_id__patch"];
        trace?: never;
    };
    "/api/v1/admin/ingestion/source-errors/{error_id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Retry Admin Source Error */
        post: operations["retry_admin_source_error_api_v1_admin_ingestion_source_errors__error_id__retry_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/sources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Ingestion Sources */
        get: operations["list_admin_ingestion_sources_api_v1_admin_ingestion_sources_get"];
        put?: never;
        /** Create Admin Ingestion Source */
        post: operations["create_admin_ingestion_source_api_v1_admin_ingestion_sources_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/open-data-roadmap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Open Data Roadmap */
        get: operations["list_admin_open_data_roadmap_api_v1_admin_ingestion_open_data_roadmap_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/sources/{source_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin Ingestion Source */
        patch: operations["update_admin_ingestion_source_api_v1_admin_ingestion_sources__source_id__patch"];
        trace?: never;
    };
    "/api/v1/admin/audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Audit Logs */
        get: operations["list_admin_audit_logs_api_v1_admin_audit_logs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/sources/prune-retained-raw-payloads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Prune Admin Retained Raw Payloads */
        post: operations["prune_admin_retained_raw_payloads_api_v1_admin_ingestion_sources_prune_retained_raw_payloads_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/data-deletion-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Data Deletion Requests */
        get: operations["list_admin_data_deletion_requests_api_v1_admin_data_deletion_requests_get"];
        put?: never;
        /** Create Admin Data Deletion Request */
        post: operations["create_admin_data_deletion_request_api_v1_admin_data_deletion_requests_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/data-deletion-requests/{request_id}/process": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Process Admin Data Deletion Request */
        post: operations["process_admin_data_deletion_request_api_v1_admin_data_deletion_requests__request_id__process_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scoring/backtest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Admin Scoring Backtest */
        get: operations["get_admin_scoring_backtest_api_v1_admin_scoring_backtest_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/scoring/backtest-report": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Admin Scoring Backtest Report */
        get: operations["get_admin_scoring_backtest_report_api_v1_admin_scoring_backtest_report_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/area-market-snapshots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Admin Area Market Snapshots */
        post: operations["create_admin_area_market_snapshots_api_v1_admin_area_market_snapshots_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/price-history/rebuild": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rebuild Admin Price History */
        post: operations["rebuild_admin_price_history_api_v1_admin_price_history_rebuild_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/infrastructure/enrich": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enrich Admin Infrastructure */
        post: operations["enrich_admin_infrastructure_api_v1_admin_infrastructure_enrich_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/ingestion/jobs/{job_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Admin Ingestion Job */
        get: operations["get_admin_ingestion_job_api_v1_admin_ingestion_jobs__job_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/data-quality/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Data Quality Logs */
        get: operations["list_admin_data_quality_logs_api_v1_admin_data_quality_logs_get"];
        put?: never;
        /** Create Admin Data Quality Log */
        post: operations["create_admin_data_quality_log_api_v1_admin_data_quality_logs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/raw-listings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Raw Listings */
        get: operations["list_admin_raw_listings_api_v1_admin_raw_listings_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/raw-listings/{raw_listing_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Admin Raw Listing */
        get: operations["get_admin_raw_listing_api_v1_admin_raw_listings__raw_listing_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/listings/{listing_id}/normalized": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Correct Admin Normalized Listing */
        patch: operations["correct_admin_normalized_listing_api_v1_admin_listings__listing_id__normalized_patch"];
        trace?: never;
    };
    "/api/v1/admin/deduplication/matches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Property Deduplication Matches */
        get: operations["list_admin_property_deduplication_matches_api_v1_admin_deduplication_matches_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/deduplication/matches/{match_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Admin Property Deduplication Match */
        patch: operations["update_admin_property_deduplication_match_api_v1_admin_deduplication_matches__match_id__patch"];
        trace?: never;
    };
    "/api/v1/admin/listings/import-csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Import Admin Partner Csv */
        post: operations["import_admin_partner_csv_api_v1_admin_listings_import_csv_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/planned-investments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Admin Planned Investments */
        get: operations["list_admin_planned_investments_api_v1_admin_planned_investments_get"];
        put?: never;
        /** Create Admin Planned Investment */
        post: operations["create_admin_planned_investment_api_v1_admin_planned_investments_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/planned-investments/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Import Admin Planned Investments */
        post: operations["import_admin_planned_investments_api_v1_admin_planned_investments_import_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/infrastructure/import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Import Admin Infrastructure References */
        post: operations["import_admin_infrastructure_references_api_v1_admin_infrastructure_import_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/planned-investments/{investment_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Admin Planned Investment */
        get: operations["get_admin_planned_investment_api_v1_admin_planned_investments__investment_id__get"];
        put?: never;
        post?: never;
        /** Delete Admin Planned Investment */
        delete: operations["delete_admin_planned_investment_api_v1_admin_planned_investments__investment_id__delete"];
        options?: never;
        head?: never;
        /** Update Admin Planned Investment */
        patch: operations["update_admin_planned_investment_api_v1_admin_planned_investments__investment_id__patch"];
        trace?: never;
    };
    "/api/v1/report-products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List One Time Report Products */
        get: operations["list_one_time_report_products_api_v1_report_products_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Me */
        get: operations["get_me_api_v1_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/subscription": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update My Subscription */
        patch: operations["update_my_subscription_api_v1_me_subscription_patch"];
        trace?: never;
    };
    "/api/v1/agencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Agency Workspaces */
        get: operations["list_agency_workspaces_api_v1_agencies_get"];
        put?: never;
        /** Create Agency Workspace */
        post: operations["create_agency_workspace_api_v1_agencies_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Agency Workspace */
        get: operations["get_agency_workspace_api_v1_agencies__agency_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Agency Workspace */
        patch: operations["update_agency_workspace_api_v1_agencies__agency_id__patch"];
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Agency Member */
        post: operations["add_agency_member_api_v1_agencies__agency_id__members_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/members/{membership_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove Agency Member */
        delete: operations["remove_agency_member_api_v1_agencies__agency_id__members__membership_id__delete"];
        options?: never;
        head?: never;
        /** Update Agency Member */
        patch: operations["update_agency_member_api_v1_agencies__agency_id__members__membership_id__patch"];
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Agency Crm Clients */
        get: operations["list_agency_crm_clients_api_v1_agencies__agency_id__crm_clients_get"];
        put?: never;
        /** Create Agency Crm Client */
        post: operations["create_agency_crm_client_api_v1_agencies__agency_id__crm_clients_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients/{client_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Agency Crm Client */
        get: operations["get_agency_crm_client_api_v1_agencies__agency_id__crm_clients__client_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Agency Crm Client */
        patch: operations["update_agency_crm_client_api_v1_agencies__agency_id__crm_clients__client_id__patch"];
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients/{client_id}/notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Agency Crm Notes */
        get: operations["list_agency_crm_notes_api_v1_agencies__agency_id__crm_clients__client_id__notes_get"];
        put?: never;
        /** Create Agency Crm Note */
        post: operations["create_agency_crm_note_api_v1_agencies__agency_id__crm_clients__client_id__notes_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients/{client_id}/notes/{note_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Agency Crm Note */
        delete: operations["delete_agency_crm_note_api_v1_agencies__agency_id__crm_clients__client_id__notes__note_id__delete"];
        options?: never;
        head?: never;
        /** Update Agency Crm Note */
        patch: operations["update_agency_crm_note_api_v1_agencies__agency_id__crm_clients__client_id__notes__note_id__patch"];
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Agency Crm Shortlists */
        get: operations["list_agency_crm_shortlists_api_v1_agencies__agency_id__crm_clients__client_id__shortlists_get"];
        put?: never;
        /** Create Agency Crm Shortlist */
        post: operations["create_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists/{shortlist_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Agency Crm Shortlist */
        get: operations["get_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__get"];
        put?: never;
        post?: never;
        /** Delete Agency Crm Shortlist */
        delete: operations["delete_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__delete"];
        options?: never;
        head?: never;
        /** Update Agency Crm Shortlist */
        patch: operations["update_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__patch"];
        trace?: never;
    };
    "/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists/{shortlist_id}/share-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Preview Agency Crm Shortlist Share */
        post: operations["preview_agency_crm_shortlist_share_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__share_preview_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/crm/shared-shortlists/{share_token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Public Crm Shared Shortlist */
        get: operations["get_public_crm_shared_shortlist_api_v1_crm_shared_shortlists__share_token__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/report-orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Report Orders */
        get: operations["list_report_orders_api_v1_report_orders_get"];
        put?: never;
        /** Create Report Order */
        post: operations["create_report_order_api_v1_report_orders_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/report-orders/{order_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Report Order */
        get: operations["get_report_order_api_v1_report_orders__order_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/report-orders/{order_id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Report Order Events */
        get: operations["list_report_order_events_api_v1_report_orders__order_id__events_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/report-orders/{order_id}/mock-pay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mock Pay Report Order */
        post: operations["mock_pay_report_order_api_v1_report_orders__order_id__mock_pay_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/report-orders/{order_id}/fulfill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Fulfill Report Order */
        post: operations["fulfill_report_order_api_v1_report_orders__order_id__fulfill_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payment-webhooks/{provider}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Receive Payment Webhook */
        post: operations["receive_payment_webhook_api_v1_payment_webhooks__provider__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/map/features": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Map Features */
        get: operations["get_map_features_api_v1_map_features_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing */
        get: operations["get_listing_api_v1_listings__listing_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/analysis": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Analyze Listing */
        get: operations["analyze_listing_api_v1_listings__listing_id__analysis_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/post-viewing-verdict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Recalculate Listing Post Viewing Verdict */
        post: operations["recalculate_listing_post_viewing_verdict_api_v1_listings__listing_id__post_viewing_verdict_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/watch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Listing Object Watch */
        post: operations["create_listing_object_watch_api_v1_listings__listing_id__watch_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/future-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing Future Impact */
        get: operations["get_listing_future_impact_api_v1_listings__listing_id__future_impact_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/growth-analysis": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing Growth Analysis */
        get: operations["get_listing_growth_analysis_api_v1_listings__listing_id__growth_analysis_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/risk-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing Risk Profile */
        get: operations["get_listing_risk_profile_api_v1_listings__listing_id__risk_profile_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/rental-estimate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing Rental Estimate */
        get: operations["get_listing_rental_estimate_api_v1_listings__listing_id__rental_estimate_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/listings/{listing_id}/developer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Listing Developer */
        get: operations["get_listing_developer_api_v1_listings__listing_id__developer_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/areas/{area_id}/statistics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Area Statistics */
        get: operations["get_area_statistics_api_v1_areas__area_id__statistics_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Compare Listings */
        post: operations["compare_listings_api_v1_compare_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/realtor/client-shortlists/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Build Realtor Client Shortlist Preview */
        post: operations["build_realtor_client_shortlist_preview_api_v1_realtor_client_shortlists_preview_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/object": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Object Report */
        post: operations["create_object_report_api_v1_reports_object_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Object Report Templates */
        get: operations["list_object_report_templates_api_v1_reports_templates_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/object/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate Object Report */
        post: operations["generate_object_report_api_v1_reports_object_generate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/object/{listing_id}.html": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Object Report Html */
        get: operations["get_object_report_html_api_v1_reports_object__listing_id__html_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/object/{listing_id}.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Object Report Pdf */
        get: operations["get_object_report_pdf_api_v1_reports_object__listing_id__pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Generated Reports */
        get: operations["list_generated_reports_api_v1_reports_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/data-contract": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Ai Assistant Data Contract */
        get: operations["get_ai_assistant_data_contract_api_v1_ai_data_contract_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/questions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Ai Assistant Questions */
        get: operations["list_ai_assistant_questions_api_v1_ai_questions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/areas/{area_id}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Summarize Area Impact */
        post: operations["summarize_area_impact_api_v1_ai_areas__area_id__summary_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/news/{article_id}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Summarize News Article */
        post: operations["summarize_news_article_api_v1_ai_news__article_id__summary_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/compare/answer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Answer Compare Ai Question */
        post: operations["answer_compare_ai_question_api_v1_ai_compare_answer_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/listings/{listing_id}/answer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Answer Listing Ai Question */
        post: operations["answer_listing_ai_question_api_v1_ai_listings__listing_id__answer_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/user-submitted-listing-drafts/{draft_id}/answer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Answer User Submitted Listing Ai Question */
        post: operations["answer_user_submitted_listing_ai_question_api_v1_ai_user_submitted_listing_drafts__draft_id__answer_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai-insights": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Ai Insights */
        get: operations["list_ai_insights_api_v1_ai_insights_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai-insights/{insight_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Ai Insight */
        get: operations["get_ai_insight_api_v1_ai_insights__insight_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Export Generated Reports */
        get: operations["export_generated_reports_api_v1_reports_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/datasets/listings/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Export Listing Dataset */
        get: operations["export_listing_dataset_api_v1_datasets_listings_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/{report_id}/email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Email Generated Report */
        post: operations["email_generated_report_api_v1_reports__report_id__email_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/{report_id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Generated Report Pdf */
        get: operations["get_generated_report_pdf_api_v1_reports__report_id__pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/{report_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Generated Report */
        get: operations["get_generated_report_api_v1_reports__report_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reports/{report_id}/content": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Generated Report Content */
        get: operations["get_generated_report_content_api_v1_reports__report_id__content_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/favorites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Favorites */
        get: operations["list_favorites_api_v1_favorites_get"];
        put?: never;
        /** Add Favorite */
        post: operations["add_favorite_api_v1_favorites_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/favorites/{favorite_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Favorite */
        get: operations["get_favorite_api_v1_favorites__favorite_id__get"];
        put?: never;
        post?: never;
        /** Delete Favorite */
        delete: operations["delete_favorite_api_v1_favorites__favorite_id__delete"];
        options?: never;
        head?: never;
        /** Update Favorite */
        patch: operations["update_favorite_api_v1_favorites__favorite_id__patch"];
        trace?: never;
    };
    "/api/v1/alerts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Alerts */
        get: operations["list_alerts_api_v1_alerts_get"];
        put?: never;
        /** Create Alert */
        post: operations["create_alert_api_v1_alerts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/alerts/{alert_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Alert */
        get: operations["get_alert_api_v1_alerts__alert_id__get"];
        put?: never;
        post?: never;
        /** Delete Alert */
        delete: operations["delete_alert_api_v1_alerts__alert_id__delete"];
        options?: never;
        head?: never;
        /** Update Alert */
        patch: operations["update_alert_api_v1_alerts__alert_id__patch"];
        trace?: never;
    };
    "/api/v1/alerts/{alert_id}/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Preview Alert */
        get: operations["preview_alert_api_v1_alerts__alert_id__preview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/alerts/{alert_id}/realtor-digest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Build Realtor Alert Digest */
        post: operations["build_realtor_alert_digest_api_v1_alerts__alert_id__realtor_digest_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/alerts/{alert_id}/deliver": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Deliver Alert */
        post: operations["deliver_alert_api_v1_alerts__alert_id__deliver_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/alert-delivery-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Alert Delivery Jobs */
        get: operations["list_alert_delivery_jobs_api_v1_alert_delivery_jobs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/alerts/deliver-daily-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Deliver Daily Email Alerts */
        post: operations["deliver_daily_email_alerts_api_v1_admin_alerts_deliver_daily_email_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}

export type webhooks = Record<string, never>;

export interface components {
    schemas: {
        /** AIAnswerCitation */
        AIAnswerCitation: {
            /** Source Id */
            source_id: string;
            /** Source Type */
            source_type: string;
            /** Title */
            title: string;
            /** Excerpt */
            excerpt: string;
        };
        /** AIAnswerGuardrail */
        AIAnswerGuardrail: {
            /** Code */
            code: string;
            /** Message */
            message: string;
        };
        /** AIAssistantDataContract */
        AIAssistantDataContract: {
            /** Prompt Version */
            prompt_version: string;
            /** Allowed Subjects */
            allowed_subjects?: ("listing" | "user_submitted_draft" | "compare")[];
            /** Allowed Inputs */
            allowed_inputs?: string[];
            /** Prohibited Inputs */
            prohibited_inputs?: string[];
            /** Citation Policy */
            citation_policy: string;
            /** Privacy Policy */
            privacy_policy: string;
            /** Refusal Policy */
            refusal_policy: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** AICompareAnswer */
        AICompareAnswer: {
            /**
             * Subject Type
             * @default compare
             * @enum {string}
             */
            subject_type: "listing" | "user_submitted_draft" | "compare";
            /** Subject Id */
            subject_id: string;
            /** Listing Ids */
            listing_ids: string[];
            /** Best Listing Id */
            best_listing_id: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /** Question */
            question?: string | null;
            /** Answer */
            answer: string;
            /** Key Points */
            key_points?: string[];
            /** Tradeoffs */
            tradeoffs?: string[];
            /** Citations */
            citations?: components["schemas"]["AIAnswerCitation"][];
            /** Guardrails */
            guardrails?: components["schemas"]["AIAnswerGuardrail"][];
            /**
             * Refused
             * @default false
             */
            refused: boolean;
            /** Refusal Reason */
            refusal_reason?: string | null;
            data_contract: components["schemas"]["AIAssistantDataContract"];
            /** Provider */
            provider: string;
            /** Model Name */
            model_name: string;
            /** Prompt Version */
            prompt_version: string;
            /** Usage Log Id */
            usage_log_id?: string | null;
            /** Input Hash */
            input_hash: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** AICompareAnswerRequest */
        AICompareAnswerRequest: {
            /** Listing Ids */
            listing_ids: string[];
            /** Question */
            question?: string | null;
            /**
             * Audience
             * @default buyer
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
        };
        /** AIInsight */
        AIInsight: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /**
             * Subject Type
             * @enum {string}
             */
            subject_type: "listing" | "user_submitted_draft" | "area" | "report" | "compare" | "news";
            /** Subject Id */
            subject_id: string;
            /**
             * Insight Type
             * @enum {string}
             */
            insight_type: "report_summary" | "object_explanation" | "area_summary" | "news_summary" | "assistant_answer";
            /** Provider */
            provider: string;
            /** Model Name */
            model_name: string;
            /** Prompt Version */
            prompt_version: string;
            /** Source Report Id */
            source_report_id?: string | null;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Content */
            content: string;
            /** Input Hash */
            input_hash: string;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** AIInsightListItem */
        AIInsightListItem: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /**
             * Subject Type
             * @enum {string}
             */
            subject_type: "listing" | "user_submitted_draft" | "area" | "report" | "compare" | "news";
            /** Subject Id */
            subject_id: string;
            /**
             * Insight Type
             * @enum {string}
             */
            insight_type: "report_summary" | "object_explanation" | "area_summary" | "news_summary" | "assistant_answer";
            /** Provider */
            provider: string;
            /** Model Name */
            model_name: string;
            /** Prompt Version */
            prompt_version: string;
            /** Source Report Id */
            source_report_id?: string | null;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** AIListingAnswer */
        AIListingAnswer: {
            /**
             * Subject Type
             * @enum {string}
             */
            subject_type: "listing" | "user_submitted_draft" | "compare";
            /** Subject Id */
            subject_id: string;
            /** Listing Id */
            listing_id: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /**
             * Question Code
             * @enum {string}
             */
            question_code: "summary" | "price" | "negotiation" | "risks" | "future_plans" | "family_fit" | "rental_fit" | "seller_questions" | "documents" | "financing";
            /** Question */
            question?: string | null;
            /** Answer */
            answer: string;
            /** Key Points */
            key_points?: string[];
            /** Citations */
            citations?: components["schemas"]["AIAnswerCitation"][];
            /** Guardrails */
            guardrails?: components["schemas"]["AIAnswerGuardrail"][];
            /**
             * Refused
             * @default false
             */
            refused: boolean;
            /** Refusal Reason */
            refusal_reason?: string | null;
            data_contract: components["schemas"]["AIAssistantDataContract"];
            /** Provider */
            provider: string;
            /** Model Name */
            model_name: string;
            /** Prompt Version */
            prompt_version: string;
            /** Usage Log Id */
            usage_log_id?: string | null;
            /** Input Hash */
            input_hash: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** AIListingAnswerRequest */
        AIListingAnswerRequest: {
            /**
             * Question Code
             * @default summary
             * @enum {string}
             */
            question_code: "summary" | "price" | "negotiation" | "risks" | "future_plans" | "family_fit" | "rental_fit" | "seller_questions" | "documents" | "financing";
            /** Question */
            question?: string | null;
            /**
             * Audience
             * @default buyer
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
        };
        /** AIQuestionDescriptor */
        AIQuestionDescriptor: {
            /**
             * Code
             * @enum {string}
             */
            code: "summary" | "price" | "negotiation" | "risks" | "future_plans" | "family_fit" | "rental_fit" | "seller_questions" | "documents" | "financing";
            /** Label */
            label: string;
            /** Description */
            description: string;
            /** Supported Audiences */
            supported_audiences?: ("buyer" | "realtor" | "investor")[];
        };
        /** AccountSummary */
        AccountSummary: {
            user: components["schemas"]["UserAccount"];
            subscription: components["schemas"]["Subscription"];
            limits: components["schemas"]["PlanLimits"];
            usage: components["schemas"]["AccountUsage"];
        };
        /** AccountUsage */
        AccountUsage: {
            /** Favorites */
            favorites: number;
            /** Alerts */
            alerts: number;
            /** Reports This Month */
            reports_this_month: number;
            /**
             * Report Credits Available
             * @default 0
             */
            report_credits_available: number;
        };
        /** AdminAuditLog */
        AdminAuditLog: {
            /** Id */
            id: string;
            /** Action Type */
            action_type: string;
            /** Actor Id */
            actor_id: string;
            /** Actor Role */
            actor_role: string;
            /** Resource Type */
            resource_type: string;
            /** Resource Id */
            resource_id?: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "succeeded" | "failed" | "blocked";
            /** Message */
            message?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** AgencyMemberCreate */
        AgencyMemberCreate: {
            /** User Id */
            user_id: string;
            /** Email */
            email?: string | null;
            /** Display Name */
            display_name?: string | null;
            /**
             * Role
             * @default agent
             * @enum {string}
             */
            role: "owner" | "admin" | "agent";
            /**
             * Status
             * @default active
             * @enum {string}
             */
            status: "active" | "invited" | "disabled";
        };
        /** AgencyMemberUpdate */
        AgencyMemberUpdate: {
            /** Role */
            role?: ("owner" | "admin" | "agent") | null;
            /** Status */
            status?: ("active" | "invited" | "disabled") | null;
            /** Email */
            email?: string | null;
            /** Display Name */
            display_name?: string | null;
        };
        /** AgencyMembership */
        AgencyMembership: {
            /** Id */
            id: string;
            /** Agency Id */
            agency_id: string;
            /** User Id */
            user_id: string;
            /** Email */
            email?: string | null;
            /** Display Name */
            display_name?: string | null;
            /**
             * Role
             * @enum {string}
             */
            role: "owner" | "admin" | "agent";
            /**
             * Status
             * @enum {string}
             */
            status: "active" | "invited" | "disabled";
            /** Invited By */
            invited_by?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** AgencyWorkspace */
        AgencyWorkspace: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Owner Id */
            owner_id: string;
            /** Billing Email */
            billing_email?: string | null;
            /** Website Url */
            website_url?: string | null;
            /** City */
            city?: string | null;
            /**
             * Current User Role
             * @enum {string}
             */
            current_user_role: "owner" | "admin" | "agent";
            /**
             * Current User Status
             * @enum {string}
             */
            current_user_status: "active" | "invited" | "disabled";
            /** Members Count */
            members_count: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Members */
            members?: components["schemas"]["AgencyMembership"][];
        };
        /** AgencyWorkspaceCreate */
        AgencyWorkspaceCreate: {
            /** Name */
            name: string;
            /** Billing Email */
            billing_email?: string | null;
            /** Website Url */
            website_url?: string | null;
            /** City */
            city?: string | null;
        };
        /** AgencyWorkspaceSummary */
        AgencyWorkspaceSummary: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Owner Id */
            owner_id: string;
            /** Billing Email */
            billing_email?: string | null;
            /** Website Url */
            website_url?: string | null;
            /** City */
            city?: string | null;
            /**
             * Current User Role
             * @enum {string}
             */
            current_user_role: "owner" | "admin" | "agent";
            /**
             * Current User Status
             * @enum {string}
             */
            current_user_status: "active" | "invited" | "disabled";
            /** Members Count */
            members_count: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** AgencyWorkspaceUpdate */
        AgencyWorkspaceUpdate: {
            /** Name */
            name?: string | null;
            /** Billing Email */
            billing_email?: string | null;
            /** Website Url */
            website_url?: string | null;
            /** City */
            city?: string | null;
        };
        /** Alert */
        Alert: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Name */
            name: string;
            filters: components["schemas"]["AlertFilters"];
            /**
             * Channel
             * @enum {string}
             */
            channel: "email" | "telegram";
            /**
             * Frequency
             * @enum {string}
             */
            frequency: "instant" | "daily" | "weekly";
            /** Delivery Target */
            delivery_target?: string | null;
            /** Is Active */
            is_active: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** AlertCreate */
        AlertCreate: {
            /** Name */
            name: string;
            filters?: components["schemas"]["AlertFilters"];
            /**
             * Channel
             * @default email
             * @enum {string}
             */
            channel: "email" | "telegram";
            /**
             * Frequency
             * @default daily
             * @enum {string}
             */
            frequency: "instant" | "daily" | "weekly";
            /** Delivery Target */
            delivery_target?: string | null;
        };
        /** AlertDeliveryBatchRequest */
        AlertDeliveryBatchRequest: {
            /**
             * Dry Run
             * @default true
             */
            dry_run: boolean;
            /**
             * Max Matches
             * @default 10
             */
            max_matches: number;
            /**
             * Limit
             * @default 500
             */
            limit: number;
            /**
             * Force
             * @default false
             */
            force: boolean;
        };
        /** AlertDeliveryBatchResult */
        AlertDeliveryBatchResult: {
            /**
             * Frequency
             * @enum {string}
             */
            frequency: "instant" | "daily" | "weekly";
            /**
             * Channel
             * @enum {string}
             */
            channel: "email" | "telegram";
            /** Dry Run */
            dry_run: boolean;
            /** Force */
            force: boolean;
            /** Alerts Seen */
            alerts_seen: number;
            /** Jobs Prepared */
            jobs_prepared: number;
            /** Jobs Persisted */
            jobs_persisted: number;
            /** Delivered Count */
            delivered_count: number;
            /** Sent Count */
            sent_count: number;
            /** Skipped Count */
            skipped_count: number;
            /** Failed Count */
            failed_count: number;
            /** Jobs */
            jobs?: components["schemas"]["AlertDeliveryJob"][];
            /** Skipped */
            skipped?: components["schemas"]["AlertDeliveryBatchSkip"][];
        };
        /** AlertDeliveryBatchSkip */
        AlertDeliveryBatchSkip: {
            /** Owner Id */
            owner_id: string;
            /** Alert Id */
            alert_id: string;
            /** Reason */
            reason: string;
            /** Last Delivery Job Id */
            last_delivery_job_id?: string | null;
            /** Last Delivery At */
            last_delivery_at?: string | null;
        };
        /** AlertDeliveryJob */
        AlertDeliveryJob: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Alert Id */
            alert_id: string;
            /**
             * Channel
             * @enum {string}
             */
            channel: "email" | "telegram";
            /** Provider */
            provider: string;
            /**
             * Status
             * @enum {string}
             */
            status: "dry_run" | "sent" | "skipped" | "failed";
            /** Total Matches */
            total_matches: number;
            /** Delivered Count */
            delivered_count: number;
            /** Message */
            message: string;
            /** Listing Ids */
            listing_ids?: string[];
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** AlertDeliveryRequest */
        AlertDeliveryRequest: {
            /**
             * Dry Run
             * @default true
             */
            dry_run: boolean;
            /**
             * Max Matches
             * @default 10
             */
            max_matches: number;
        };
        /** AlertFilters */
        AlertFilters: {
            /**
             * Alert Kind
             * @default saved_search
             * @enum {string}
             */
            alert_kind: "saved_search" | "object_watch";
            /** Voivodeship */
            voivodeship?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Municipality */
            municipality?: string | null;
            /** Building Type */
            building_type?: string | null;
            /** Renovation State */
            renovation_state?: string | null;
            /** Has Balcony */
            has_balcony?: boolean | null;
            /** Has Terrace */
            has_terrace?: boolean | null;
            /** Has Garden */
            has_garden?: boolean | null;
            /** Has Elevator */
            has_elevator?: boolean | null;
            /** Parking Type */
            parking_type?: string | null;
            /** Heating Type */
            heating_type?: string | null;
            /** Query */
            query?: string | null;
            /** Rooms */
            rooms?: number | null;
            /** Max Price */
            max_price?: number | null;
            /** Min Area M2 */
            min_area_m2?: number | null;
            /** Min Floor */
            min_floor?: number | null;
            /** Max Floor */
            max_floor?: number | null;
            /** Max Building Floors */
            max_building_floors?: number | null;
            /** Min Building Year */
            min_building_year?: number | null;
            /** Max Building Year */
            max_building_year?: number | null;
            /** Min Investment Score */
            min_investment_score?: number | null;
            /** Max Risk Score */
            max_risk_score?: number | null;
            /** Max Price Delta To Fair Mid Pct */
            max_price_delta_to_fair_mid_pct?: number | null;
            /** Min Negotiation Score */
            min_negotiation_score?: number | null;
            /** Min Liquidity Score */
            min_liquidity_score?: number | null;
            /** Min Rental Potential Score */
            min_rental_potential_score?: number | null;
            /** Min Price Reductions */
            min_price_reductions?: number | null;
            /** Max Days On Market */
            max_days_on_market?: number | null;
            /** Target Type */
            target_type?: ("listing" | "user_submitted_draft") | null;
            /** Target Listing Id */
            target_listing_id?: string | null;
            /** Target Draft Id */
            target_draft_id?: string | null;
            /** Object Watch Triggers */
            object_watch_triggers?: ("price_change" | "cheaper_comparable" | "days_on_market_threshold" | "planned_investment_status" | "developer_signal" | "negotiation_opportunity")[] | null;
            /** Baseline Price */
            baseline_price?: number | null;
            /** Baseline Days On Market */
            baseline_days_on_market?: number | null;
            /** Baseline Price Reductions */
            baseline_price_reductions?: number | null;
            /** Baseline Negotiation Score */
            baseline_negotiation_score?: number | null;
            /** Baseline Max Reasonable Offer */
            baseline_max_reasonable_offer?: number | null;
            /** Baseline Planned Investment Statuses */
            baseline_planned_investment_statuses?: {
                [key: string]: string;
            } | null;
            /** Baseline Developer Reputation Score */
            baseline_developer_reputation_score?: number | null;
            /** Baseline Developer Risk Signal Count */
            baseline_developer_risk_signal_count?: number | null;
            /** Days On Market Thresholds */
            days_on_market_thresholds?: number[] | null;
            /** Min Cheaper Comparable Discount Pct */
            min_cheaper_comparable_discount_pct?: number | null;
        };
        /** AlertPreview */
        AlertPreview: {
            alert: components["schemas"]["Alert"];
            /** Matches */
            matches: components["schemas"]["ListingAnalysis"][];
            /** Total Matches */
            total_matches: number;
            /** Applied Filters */
            applied_filters: {
                [key: string]: unknown;
            };
            /** Watch Events */
            watch_events?: components["schemas"]["ObjectWatchEvent"][];
        };
        /** AlertUpdate */
        AlertUpdate: {
            /** Name */
            name?: string | null;
            filters?: components["schemas"]["AlertFilters"] | null;
            /** Channel */
            channel?: ("email" | "telegram") | null;
            /** Frequency */
            frequency?: ("instant" | "daily" | "weekly") | null;
            /** Delivery Target */
            delivery_target?: string | null;
            /** Is Active */
            is_active?: boolean | null;
        };
        /** AmenityReference */
        AmenityReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Name */
            name: string;
            /** Amenity Type */
            amenity_type: string;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Source Url */
            source_url?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** ApiLiteListing */
        ApiLiteListing: {
            /** Id */
            id: string;
            /** Title */
            title: string;
            /** Source Name */
            source_name: string;
            /** City */
            city: string;
            /** District */
            district: string;
            /** Area Id */
            area_id: string;
            /** Municipality */
            municipality: string;
            /** Address */
            address: string;
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Building Type */
            building_type?: string | null;
            /** Renovation State */
            renovation_state?: string | null;
            /** Has Balcony */
            has_balcony?: boolean | null;
            /** Has Terrace */
            has_terrace?: boolean | null;
            /** Has Garden */
            has_garden?: boolean | null;
            /** Has Elevator */
            has_elevator?: boolean | null;
            /** Parking Type */
            parking_type?: string | null;
            /** Heating Type */
            heating_type?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Price */
            price: number;
            /**
             * Currency
             * @default PLN
             */
            currency: string;
            /** Area M2 */
            area_m2: number;
            /** Price Per M2 */
            price_per_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /**
             * First Seen At
             * Format: date
             */
            first_seen_at: string;
            /**
             * Last Seen At
             * Format: date
             */
            last_seen_at: string;
            /** Days On Market */
            days_on_market: number;
            /** Price Reductions */
            price_reductions: number;
            /** Price Increases */
            price_increases: number;
            /** Relisted */
            relisted: boolean;
            /** Lat */
            lat: number;
            /** Lon */
            lon: number;
            /** Distance To Center Km */
            distance_to_center_km: number;
            /** Nearest Stop M */
            nearest_stop_m: number;
            /** Nearest School M */
            nearest_school_m: number;
            /** Nearest Major Road M */
            nearest_major_road_m: number;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m: number;
            /** Parks Within 1Km */
            parks_within_1km: number;
            /** Schools Within 1Km */
            schools_within_1km: number;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km: number;
            /** Data Quality Score */
            data_quality_score: number;
            scores: components["schemas"]["ApiLiteListingScore"];
            /** Insights */
            insights?: string[];
            /** Data Quality Notes */
            data_quality_notes?: string[];
            /** Disclaimer */
            disclaimer: string;
        };
        /** ApiLiteListingDetail */
        ApiLiteListingDetail: {
            /** Id */
            id: string;
            /** Title */
            title: string;
            /** Source Name */
            source_name: string;
            /** City */
            city: string;
            /** District */
            district: string;
            /** Area Id */
            area_id: string;
            /** Municipality */
            municipality: string;
            /** Address */
            address: string;
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Building Type */
            building_type?: string | null;
            /** Renovation State */
            renovation_state?: string | null;
            /** Has Balcony */
            has_balcony?: boolean | null;
            /** Has Terrace */
            has_terrace?: boolean | null;
            /** Has Garden */
            has_garden?: boolean | null;
            /** Has Elevator */
            has_elevator?: boolean | null;
            /** Parking Type */
            parking_type?: string | null;
            /** Heating Type */
            heating_type?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Price */
            price: number;
            /**
             * Currency
             * @default PLN
             */
            currency: string;
            /** Area M2 */
            area_m2: number;
            /** Price Per M2 */
            price_per_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /**
             * First Seen At
             * Format: date
             */
            first_seen_at: string;
            /**
             * Last Seen At
             * Format: date
             */
            last_seen_at: string;
            /** Days On Market */
            days_on_market: number;
            /** Price Reductions */
            price_reductions: number;
            /** Price Increases */
            price_increases: number;
            /** Relisted */
            relisted: boolean;
            /** Lat */
            lat: number;
            /** Lon */
            lon: number;
            /** Distance To Center Km */
            distance_to_center_km: number;
            /** Nearest Stop M */
            nearest_stop_m: number;
            /** Nearest School M */
            nearest_school_m: number;
            /** Nearest Major Road M */
            nearest_major_road_m: number;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m: number;
            /** Parks Within 1Km */
            parks_within_1km: number;
            /** Schools Within 1Km */
            schools_within_1km: number;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km: number;
            /** Data Quality Score */
            data_quality_score: number;
            scores: components["schemas"]["ApiLiteListingScore"];
            /** Insights */
            insights?: string[];
            /** Data Quality Notes */
            data_quality_notes?: string[];
            /** Disclaimer */
            disclaimer: string;
            area_statistics: components["schemas"]["AreaStatistics"];
            /** Price History */
            price_history?: components["schemas"]["PriceHistoryPoint"][];
            /** Listing Events */
            listing_events?: components["schemas"]["ApiLiteListingEvent"][];
            /** Comparable Listing Ids */
            comparable_listing_ids?: string[];
            /** Comparables Count */
            comparables_count: number;
            /** Developer Reputation Score */
            developer_reputation_score?: number | null;
            /** Developer Confidence Score */
            developer_confidence_score?: number | null;
            /** Developer Risk Signals Count */
            developer_risk_signals_count: number;
        };
        /** ApiLiteListingEvent */
        ApiLiteListingEvent: {
            /** Listing Id */
            listing_id: string;
            /**
             * Event Type
             * @enum {string}
             */
            event_type: "first_seen" | "price_reduced" | "price_increased" | "parameter_changed" | "description_changed" | "relisted" | "removed" | "republished";
            /**
             * Observed At
             * Format: date
             */
            observed_at: string;
            /** Summary */
            summary: string;
        };
        /** ApiLiteListingScore */
        ApiLiteListingScore: {
            /** Formula Version */
            formula_version: string;
            /** Weights Profile */
            weights_profile: string;
            /**
             * Decision Label
             * @enum {string}
             */
            decision_label: "strong_candidate" | "good_option" | "fair_option" | "overpriced" | "risky" | "weak_fit";
            /**
             * Price Label
             * @enum {string}
             */
            price_label: "below_fair" | "fair" | "above_fair" | "overpriced";
            /**
             * Risk Label
             * @enum {string}
             */
            risk_label: "low_risk" | "moderate_risk" | "elevated_risk" | "high_risk";
            /**
             * Negotiation Label
             * @enum {string}
             */
            negotiation_label: "weak_negotiation" | "some_negotiation" | "negotiable" | "strong_negotiation";
            /**
             * Liquidity Label
             * @enum {string}
             */
            liquidity_label: "weak" | "moderate" | "good" | "strong";
            /**
             * Rental Potential Label
             * @enum {string}
             */
            rental_potential_label: "weak" | "moderate" | "good" | "strong";
            /** Investment Score */
            investment_score: number;
            /** Risk Score */
            risk_score: number;
            /** Negotiation Score */
            negotiation_score: number;
            /** Liquidity Score */
            liquidity_score: number;
            /** Rental Potential Score */
            rental_potential_score: number;
            /** Fair Price Low */
            fair_price_low: number;
            /** Fair Price Mid */
            fair_price_mid: number;
            /** Fair Price High */
            fair_price_high: number;
            /** Fair Price Confidence Score */
            fair_price_confidence_score: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /** Reasons */
            reasons?: string[];
            /** Warnings */
            warnings?: string[];
        };
        /** ApiLiteListingSearchResponse */
        ApiLiteListingSearchResponse: {
            /** Items */
            items: components["schemas"]["ApiLiteListing"][];
            /** Total */
            total: number;
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total Pages */
            total_pages: number;
            /**
             * Sort
             * @enum {string}
             */
            sort: "price_asc" | "price_desc" | "price_per_m2_asc" | "price_per_m2_desc" | "investment_score_desc" | "investment_score_asc" | "risk_score_asc" | "risk_score_desc" | "negotiation_score_desc" | "negotiation_score_asc" | "liquidity_score_desc" | "liquidity_score_asc" | "rental_potential_score_desc" | "rental_potential_score_asc" | "developer_reputation_score_desc" | "developer_reputation_score_asc" | "developer_confidence_score_desc" | "developer_confidence_score_asc" | "days_on_market_asc" | "days_on_market_desc" | "newest" | "oldest";
            /** Filters */
            filters?: {
                [key: string]: unknown;
            };
            /**
             * Data Policy
             * @default API-lite returns normalized analytical fields only. Source URLs, contacts, photos, raw HTML and private user-submitted references are not included.
             */
            data_policy: string;
        };
        /** ApiLiteUsageLog */
        ApiLiteUsageLog: {
            /** Id */
            id: string;
            /** Key Id */
            key_id: string;
            /** Owner Id */
            owner_id: string;
            /**
             * Plan
             * @enum {string}
             */
            plan: "free" | "buyer_pro" | "investor" | "realtor" | "agency" | "enterprise";
            /** Endpoint */
            endpoint: string;
            /** Method */
            method: string;
            /** Status Code */
            status_code: number;
            /** Request Units */
            request_units: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** ApiLiteUsageSummary */
        ApiLiteUsageSummary: {
            /** Key Id */
            key_id: string;
            /** Label */
            label: string;
            /** Owner Id */
            owner_id: string;
            /**
             * Plan
             * @enum {string}
             */
            plan: "free" | "buyer_pro" | "investor" | "realtor" | "agency" | "enterprise";
            /** Scopes */
            scopes?: string[];
            /** Usage Period */
            usage_period: string;
            /** Monthly Quota */
            monthly_quota: number;
            /** Rate Limit Per Minute */
            rate_limit_per_minute: number;
            /** Used Units */
            used_units: number;
            /** Remaining Units */
            remaining_units: number;
            /** Logs */
            logs?: components["schemas"]["ApiLiteUsageLog"][];
        };
        /** AreaComparison */
        AreaComparison: {
            /** City */
            city?: string | null;
            /** Sort */
            sort: string;
            /** Area Count */
            area_count: number;
            /** City Median Price Per M2 */
            city_median_price_per_m2?: number | null;
            /** City Average Days On Market */
            city_average_days_on_market?: number | null;
            /** City Active Listings */
            city_active_listings: number;
            /** Top Value Area Id */
            top_value_area_id?: string | null;
            /** Top Growth Area Id */
            top_growth_area_id?: string | null;
            /** Top Buyer Market Area Id */
            top_buyer_market_area_id?: string | null;
            /** Top Liquidity Area Id */
            top_liquidity_area_id?: string | null;
            /** Areas */
            areas?: components["schemas"]["AreaComparisonItem"][];
        };
        /** AreaComparisonItem */
        AreaComparisonItem: {
            /** Area Id */
            area_id: string;
            /** Name */
            name: string;
            /** City */
            city: string;
            data_provenance?: components["schemas"]["DataProvenance"];
            /** Median Price Per M2 */
            median_price_per_m2: number;
            /** Average Price Per M2 */
            average_price_per_m2: number;
            /** Active Listings */
            active_listings: number;
            /** New Listings 30D */
            new_listings_30d: number;
            /** Removed Listings 30D */
            removed_listings_30d: number;
            /** Average Days On Market */
            average_days_on_market: number;
            /** Price Change 90D Pct */
            price_change_90d_pct: number;
            /** Supply Change 90D Pct */
            supply_change_90d_pct: number;
            /** Liquidity Index */
            liquidity_index: number;
            /** Buyer Market Index */
            buyer_market_index: number;
            /** Seller Market Index */
            seller_market_index: number;
            /** Overheated Index */
            overheated_index: number;
            /** Value Index */
            value_index: number;
            /** Growth Index */
            growth_index: number;
            /** Price Per M2 Vs City Pct */
            price_per_m2_vs_city_pct?: number | null;
            /** Days On Market Vs City Pct */
            days_on_market_vs_city_pct?: number | null;
            /** Active Share Pct */
            active_share_pct: number;
            /** Market Label */
            market_label: string;
            /** Summary */
            summary: string;
        };
        /** AreaImpactSummary */
        AreaImpactSummary: {
            /**
             * Subject Type
             * @default area
             * @enum {string}
             */
            subject_type: "listing" | "user_submitted_draft" | "area" | "report" | "compare" | "news";
            /** Subject Id */
            subject_id: string;
            /** Area Id */
            area_id: string;
            /** Name */
            name: string;
            /** City */
            city: string;
            /** Posture */
            posture: string;
            /** Summary */
            summary: string;
            /** Value Index */
            value_index: number;
            /** Growth Index */
            growth_index: number;
            /** Buyer Market Index */
            buyer_market_index: number;
            /** Seller Market Index */
            seller_market_index: number;
            /** Liquidity Index */
            liquidity_index: number;
            /** Overheated Index */
            overheated_index: number;
            /** Positive Signals */
            positive_signals?: string[];
            /** Risk Signals */
            risk_signals?: string[];
            /** Buyer Notes */
            buyer_notes?: string[];
            /** Investor Notes */
            investor_notes?: string[];
            /** Citations */
            citations?: components["schemas"]["AIAnswerCitation"][];
            /** Guardrails */
            guardrails?: components["schemas"]["AIAnswerGuardrail"][];
            /** Provider */
            provider: string;
            /** Model Name */
            model_name: string;
            /** Prompt Version */
            prompt_version: string;
            /** Usage Log Id */
            usage_log_id?: string | null;
            /** Input Hash */
            input_hash: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** AreaMarketSnapshot */
        AreaMarketSnapshot: {
            /** Area Id */
            area_id: string;
            /** Name */
            name: string;
            /** City */
            city: string;
            data_provenance?: components["schemas"]["DataProvenance"];
            /** Median Price Per M2 */
            median_price_per_m2: number;
            /** Average Price Per M2 */
            average_price_per_m2: number;
            /** Active Listings */
            active_listings: number;
            /** New Listings 30D */
            new_listings_30d: number;
            /** Removed Listings 30D */
            removed_listings_30d: number;
            /** Average Days On Market */
            average_days_on_market: number;
            /** Price Change 90D Pct */
            price_change_90d_pct: number;
            /** Supply Change 90D Pct */
            supply_change_90d_pct: number;
            /** Id */
            id?: number | null;
            /**
             * Calculated At
             * Format: date-time
             */
            calculated_at: string;
        };
        /** AreaMarketSnapshotJobResult */
        AreaMarketSnapshotJobResult: {
            /**
             * Calculated At
             * Format: date-time
             */
            calculated_at: string;
            /** Dry Run */
            dry_run: boolean;
            /** Snapshots Created */
            snapshots_created: number;
            /** Snapshots */
            snapshots?: components["schemas"]["AreaMarketSnapshot"][];
        };
        /** AreaStatistics */
        AreaStatistics: {
            /** Area Id */
            area_id: string;
            /** Name */
            name: string;
            /** City */
            city: string;
            data_provenance?: components["schemas"]["DataProvenance"];
            /** Median Price Per M2 */
            median_price_per_m2: number;
            /** Average Price Per M2 */
            average_price_per_m2: number;
            /** Active Listings */
            active_listings: number;
            /** New Listings 30D */
            new_listings_30d: number;
            /** Removed Listings 30D */
            removed_listings_30d: number;
            /** Average Days On Market */
            average_days_on_market: number;
            /** Price Change 90D Pct */
            price_change_90d_pct: number;
            /** Supply Change 90D Pct */
            supply_change_90d_pct: number;
        };
        /** AuthCredentials */
        AuthCredentials: {
            /** Email */
            email: string;
            /** Password */
            password: string;
        };
        /** AuthRegistration */
        AuthRegistration: {
            /** Email */
            email: string;
            /** Password */
            password: string;
            /** Display Name */
            display_name?: string | null;
        };
        /** AuthSession */
        AuthSession: {
            user: components["schemas"]["UserAccount"];
            /**
             * Expires At
             * Format: date-time
             */
            expires_at: string;
            /**
             * Demo Mode
             * @default false
             */
            demo_mode: boolean;
        };
        /** Body_import_admin_developer_feed_api_v1_admin_developers_import_post */
        Body_import_admin_developer_feed_api_v1_admin_developers_import_post: {
            /**
             * File
             * @description UTF-8 developer reputation JSON feed.
             */
            file: string;
            /** Source Name */
            source_name?: string | null;
            /**
             * Dry Run
             * @default true
             */
            dry_run: boolean;
        };
        /** Body_import_admin_infrastructure_references_api_v1_admin_infrastructure_import_post */
        Body_import_admin_infrastructure_references_api_v1_admin_infrastructure_import_post: {
            /**
             * File
             * @description UTF-8 JSON or CSV file.
             */
            file: string;
            /** Source Name */
            source_name?: string | null;
            /** Layer */
            layer?: string | null;
            /**
             * Dry Run
             * @default true
             */
            dry_run: boolean;
        };
        /** Body_import_admin_partner_csv_api_v1_admin_listings_import_csv_post */
        Body_import_admin_partner_csv_api_v1_admin_listings_import_csv_post: {
            /**
             * File
             * @description UTF-8 partner listings CSV file.
             */
            file: string;
            /** Source Name */
            source_name?: string | null;
            /**
             * Source Type
             * @default partner_csv
             */
            source_type: string;
            /**
             * Dry Run
             * @default true
             */
            dry_run: boolean;
            /**
             * Mark Missing Removed
             * @default false
             */
            mark_missing_removed: boolean;
        };
        /** Body_import_admin_planned_investments_api_v1_admin_planned_investments_import_post */
        Body_import_admin_planned_investments_api_v1_admin_planned_investments_import_post: {
            /**
             * File
             * @description UTF-8 JSON or CSV file.
             */
            file: string;
            /** Source Name */
            source_name?: string | null;
            /**
             * Dry Run
             * @default false
             */
            dry_run: boolean;
        };
        /** BuyerDecisionPackage */
        BuyerDecisionPackage: {
            verdict: components["schemas"]["BuyerDecisionVerdict"];
            negotiation: components["schemas"]["BuyerNegotiationAssistant"];
            due_diligence: components["schemas"]["PropertyDueDiligence"];
            knowledge: components["schemas"]["BuyerKnowledgeMatrix"];
            total_acquisition: components["schemas"]["TotalAcquisitionCost"];
            /**
             * Selected Intent
             * @default unsure
             * @enum {string}
             */
            selected_intent: "self" | "family" | "rental" | "investment" | "unsure";
            /**
             * Decision Model Version
             * @default buyer-decision-v2-intent
             */
            decision_model_version: string;
            selected_intent_fit?: components["schemas"]["BuyerIntentFit"] | null;
            /** Intent Fit */
            intent_fit?: components["schemas"]["BuyerIntentFit"][];
            pre_viewing: components["schemas"]["ViewingAssistant"];
            /** Post Viewing Checklist */
            post_viewing_checklist?: string[];
            /** Watch Triggers */
            watch_triggers?: string[];
            /** Disclaimer */
            disclaimer: string;
        };
        /** BuyerDecisionVerdict */
        BuyerDecisionVerdict: {
            /**
             * Status
             * @enum {string}
             */
            status: "buy" | "negotiate" | "avoid" | "verify_first";
            /** Score */
            score: number;
            /** Headline */
            headline: string;
            /** Summary */
            summary: string;
            /** Seller Price Pln */
            seller_price_pln: number;
            /** Fair Price Low Pln */
            fair_price_low_pln: number;
            /** Fair Price Mid Pln */
            fair_price_mid_pln: number;
            /** Fair Price High Pln */
            fair_price_high_pln: number;
            /** Opening Offer Pln */
            opening_offer_pln: number;
            /** Recommended Offer Pln */
            recommended_offer_pln: number;
            /** Realistic Deal Low Pln */
            realistic_deal_low_pln: number;
            /** Realistic Deal High Pln */
            realistic_deal_high_pln: number;
            /** Max Reasonable Offer Pln */
            max_reasonable_offer_pln: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /** Overpricing Pln */
            overpricing_pln: number;
            /**
             * Cta Label
             * @default Prepare for viewing and negotiation
             */
            cta_label: string;
            /** Top Reasons */
            top_reasons?: string[];
            /** Top Risks */
            top_risks?: string[];
            /** Critical Unknowns */
            critical_unknowns?: string[];
        };
        /** BuyerIntentFit */
        BuyerIntentFit: {
            /**
             * Intent
             * @enum {string}
             */
            intent: "self" | "family" | "rental" | "investment" | "unsure";
            /** Score */
            score: number;
            /** Label */
            label: string;
            /** Reasons */
            reasons?: string[];
            /** Tradeoffs */
            tradeoffs?: string[];
        };
        /** BuyerKnowledgeMatrix */
        BuyerKnowledgeMatrix: {
            /** Known */
            known?: string[];
            /** Estimated */
            estimated?: string[];
            /** Could Not Verify */
            could_not_verify?: string[];
            /** Check Completeness Score */
            check_completeness_score: number;
            /** Source Evidence */
            source_evidence?: components["schemas"]["BuyerSourceEvidence"][];
        };
        /** BuyerNegotiationAssistant */
        BuyerNegotiationAssistant: {
            /** Asking Price Pln */
            asking_price_pln: number;
            /** Opening Offer Pln */
            opening_offer_pln: number;
            /** Realistic Deal Low Pln */
            realistic_deal_low_pln: number;
            /** Realistic Deal High Pln */
            realistic_deal_high_pln: number;
            /** Max Reasonable Offer Pln */
            max_reasonable_offer_pln: number;
            /** Negotiation Score */
            negotiation_score: number;
            /** Posture */
            posture: string;
            /** Arguments */
            arguments?: string[];
            /** Argument Evidence */
            argument_evidence?: components["schemas"]["BuyerNegotiationEvidence"][];
            /** Seller Script */
            seller_script?: string[];
            /** Guardrails */
            guardrails?: string[];
        };
        /** BuyerNegotiationEvidence */
        BuyerNegotiationEvidence: {
            /** Argument */
            argument: string;
            /** Topic */
            topic: string;
            /** Source Name */
            source_name: string;
            /** Source Type */
            source_type: string;
            /** Confidence Score */
            confidence_score: number;
            /** Note */
            note?: string | null;
        };
        /** BuyerSourceEvidence */
        BuyerSourceEvidence: {
            /** Topic */
            topic: string;
            /** Basis */
            basis: string;
            /** Source Name */
            source_name: string;
            /** Source Type */
            source_type: string;
            /** Updated At */
            updated_at?: string | null;
            /** Confidence Score */
            confidence_score: number;
            /** Note */
            note?: string | null;
        };
        /** CheckoutSession */
        CheckoutSession: {
            /** Provider */
            provider: string;
            /**
             * Mode
             * @enum {string}
             */
            mode: "mock" | "live";
            /** Checkout Url */
            checkout_url: string;
            order: components["schemas"]["ReportOrder"];
            /** External Reference */
            external_reference?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** CompareItemMetrics */
        CompareItemMetrics: {
            /** Listing Id */
            listing_id: string;
            /** Rank */
            rank: number;
            /** Decision Score */
            decision_score: number;
            /**
             * Decision Label
             * @enum {string}
             */
            decision_label: "strong_candidate" | "good_option" | "fair_option" | "overpriced" | "risky" | "weak_fit";
            /**
             * Price Label
             * @enum {string}
             */
            price_label: "below_fair" | "fair" | "above_fair" | "overpriced";
            /**
             * Risk Label
             * @enum {string}
             */
            risk_label: "low_risk" | "moderate_risk" | "elevated_risk" | "high_risk";
            /**
             * Liquidity Label
             * @enum {string}
             */
            liquidity_label: "weak" | "moderate" | "good" | "strong";
            /**
             * Rental Potential Label
             * @enum {string}
             */
            rental_potential_label: "weak" | "moderate" | "good" | "strong";
            /** Investment Score */
            investment_score: number;
            /** Risk Score */
            risk_score: number;
            /** Negotiation Score */
            negotiation_score: number;
            /** Liquidity Score */
            liquidity_score: number;
            /** Rental Potential Score */
            rental_potential_score: number;
            /** Price Per M2 Pln */
            price_per_m2_pln: number;
            /** Fair Price Mid Pln */
            fair_price_mid_pln: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /** Fair Price Gap Pln */
            fair_price_gap_pln: number;
            /** Estimated Discount To Fair Mid Pln */
            estimated_discount_to_fair_mid_pln: number;
            /** Down Payment Pln */
            down_payment_pln: number;
            /** Loan Amount Pln */
            loan_amount_pln: number;
            /** Estimated Monthly Payment Pln */
            estimated_monthly_payment_pln: number;
            /** Estimated Monthly Payment Per M2 Pln */
            estimated_monthly_payment_per_m2_pln: number;
            /** Upfront Cash Needed Pln */
            upfront_cash_needed_pln: number;
            /** Renovation Estimate Pln */
            renovation_estimate_pln: number;
            /** Furniture Estimate Pln */
            furniture_estimate_pln: number;
            /** Transaction Costs Pln */
            transaction_costs_pln: number;
            /** Total Move In Cost Pln */
            total_move_in_cost_pln: number;
            /** Ready To Move Alternative Price Pln */
            ready_to_move_alternative_price_pln?: number | null;
            /** Post Renovation Value Gap Pln */
            post_renovation_value_gap_pln?: number | null;
            /** Max Reasonable Offer Pln */
            max_reasonable_offer_pln: number;
            /** Opening Offer Pln */
            opening_offer_pln: number;
            /** Estimated Gross Rental Yield Pct */
            estimated_gross_rental_yield_pct: number;
            /** Estimated Monthly Rent Pln */
            estimated_monthly_rent_pln: number;
            /** Recommendation */
            recommendation: string;
            /** Reasons */
            reasons?: string[];
            /** Warnings */
            warnings?: string[];
        };
        /** CompareMortgageAssumptions */
        CompareMortgageAssumptions: {
            /** Down Payment Pct */
            down_payment_pct: number;
            /** Loan Years */
            loan_years: number;
            /** Annual Interest Rate Pct */
            annual_interest_rate_pct: number;
            /**
             * Rate Type
             * @enum {string}
             */
            rate_type: "fixed" | "variable";
        };
        /** CompareRequest */
        CompareRequest: {
            /** Listing Ids */
            listing_ids: string[];
            /**
             * Purchase Intent
             * @default unsure
             * @enum {string}
             */
            purchase_intent: "self" | "family" | "rental" | "investment" | "unsure";
        };
        /** CompareResponse */
        CompareResponse: {
            /** Items */
            items: components["schemas"]["ListingAnalysis"][];
            /** Metrics */
            metrics: components["schemas"]["CompareItemMetrics"][];
            summary: components["schemas"]["CompareSummary"];
            mortgage_assumptions: components["schemas"]["CompareMortgageAssumptions"];
        };
        /** CompareSummary */
        CompareSummary: {
            /** Best Listing Id */
            best_listing_id: string;
            /** Best Value Listing Id */
            best_value_listing_id: string;
            /** Best Total Cost Listing Id */
            best_total_cost_listing_id: string;
            /** Lowest Monthly Payment Listing Id */
            lowest_monthly_payment_listing_id: string;
            /** Strongest Liquidity Listing Id */
            strongest_liquidity_listing_id: string;
            /** Strongest Rental Listing Id */
            strongest_rental_listing_id: string;
            /** Riskiest Listing Id */
            riskiest_listing_id: string;
            /** Average Price Per M2 */
            average_price_per_m2: number;
            /** Average Estimated Monthly Payment Pln */
            average_estimated_monthly_payment_pln: number;
            /** Average Total Move In Cost Pln */
            average_total_move_in_cost_pln: number;
            /** Average Liquidity Score */
            average_liquidity_score: number;
            /** Average Rental Potential Score */
            average_rental_potential_score: number;
            /** Notes */
            notes?: string[];
        };
        /** CoverageMetadata */
        CoverageMetadata: {
            /** Supported Cities */
            supported_cities?: string[];
            /** Supported Districts */
            supported_districts?: string[];
            /** Source Name */
            source_name: string;
            /**
             * Checked At
             * Format: date-time
             */
            checked_at: string;
            /** Freshness Note */
            freshness_note: string;
        };
        /** CrmClient */
        CrmClient: {
            /** Id */
            id: string;
            /** Agency Id */
            agency_id: string;
            /** Owner Id */
            owner_id: string;
            /** Display Name */
            display_name: string;
            /** Email */
            email?: string | null;
            /** Phone */
            phone?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Budget Min */
            budget_min?: number | null;
            /** Budget Max */
            budget_max?: number | null;
            /** Preferred Rooms */
            preferred_rooms?: number[];
            /**
             * Status
             * @enum {string}
             */
            status: "active" | "paused" | "won" | "lost" | "archived";
            /** Tags */
            tags?: string[];
            /**
             * Consent To Contact
             * @default false
             */
            consent_to_contact: boolean;
            /** Profile Notes */
            profile_notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /** Created By */
            created_by: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** CrmClientCreate */
        CrmClientCreate: {
            /** Display Name */
            display_name: string;
            /** Email */
            email?: string | null;
            /** Phone */
            phone?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Budget Min */
            budget_min?: number | null;
            /** Budget Max */
            budget_max?: number | null;
            /** Preferred Rooms */
            preferred_rooms?: number[];
            /**
             * Status
             * @default active
             * @enum {string}
             */
            status: "active" | "paused" | "won" | "lost" | "archived";
            /** Tags */
            tags?: string[];
            /**
             * Consent To Contact
             * @default false
             */
            consent_to_contact: boolean;
            /** Profile Notes */
            profile_notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** CrmClientDetail */
        CrmClientDetail: {
            /** Id */
            id: string;
            /** Agency Id */
            agency_id: string;
            /** Owner Id */
            owner_id: string;
            /** Display Name */
            display_name: string;
            /** Email */
            email?: string | null;
            /** Phone */
            phone?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Budget Min */
            budget_min?: number | null;
            /** Budget Max */
            budget_max?: number | null;
            /** Preferred Rooms */
            preferred_rooms?: number[];
            /**
             * Status
             * @enum {string}
             */
            status: "active" | "paused" | "won" | "lost" | "archived";
            /** Tags */
            tags?: string[];
            /**
             * Consent To Contact
             * @default false
             */
            consent_to_contact: boolean;
            /** Profile Notes */
            profile_notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /** Created By */
            created_by: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Notes */
            notes?: components["schemas"]["CrmNote"][];
            /** Shortlists */
            shortlists?: components["schemas"]["CrmShortlist"][];
        };
        /** CrmClientUpdate */
        CrmClientUpdate: {
            /** Display Name */
            display_name?: string | null;
            /** Email */
            email?: string | null;
            /** Phone */
            phone?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Budget Min */
            budget_min?: number | null;
            /** Budget Max */
            budget_max?: number | null;
            /** Preferred Rooms */
            preferred_rooms?: number[] | null;
            /** Status */
            status?: ("active" | "paused" | "won" | "lost" | "archived") | null;
            /** Tags */
            tags?: string[] | null;
            /** Consent To Contact */
            consent_to_contact?: boolean | null;
            /** Profile Notes */
            profile_notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            } | null;
        };
        /** CrmNote */
        CrmNote: {
            /** Id */
            id: string;
            /** Agency Id */
            agency_id: string;
            /** Client Id */
            client_id: string;
            /** Author Id */
            author_id: string;
            /** Body */
            body: string;
            /**
             * Visibility
             * @enum {string}
             */
            visibility: "internal" | "client_shareable";
            /**
             * Pinned
             * @default false
             */
            pinned: boolean;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** CrmNoteCreate */
        CrmNoteCreate: {
            /** Body */
            body: string;
            /**
             * Visibility
             * @default internal
             * @enum {string}
             */
            visibility: "internal" | "client_shareable";
            /**
             * Pinned
             * @default false
             */
            pinned: boolean;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** CrmNoteUpdate */
        CrmNoteUpdate: {
            /** Body */
            body?: string | null;
            /** Visibility */
            visibility?: ("internal" | "client_shareable") | null;
            /** Pinned */
            pinned?: boolean | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            } | null;
        };
        /** CrmSharePreview */
        CrmSharePreview: {
            /** Share Token */
            share_token?: string | null;
            /** Share Url */
            share_url?: string | null;
            /** Title */
            title: string;
            /** Client Display Name */
            client_display_name?: string | null;
            /** Client Message */
            client_message?: string | null;
            /** Items */
            items?: components["schemas"]["CrmShortlistItem"][];
            /** Client Shareable Notes */
            client_shareable_notes?: string[];
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /** Expires At */
            expires_at?: string | null;
            /** Disclaimer */
            disclaimer: string;
        };
        /** CrmShortlist */
        CrmShortlist: {
            /** Id */
            id: string;
            /** Agency Id */
            agency_id: string;
            /** Client Id */
            client_id: string;
            /** Owner Id */
            owner_id: string;
            /** Title */
            title: string;
            /** Listing Ids */
            listing_ids?: string[];
            /** Report Ids */
            report_ids?: string[];
            /** Items */
            items?: components["schemas"]["CrmShortlistItem"][];
            /** Client Message */
            client_message?: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "draft" | "shared" | "accepted" | "rejected" | "archived";
            /**
             * Share Enabled
             * @default false
             */
            share_enabled: boolean;
            /** Share Token */
            share_token?: string | null;
            /** Share Url */
            share_url?: string | null;
            /** Expires At */
            expires_at?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /** Created By */
            created_by: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** CrmShortlistCreate */
        CrmShortlistCreate: {
            /** Title */
            title: string;
            /** Listing Ids */
            listing_ids: string[];
            /** Report Ids */
            report_ids?: string[];
            /** Client Message */
            client_message?: string | null;
            /**
             * Status
             * @default draft
             * @enum {string}
             */
            status: "draft" | "shared" | "accepted" | "rejected" | "archived";
            /**
             * Share Enabled
             * @default false
             */
            share_enabled: boolean;
            /**
             * Expires In Days
             * @default 14
             */
            expires_in_days: number | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** CrmShortlistItem */
        CrmShortlistItem: {
            /** Listing Id */
            listing_id: string;
            /** Rank */
            rank: number;
            /** Title */
            title: string;
            /** Address */
            address: string;
            /** District */
            district: string;
            /** City */
            city: string;
            /** Price */
            price: number;
            /** Currency */
            currency: string;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Developer Reputation Score */
            developer_reputation_score?: number | null;
            /** Developer Reputation Label */
            developer_reputation_label?: ("strong" | "good" | "mixed" | "limited_data" | "risk_review") | null;
            /** Decision Score */
            decision_score: number;
            /**
             * Decision Label
             * @enum {string}
             */
            decision_label: "strong_candidate" | "good_option" | "fair_option" | "overpriced" | "risky" | "weak_fit";
            /** Investment Score */
            investment_score: number;
            /** Risk Score */
            risk_score: number;
            /** Negotiation Score */
            negotiation_score: number;
            /** Liquidity Score */
            liquidity_score: number;
            /** Rental Potential Score */
            rental_potential_score: number;
            /** Fair Price Mid Pln */
            fair_price_mid_pln: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /** Recommendation */
            recommendation: string;
            /** Talking Points */
            talking_points?: string[];
            /** Cautions */
            cautions?: string[];
        };
        /** CrmShortlistUpdate */
        CrmShortlistUpdate: {
            /** Title */
            title?: string | null;
            /** Listing Ids */
            listing_ids?: string[] | null;
            /** Report Ids */
            report_ids?: string[] | null;
            /** Client Message */
            client_message?: string | null;
            /** Status */
            status?: ("draft" | "shared" | "accepted" | "rejected" | "archived") | null;
            /** Share Enabled */
            share_enabled?: boolean | null;
            /** Expires In Days */
            expires_in_days?: number | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            } | null;
        };
        /** CustomDashboardConfig */
        CustomDashboardConfig: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Name */
            name: string;
            /** Description */
            description?: string | null;
            /**
             * Audience
             * @enum {string}
             */
            audience: "executive" | "acquisition" | "underwriting" | "sales" | "portfolio";
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Widget Codes */
            widget_codes: ("market_kpis" | "area_watchlist" | "listing_pipeline" | "risk_flags" | "developer_ranking" | "scoring_distribution" | "lead_funnel" | "api_usage" | "saved_reports" | "custom_notes")[];
            /** Filters */
            filters?: {
                [key: string]: unknown;
            };
            /** Refresh Interval Minutes */
            refresh_interval_minutes: number;
            /** Is Default */
            is_default: boolean;
            /** Shared With Agency Ids */
            shared_with_agency_ids?: string[];
            /** Notes */
            notes?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** CustomDashboardCreate */
        CustomDashboardCreate: {
            /** Name */
            name: string;
            /** Description */
            description?: string | null;
            /**
             * Audience
             * @default executive
             * @enum {string}
             */
            audience: "executive" | "acquisition" | "underwriting" | "sales" | "portfolio";
            /**
             * City
             * @default Wrocław
             */
            city: string | null;
            /** District */
            district?: string | null;
            /** Widget Codes */
            widget_codes?: ("market_kpis" | "area_watchlist" | "listing_pipeline" | "risk_flags" | "developer_ranking" | "scoring_distribution" | "lead_funnel" | "api_usage" | "saved_reports" | "custom_notes")[];
            /** Filters */
            filters?: {
                [key: string]: unknown;
            };
            /**
             * Refresh Interval Minutes
             * @default 60
             */
            refresh_interval_minutes: number;
            /**
             * Is Default
             * @default false
             */
            is_default: boolean;
            /** Shared With Agency Ids */
            shared_with_agency_ids?: string[];
            /** Notes */
            notes?: string | null;
        };
        /** CustomDashboardPreview */
        CustomDashboardPreview: {
            config: components["schemas"]["CustomDashboardConfig"];
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            dashboard: components["schemas"]["MarketDashboard"];
            area_comparison: components["schemas"]["AreaComparison"];
            market_intelligence: components["schemas"]["MarketIntelligenceReport"];
            /** Widgets */
            widgets?: components["schemas"]["CustomDashboardWidgetSnapshot"][];
            /** Source Notes */
            source_notes?: string[];
            /** Disclaimer */
            disclaimer: string;
        };
        /** CustomDashboardUpdate */
        CustomDashboardUpdate: {
            /** Name */
            name?: string | null;
            /** Description */
            description?: string | null;
            /** Audience */
            audience?: ("executive" | "acquisition" | "underwriting" | "sales" | "portfolio") | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Widget Codes */
            widget_codes?: ("market_kpis" | "area_watchlist" | "listing_pipeline" | "risk_flags" | "developer_ranking" | "scoring_distribution" | "lead_funnel" | "api_usage" | "saved_reports" | "custom_notes")[] | null;
            /** Filters */
            filters?: {
                [key: string]: unknown;
            } | null;
            /** Refresh Interval Minutes */
            refresh_interval_minutes?: number | null;
            /** Is Default */
            is_default?: boolean | null;
            /** Shared With Agency Ids */
            shared_with_agency_ids?: string[] | null;
            /** Notes */
            notes?: string | null;
        };
        /** CustomDashboardWidgetSnapshot */
        CustomDashboardWidgetSnapshot: {
            /**
             * Widget Code
             * @enum {string}
             */
            widget_code: "market_kpis" | "area_watchlist" | "listing_pipeline" | "risk_flags" | "developer_ranking" | "scoring_distribution" | "lead_funnel" | "api_usage" | "saved_reports" | "custom_notes";
            /** Title */
            title: string;
            /**
             * Status
             * @enum {string}
             */
            status: "ready" | "needs_data" | "planned";
            /** Summary */
            summary: string;
            /** Metrics */
            metrics?: {
                [key: string]: unknown;
            };
            /** Actions */
            actions?: string[];
        };
        /** DataDeletionRequest */
        DataDeletionRequest: {
            /** Id */
            id: string;
            /**
             * Target Type
             * @enum {string}
             */
            target_type: "raw_listing" | "user_submitted_draft" | "generated_report" | "source_reference" | "other";
            /** Target Id */
            target_id: string;
            /** Target Owner Id */
            target_owner_id?: string | null;
            /** Source Name */
            source_name?: string | null;
            /** Source Url Hash */
            source_url_hash?: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "open" | "processed" | "rejected";
            /** Requested By */
            requested_by: string;
            /** Processed By */
            processed_by?: string | null;
            /** Reason */
            reason?: string | null;
            /** Request Payload */
            request_payload?: {
                [key: string]: unknown;
            };
            /** Result Payload */
            result_payload?: {
                [key: string]: unknown;
            };
            /** Action Summary */
            action_summary?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Processed At */
            processed_at?: string | null;
        };
        /** DataDeletionRequestCreate */
        DataDeletionRequestCreate: {
            /**
             * Target Type
             * @enum {string}
             */
            target_type: "raw_listing" | "user_submitted_draft" | "generated_report" | "source_reference" | "other";
            /** Target Id */
            target_id: string;
            /** Target Owner Id */
            target_owner_id?: string | null;
            /** Source Name */
            source_name?: string | null;
            /** Source Url Hash */
            source_url_hash?: string | null;
            /** Requested By */
            requested_by?: string | null;
            /** Reason */
            reason?: string | null;
            /** Request Payload */
            request_payload?: {
                [key: string]: unknown;
            };
        };
        /** DataDeletionRequestProcess */
        DataDeletionRequestProcess: {
            /**
             * Status
             * @default processed
             * @enum {string}
             */
            status: "processed" | "rejected";
            /** Action Summary */
            action_summary: string;
            /** Result Payload */
            result_payload?: {
                [key: string]: unknown;
            };
            /**
             * Execute Target Deletion
             * @default true
             */
            execute_target_deletion: boolean;
        };
        /** DataProvenance */
        DataProvenance: {
            /**
             * Mode
             * @default live
             * @enum {string}
             */
            mode: "live" | "demo";
            /** Source Type */
            source_type: string;
            /** Notice Code */
            notice_code?: string | null;
        };
        /** DataQualityLog */
        DataQualityLog: {
            /** Id */
            id: string;
            /** Job Id */
            job_id?: string | null;
            /** Source Name */
            source_name: string;
            /** Source Listing Id */
            source_listing_id?: string | null;
            /**
             * Severity
             * @enum {string}
             */
            severity: "info" | "warning" | "error";
            /** Code */
            code: string;
            /** Message */
            message: string;
            /** Payload */
            payload?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** DataQualityLogCreate */
        DataQualityLogCreate: {
            /** Job Id */
            job_id?: string | null;
            /** Source Name */
            source_name: string;
            /** Source Listing Id */
            source_listing_id?: string | null;
            /**
             * Severity
             * @default info
             * @enum {string}
             */
            severity: "info" | "warning" | "error";
            /** Code */
            code: string;
            /** Message */
            message: string;
            /** Payload */
            payload?: {
                [key: string]: unknown;
            };
        };
        /** DeveloperAlias */
        DeveloperAlias: {
            /** Id */
            id: string;
            /** Developer Id */
            developer_id: string;
            /** Alias */
            alias: string;
            /**
             * Alias Type
             * @enum {string}
             */
            alias_type: "brand" | "legal_entity" | "spv" | "project_company" | "parent_company" | "source_name" | "other";
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url?: string | null;
            /** Confidence Score */
            confidence_score: number;
            /**
             * Active
             * @default true
             */
            active: boolean;
        };
        /** DeveloperFeedImportResponse */
        DeveloperFeedImportResponse: {
            /** Rows Seen */
            rows_seen: number;
            /** Profiles Created */
            profiles_created: number;
            /** Profiles Updated */
            profiles_updated: number;
            /** Aliases Created */
            aliases_created: number;
            /** Aliases Updated */
            aliases_updated: number;
            /** Projects Created */
            projects_created: number;
            /** Projects Updated */
            projects_updated: number;
            /** Signals Created */
            signals_created: number;
            /** Signals Updated */
            signals_updated: number;
            /** Dry Run */
            dry_run: boolean;
            /** Developer Ids */
            developer_ids?: string[];
            job: components["schemas"]["IngestionJob"];
        };
        /** DeveloperProfile */
        DeveloperProfile: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Legal Name */
            legal_name?: string | null;
            /** Brand Names */
            brand_names?: string[];
            /** Krs */
            krs?: string | null;
            /** Nip */
            nip?: string | null;
            /** Regon */
            regon?: string | null;
            /** Website Url */
            website_url?: string | null;
            /** Headquarters City */
            headquarters_city?: string | null;
            /** Founded Year */
            founded_year?: number | null;
            /** Source Names */
            source_names?: string[];
            /**
             * Updated At
             * Format: date
             */
            updated_at: string;
        };
        /** DeveloperProject */
        DeveloperProject: {
            /** Id */
            id: string;
            /** Developer Id */
            developer_id: string;
            /** Name */
            name: string;
            /** City */
            city: string;
            /** District */
            district?: string | null;
            /**
             * Status
             * @default unknown
             * @enum {string}
             */
            status: "completed" | "active" | "planned" | "unknown";
            /** Units Count */
            units_count?: number | null;
            /** Completed Year */
            completed_year?: number | null;
            /** Source Url */
            source_url?: string | null;
        };
        /** DeveloperQualitySignal */
        DeveloperQualitySignal: {
            /** Id */
            id: string;
            /** Developer Id */
            developer_id: string;
            /**
             * Signal Type
             * @enum {string}
             */
            signal_type: "track_record" | "delivery" | "technical_quality" | "legal" | "financial" | "transparency" | "local_market";
            /**
             * Severity
             * @enum {string}
             */
            severity: "positive" | "info" | "warning" | "risk";
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url?: string | null;
            /** Observed At */
            observed_at?: string | null;
            /** Confidence Score */
            confidence_score: number;
            /**
             * Moderation Status
             * @default active
             * @enum {string}
             */
            moderation_status: "active" | "under_review" | "suppressed";
            /**
             * Dispute Status
             * @default none
             * @enum {string}
             */
            dispute_status: "none" | "open" | "resolved" | "rejected";
            /** Moderation Note */
            moderation_note?: string | null;
            /** Disputed By */
            disputed_by?: string | null;
            /** Disputed At */
            disputed_at?: string | null;
            /** Resolved At */
            resolved_at?: string | null;
            /** Reviewed By */
            reviewed_by?: string | null;
        };
        /** DeveloperQualitySignalModerationUpdate */
        DeveloperQualitySignalModerationUpdate: {
            /** Moderation Status */
            moderation_status?: ("active" | "under_review" | "suppressed") | null;
            /** Dispute Status */
            dispute_status?: ("none" | "open" | "resolved" | "rejected") | null;
            /** Moderation Note */
            moderation_note?: string | null;
            /** Disputed By */
            disputed_by?: string | null;
            /** Reviewed By */
            reviewed_by?: string | null;
        };
        /** DeveloperRankingResponse */
        DeveloperRankingResponse: {
            /** Items */
            items: components["schemas"]["DeveloperReputation"][];
            /** Total */
            total: number;
            /** Filters */
            filters?: {
                [key: string]: unknown;
            };
        };
        /** DeveloperReputation */
        DeveloperReputation: {
            developer: components["schemas"]["DeveloperProfile"];
            /** Reputation Score */
            reputation_score: number;
            /** Confidence Score */
            confidence_score: number;
            /**
             * Label
             * @enum {string}
             */
            label: "strong" | "good" | "mixed" | "limited_data" | "risk_review";
            /** Track Record Score */
            track_record_score: number;
            /** Delivery Score */
            delivery_score: number;
            /** Technical Quality Score */
            technical_quality_score: number;
            /** Legal Compliance Score */
            legal_compliance_score: number;
            /** Financial Stability Score */
            financial_stability_score: number;
            /** Transparency Score */
            transparency_score: number;
            /** Local Experience Score */
            local_experience_score: number;
            /** Completed Projects Count */
            completed_projects_count: number;
            /** Active Projects Count */
            active_projects_count: number;
            /** Positive Signals */
            positive_signals?: string[];
            /** Risk Signals */
            risk_signals?: string[];
            /** Due Diligence Questions */
            due_diligence_questions?: string[];
            /** Source Citations */
            source_citations?: components["schemas"]["DeveloperSourceCitation"][];
            /** Aliases */
            aliases?: components["schemas"]["DeveloperAlias"][];
            /** Projects */
            projects?: components["schemas"]["DeveloperProject"][];
            /** Quality Signals */
            quality_signals?: components["schemas"]["DeveloperQualitySignal"][];
        };
        /** DeveloperSourceCitation */
        DeveloperSourceCitation: {
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url?: string | null;
            /**
             * Checked At
             * Format: date
             */
            checked_at: string;
            /** Note */
            note?: string | null;
        };
        /** DistrictReference */
        DistrictReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** Name */
            name: string;
            /** Slug */
            slug: string;
            /** Area Id */
            area_id?: string | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** DueDiligenceChecklistItem */
        DueDiligenceChecklistItem: {
            /** Code */
            code: string;
            /** Category */
            category: string;
            /** Label */
            label: string;
            /**
             * Priority
             * @enum {string}
             */
            priority: "critical" | "high" | "medium" | "low";
            /**
             * Status
             * @enum {string}
             */
            status: "known" | "estimated" | "verify_required" | "unknown" | "not_applicable";
            /** Rationale */
            rationale: string;
        };
        /** Favorite */
        Favorite: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Listing Id */
            listing_id: string;
            /** Note */
            note?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            listing?: components["schemas"]["Listing"] | null;
        };
        /** FavoriteCreate */
        FavoriteCreate: {
            /** Listing Id */
            listing_id: string;
            /** Note */
            note?: string | null;
        };
        /** FavoriteUpdate */
        FavoriteUpdate: {
            /** Note */
            note?: string | null;
        };
        /** FutureImpactNarrativeItem */
        FutureImpactNarrativeItem: {
            /** Investment Id */
            investment_id: string;
            /** Name */
            name: string;
            /** Investment Type */
            investment_type: string;
            /**
             * Category
             * @enum {string}
             */
            category: "positive_catalyst" | "mixed" | "disruption_risk" | "supply_pressure";
            /** Distance M */
            distance_m: number;
            /** Status */
            status: string;
            /** Expected Year */
            expected_year?: number | null;
            /** Confidence Score */
            confidence_score: number;
            /** Positive Effects */
            positive_effects?: string[];
            /** Disruption Risks */
            disruption_risks?: string[];
            /** Supply Pressure Risks */
            supply_pressure_risks?: string[];
            /** Narrative */
            narrative: string;
        };
        /** FutureImpactRadiusBucket */
        FutureImpactRadiusBucket: {
            /** Radius M */
            radius_m: number;
            /** Count */
            count: number;
            /** High Confidence Count */
            high_confidence_count: number;
            /** Investment Types */
            investment_types?: string[];
            /** Statuses */
            statuses?: string[];
            /** Nearest Distance M */
            nearest_distance_m?: number | null;
        };
        /** GenerateReportRequest */
        GenerateReportRequest: {
            /** Listing Id */
            listing_id: string;
            /**
             * Audience
             * @default buyer
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            branding?: components["schemas"]["ReportBranding"] | null;
            /**
             * Report Format
             * @default html
             * @enum {string}
             */
            report_format: "json" | "html";
        };
        /** GenerateUserSubmittedDraftReportRequest */
        GenerateUserSubmittedDraftReportRequest: {
            /**
             * Audience
             * @default buyer
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /**
             * Report Format
             * @default html
             * @enum {string}
             */
            report_format: "json" | "html";
            branding?: components["schemas"]["ReportBranding"] | null;
        };
        /** GeneratedReport */
        GeneratedReport: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Listing Id */
            listing_id: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /**
             * Report Format
             * @enum {string}
             */
            report_format: "json" | "html";
            /** Content Type */
            content_type: string;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Report Version */
            report_version?: string | null;
            /** Data As Of */
            data_as_of?: string | null;
            /** Content */
            content: string;
            /** Report Metadata */
            report_metadata: {
                [key: string]: unknown;
            };
        };
        /** GeneratedReportListItem */
        GeneratedReportListItem: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Listing Id */
            listing_id: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /**
             * Report Format
             * @enum {string}
             */
            report_format: "json" | "html";
            /** Content Type */
            content_type: string;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Report Version */
            report_version?: string | null;
            /** Data As Of */
            data_as_of?: string | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HiddenGemItem */
        HiddenGemItem: {
            analysis: components["schemas"]["ListingAnalysis"];
            /** Gem Score */
            gem_score: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /** Estimated Discount To Fair Mid Pln */
            estimated_discount_to_fair_mid_pln: number;
            /** Signals */
            signals?: string[];
        };
        /** HiddenGemsResponse */
        HiddenGemsResponse: {
            /** Items */
            items: components["schemas"]["HiddenGemItem"][];
            /** Total */
            total: number;
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total Pages */
            total_pages: number;
            /** Filters */
            filters?: {
                [key: string]: unknown;
            };
        };
        /** IndustrialZoneReference */
        IndustrialZoneReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Name */
            name: string;
            /** Zone Type */
            zone_type: string;
            /**
             * Risk Level
             * @default unknown
             */
            risk_level: string;
            /** Impact Radius M */
            impact_radius_m?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Source Url */
            source_url?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** InfrastructureEnrichmentItem */
        InfrastructureEnrichmentItem: {
            /** Property Id */
            property_id: number;
            /** Listing Id */
            listing_id?: string | null;
            /** City */
            city: string;
            /** District */
            district?: string | null;
            /** Distance To Center Km */
            distance_to_center_km?: number | null;
            /** Nearest Stop M */
            nearest_stop_m?: number | null;
            /** Nearest School M */
            nearest_school_m?: number | null;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m?: number | null;
            /**
             * Parks Within 1Km
             * @default 0
             */
            parks_within_1km: number;
            /**
             * Schools Within 1Km
             * @default 0
             */
            schools_within_1km: number;
            /**
             * Planned Investments Within 2Km
             * @default 0
             */
            planned_investments_within_2km: number;
            /** Changed Fields */
            changed_fields?: string[];
        };
        /** InfrastructureEnrichmentJobResult */
        InfrastructureEnrichmentJobResult: {
            /**
             * Calculated At
             * Format: date-time
             */
            calculated_at: string;
            /** Dry Run */
            dry_run: boolean;
            /** Properties Seen */
            properties_seen: number;
            /** Properties With Changes */
            properties_with_changes: number;
            /** Properties Updated */
            properties_updated: number;
            /** Snapshots Updated */
            snapshots_updated: number;
            /** Items */
            items?: components["schemas"]["InfrastructureEnrichmentItem"][];
        };
        /** InfrastructureReferenceImportResponse */
        InfrastructureReferenceImportResponse: {
            /** Rows Seen */
            rows_seen: number;
            /** Created */
            created: number;
            /** Updated */
            updated: number;
            /** Skipped */
            skipped: number;
            /** Dry Run */
            dry_run: boolean;
            /** Layer Counts */
            layer_counts?: {
                [key: string]: number;
            };
            /** Item Ids */
            item_ids?: string[];
            /** Errors */
            errors?: string[];
            job: components["schemas"]["IngestionJob"];
        };
        /** IngestionJob */
        IngestionJob: {
            /** Id */
            id: string;
            /** Source Name */
            source_name: string;
            /** Source Type */
            source_type: string;
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "succeeded" | "failed";
            /** Rows Seen */
            rows_seen: number;
            /** Raw Created */
            raw_created: number;
            /** Raw Updated */
            raw_updated: number;
            /** Properties Created */
            properties_created: number;
            /** Properties Updated */
            properties_updated: number;
            /** Snapshots Created */
            snapshots_created: number;
            /** Snapshots Updated */
            snapshots_updated: number;
            /** Errors Count */
            errors_count: number;
            /** Created By */
            created_by: string;
            /** Notes */
            notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /** Started At */
            started_at?: string | null;
            /** Finished At */
            finished_at?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** IngestionJobCreate */
        IngestionJobCreate: {
            /** Source Name */
            source_name: string;
            /**
             * Source Type
             * @default partner_csv
             */
            source_type: string;
            /**
             * Status
             * @default queued
             * @enum {string}
             */
            status: "queued" | "running" | "succeeded" | "failed";
            /**
             * Created By
             * @default system
             */
            created_by: string;
            /** Notes */
            notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** IngestionSourceHealth */
        IngestionSourceHealth: {
            /** Source Name */
            source_name: string;
            /** Source Type */
            source_type: string;
            /**
             * Health Status
             * @enum {string}
             */
            health_status: "healthy" | "warning" | "failing";
            /** Latest Job Id */
            latest_job_id: string;
            /**
             * Latest Job Status
             * @enum {string}
             */
            latest_job_status: "queued" | "running" | "succeeded" | "failed";
            /** Rows Seen */
            rows_seen: number;
            /** Errors Count */
            errors_count: number;
            /** Warning Count */
            warning_count: number;
            /** Error Count */
            error_count: number;
            /** Last Error Message */
            last_error_message?: string | null;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** KindergartenReference */
        KindergartenReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Name */
            name: string;
            /** Kindergarten Type */
            kindergarten_type: string;
            /** Operator Type */
            operator_type?: string | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Source Url */
            source_url?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** Listing */
        Listing: {
            /** Id */
            id: string;
            /** Title */
            title: string;
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url: string;
            /**
             * Media Status
             * @default unknown
             * @enum {string}
             */
            media_status: "available" | "missing" | "unknown";
            data_provenance?: components["schemas"]["DataProvenance"];
            /** Voivodeship */
            voivodeship?: string | null;
            /** City */
            city: string;
            /** District */
            district: string;
            /** Area Id */
            area_id: string;
            /** Municipality */
            municipality: string;
            /** Address */
            address: string;
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Building Type */
            building_type?: string | null;
            /** Renovation State */
            renovation_state?: string | null;
            /** Custom Renovation Budget Pln */
            custom_renovation_budget_pln?: number | null;
            /** Has Balcony */
            has_balcony?: boolean | null;
            /** Has Terrace */
            has_terrace?: boolean | null;
            /** Has Garden */
            has_garden?: boolean | null;
            /** Has Elevator */
            has_elevator?: boolean | null;
            /** Parking Type */
            parking_type?: string | null;
            /** Heating Type */
            heating_type?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Price */
            price: number;
            /**
             * Currency
             * @default PLN
             */
            currency: string;
            /** Area M2 */
            area_m2: number;
            /** Price Per M2 */
            price_per_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /**
             * First Seen At
             * Format: date
             */
            first_seen_at: string;
            /**
             * Last Seen At
             * Format: date
             */
            last_seen_at: string;
            /** Days On Market */
            days_on_market: number;
            /** Price Reductions */
            price_reductions: number;
            /** Price Increases */
            price_increases: number;
            /** Relisted */
            relisted: boolean;
            /** Lat */
            lat: number;
            /** Lon */
            lon: number;
            /** Distance To Center Km */
            distance_to_center_km?: number | null;
            /** Nearest Stop M */
            nearest_stop_m?: number | null;
            /** Nearest School M */
            nearest_school_m?: number | null;
            /** Nearest Major Road M */
            nearest_major_road_m?: number | null;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m?: number | null;
            /** Parks Within 1Km */
            parks_within_1km?: number | null;
            /** Schools Within 1Km */
            schools_within_1km?: number | null;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km?: number | null;
            /** Data Quality Score */
            data_quality_score: number;
        };
        /** ListingAnalysis */
        ListingAnalysis: {
            listing: components["schemas"]["Listing"];
            area_statistics: components["schemas"]["AreaStatistics"];
            /** Price History */
            price_history: components["schemas"]["PriceHistoryPoint"][];
            /** Listing Events */
            listing_events?: components["schemas"]["ListingEvent"][];
            /** Comparables */
            comparables: components["schemas"]["Listing"][];
            developer_reputation?: components["schemas"]["DeveloperReputation"] | null;
            future_area_impact?: components["schemas"]["ListingFutureImpact"] | null;
            growth_analysis?: components["schemas"]["ListingGrowthAnalysis"] | null;
            risk_profile?: components["schemas"]["ListingRiskProfile"] | null;
            rental_estimate?: components["schemas"]["ListingRentalEstimate"] | null;
            buyer_decision?: components["schemas"]["BuyerDecisionPackage"] | null;
            scores: components["schemas"]["PropertyScores"];
            /** Insights */
            insights: string[];
            /** Negotiation Arguments */
            negotiation_arguments: string[];
            /** Data Quality Notes */
            data_quality_notes: string[];
            /**
             * Comparables Scope
             * @default unknown
             */
            comparables_scope: string;
            /**
             * Comparables Selection Level
             * @default 0
             */
            comparables_selection_level: number;
            /**
             * Comparables Freshness Days
             * @default 180
             */
            comparables_freshness_days: number;
            /** Comparables Excluded Reasons */
            comparables_excluded_reasons?: string[];
            /**
             * Disclaimer
             * @default Scoring outputs are decision-support screening signals, not financial, legal or investment advice, not a valuation certificate and not a guarantee of price, financing, legal status or future performance.
             */
            disclaimer: string;
        };
        /** ListingCorrectionRequest */
        ListingCorrectionRequest: {
            /** Title */
            title?: string | null;
            /** Voivodeship */
            voivodeship?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Area Id */
            area_id?: string | null;
            /** Municipality */
            municipality?: string | null;
            /** Address */
            address?: string | null;
            /** Market Type */
            market_type?: ("primary" | "secondary") | null;
            /** Building Type */
            building_type?: string | null;
            /** Renovation State */
            renovation_state?: string | null;
            /** Has Balcony */
            has_balcony?: boolean | null;
            /** Has Terrace */
            has_terrace?: boolean | null;
            /** Has Garden */
            has_garden?: boolean | null;
            /** Has Elevator */
            has_elevator?: boolean | null;
            /** Parking Type */
            parking_type?: string | null;
            /** Heating Type */
            heating_type?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Price */
            price?: number | null;
            /** Area M2 */
            area_m2?: number | null;
            /** Rooms */
            rooms?: number | null;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Distance To Center Km */
            distance_to_center_km?: number | null;
            /** Nearest Stop M */
            nearest_stop_m?: number | null;
            /** Nearest School M */
            nearest_school_m?: number | null;
            /** Nearest Major Road M */
            nearest_major_road_m?: number | null;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m?: number | null;
            /** Parks Within 1Km */
            parks_within_1km?: number | null;
            /** Schools Within 1Km */
            schools_within_1km?: number | null;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km?: number | null;
            /** Data Quality Score */
            data_quality_score?: number | null;
            /** Correction Reason */
            correction_reason: string;
            /** Corrected By */
            corrected_by?: string | null;
        };
        /** ListingCorrectionResult */
        ListingCorrectionResult: {
            listing: components["schemas"]["Listing"];
            /** Changed Fields */
            changed_fields: string[];
            /** Correction Reason */
            correction_reason: string;
            /** Corrected By */
            corrected_by?: string | null;
        };
        /** ListingEvent */
        ListingEvent: {
            /** Listing Id */
            listing_id: string;
            /**
             * Event Type
             * @enum {string}
             */
            event_type: "first_seen" | "price_reduced" | "price_increased" | "parameter_changed" | "description_changed" | "relisted" | "removed" | "republished";
            /**
             * Observed At
             * Format: date
             */
            observed_at: string;
            /** Summary */
            summary: string;
            /** Payload */
            payload?: {
                [key: string]: unknown;
            };
        };
        /** ListingFutureImpact */
        ListingFutureImpact: {
            /** Listing Id */
            listing_id: string;
            /** Max Radius M */
            max_radius_m: number;
            /** Radii M */
            radii_m?: number[];
            /** Buckets */
            buckets?: components["schemas"]["FutureImpactRadiusBucket"][];
            /** Nearest Investments */
            nearest_investments?: components["schemas"]["PlannedInvestmentImpactItem"][];
            /** Impact Score */
            impact_score: number;
            /** Summary */
            summary: string;
            /** Impact Narrative */
            impact_narrative?: string[];
            /** Positive Catalysts */
            positive_catalysts?: components["schemas"]["FutureImpactNarrativeItem"][];
            /** Negative Or Supply Projects */
            negative_or_supply_projects?: components["schemas"]["FutureImpactNarrativeItem"][];
            /** Growth Signals */
            growth_signals?: string[];
            /** Risk Signals */
            risk_signals?: string[];
            /** Methodology Note */
            methodology_note: string;
        };
        /** ListingGrowthAnalysis */
        ListingGrowthAnalysis: {
            /** Listing Id */
            listing_id: string;
            /** Growth Score */
            growth_score: number;
            /**
             * Growth Label
             * @enum {string}
             */
            growth_label: "strong_growth" | "moderate_growth" | "mixed_growth" | "weak_growth";
            /** Factors */
            factors?: components["schemas"]["ListingGrowthFactor"][];
            /** Positive Signals */
            positive_signals?: string[];
            /** Drag Signals */
            drag_signals?: string[];
            /** Missing Layers */
            missing_layers?: string[];
            /** Summary */
            summary: string;
            /** Methodology Note */
            methodology_note: string;
        };
        /** ListingGrowthFactor */
        ListingGrowthFactor: {
            /**
             * Code
             * @enum {string}
             */
            code: "transport" | "education" | "parks_greenery" | "healthcare" | "retail_services" | "offices_jobs" | "universities" | "population_jobs_growth";
            /** Label */
            label: string;
            /** Score */
            score: number;
            /** Weight */
            weight: number;
            /**
             * Posture
             * @enum {string}
             */
            posture: "strong" | "moderate" | "weak" | "missing";
            /** Evidence */
            evidence?: string[];
            /** Recommended Checks */
            recommended_checks?: string[];
            /** Data Status */
            data_status: string;
        };
        /** ListingRentalEstimate */
        ListingRentalEstimate: {
            /** Listing Id */
            listing_id: string;
            /**
             * Status
             * @default estimated
             * @enum {string}
             */
            status: "estimated" | "insufficient_data";
            /**
             * Source
             * @default derived_model
             */
            source: string;
            /**
             * Method
             * @default deterministic screening heuristic
             */
            method: string;
            /**
             * Period
             * @default current listing snapshot
             */
            period: string;
            /** Monthly Rent Low Pln */
            monthly_rent_low_pln: number;
            /** Monthly Rent Mid Pln */
            monthly_rent_mid_pln: number;
            /** Monthly Rent High Pln */
            monthly_rent_high_pln: number;
            /** Rent Per M2 Mid Pln */
            rent_per_m2_mid_pln: number;
            /** Gross Yield Pct */
            gross_yield_pct: number;
            /**
             * Net Yield On Cash Pct
             * @default 0
             */
            net_yield_on_cash_pct: number;
            /** Vacancy Rate Pct */
            vacancy_rate_pct: number;
            /** Operating Costs Monthly Pln */
            operating_costs_monthly_pln: number;
            /** Net Operating Income Monthly Pln */
            net_operating_income_monthly_pln: number;
            /** Confidence Score */
            confidence_score: number;
            /** Cashflow Scenarios */
            cashflow_scenarios?: components["schemas"]["RentalCashflowScenario"][];
            /** Assumptions */
            assumptions?: string[];
            /** Risk Notes */
            risk_notes?: string[];
            /** Methodology Note */
            methodology_note: string;
        };
        /** ListingRiskFactor */
        ListingRiskFactor: {
            /** Code */
            code: string;
            /** Category */
            category: string;
            /** Severity */
            severity: string;
            /** Score */
            score: number;
            /** Summary */
            summary: string;
            /** Evidence */
            evidence?: string[];
            /** Recommended Checks */
            recommended_checks?: string[];
        };
        /** ListingRiskProfile */
        ListingRiskProfile: {
            /** Listing Id */
            listing_id: string;
            /** Risk Score */
            risk_score: number;
            /**
             * Risk Label
             * @enum {string}
             */
            risk_label: "low_risk" | "moderate_risk" | "elevated_risk" | "high_risk";
            /** Overall Severity */
            overall_severity: string;
            /** Factors */
            factors?: components["schemas"]["ListingRiskFactor"][];
            /** Priority Checks */
            priority_checks?: string[];
            /** Missing Risk Layers */
            missing_risk_layers?: string[];
            /** Methodology Note */
            methodology_note: string;
        };
        /** ListingSearchResponse */
        ListingSearchResponse: {
            /** Items */
            items: components["schemas"]["ListingAnalysis"][];
            /** Total */
            total: number;
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Total Pages */
            total_pages: number;
            /**
             * Sort
             * @enum {string}
             */
            sort: "price_asc" | "price_desc" | "price_per_m2_asc" | "price_per_m2_desc" | "investment_score_desc" | "investment_score_asc" | "risk_score_asc" | "risk_score_desc" | "negotiation_score_desc" | "negotiation_score_asc" | "liquidity_score_desc" | "liquidity_score_asc" | "rental_potential_score_desc" | "rental_potential_score_asc" | "developer_reputation_score_desc" | "developer_reputation_score_asc" | "developer_confidence_score_desc" | "developer_confidence_score_asc" | "days_on_market_asc" | "days_on_market_desc" | "newest" | "oldest";
            /** Filters */
            filters?: {
                [key: string]: unknown;
            };
        };
        /** LocationReference */
        LocationReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Name */
            name: string;
            /** Slug */
            slug: string;
            /**
             * Location Type
             * @enum {string}
             */
            location_type: "district" | "neighborhood" | "locality" | "landmark" | "transport_node";
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Aliases */
            aliases?: string[];
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** MapFeature */
        MapFeature: {
            /**
             * Type
             * @default Feature
             * @constant
             */
            type: "Feature";
            /** Id */
            id: string;
            /** Geometry */
            geometry: components["schemas"]["MapPointGeometry"] | components["schemas"]["MapPolygonGeometry"] | components["schemas"]["MapLineStringGeometry"];
            /** Properties */
            properties: {
                [key: string]: unknown;
            };
        };
        /** MapFeatureCollection */
        MapFeatureCollection: {
            /**
             * Type
             * @default FeatureCollection
             * @constant
             */
            type: "FeatureCollection";
            /** Features */
            features: components["schemas"]["MapFeature"][];
            /** Bbox */
            bbox?: [
                number,
                number,
                number,
                number
            ] | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** MapLineStringGeometry */
        MapLineStringGeometry: {
            /**
             * Type
             * @default LineString
             * @constant
             */
            type: "LineString";
            /** Coordinates */
            coordinates: [
                number,
                number
            ][];
        };
        /** MapPointGeometry */
        MapPointGeometry: {
            /**
             * Type
             * @default Point
             * @constant
             */
            type: "Point";
            /** Coordinates */
            coordinates: [
                number,
                number
            ];
        };
        /** MapPolygonGeometry */
        MapPolygonGeometry: {
            /**
             * Type
             * @default Polygon
             * @constant
             */
            type: "Polygon";
            /** Coordinates */
            coordinates: [
                number,
                number
            ][][];
        };
        /** MarketDashboard */
        MarketDashboard: {
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Listings Count */
            listings_count: number;
            /** Active Listings */
            active_listings: number;
            /** New Listings 30D */
            new_listings_30d: number;
            /** Removed Listings 30D */
            removed_listings_30d: number;
            /** Average Days On Market */
            average_days_on_market: number;
            /** Median Price */
            median_price?: number | null;
            /** Median Price Per M2 */
            median_price_per_m2?: number | null;
            /** Average Price Per M2 */
            average_price_per_m2?: number | null;
            /** Price Change 90D Pct */
            price_change_90d_pct?: number | null;
            /** Supply Change 90D Pct */
            supply_change_90d_pct?: number | null;
            /** Price Distribution */
            price_distribution: components["schemas"]["MarketDistributionBucket"][];
            /** Price Per M2 Distribution */
            price_per_m2_distribution: components["schemas"]["MarketDistributionBucket"][];
            /** Rooms Distribution */
            rooms_distribution: components["schemas"]["MarketDistributionBucket"][];
            /** Area Distribution */
            area_distribution: components["schemas"]["MarketDistributionBucket"][];
            /** Areas */
            areas: components["schemas"]["MarketDashboardArea"][];
        };
        /** MarketDashboardArea */
        MarketDashboardArea: {
            /** Area Id */
            area_id: string;
            /** Name */
            name: string;
            /** City */
            city: string;
            /** Median Price Per M2 */
            median_price_per_m2: number;
            /** Average Price Per M2 */
            average_price_per_m2: number;
            /** Active Listings */
            active_listings: number;
            /** New Listings 30D */
            new_listings_30d: number;
            /** Removed Listings 30D */
            removed_listings_30d: number;
            /** Average Days On Market */
            average_days_on_market: number;
            /** Price Change 90D Pct */
            price_change_90d_pct: number;
            /** Supply Change 90D Pct */
            supply_change_90d_pct: number;
            /** Liquidity Index */
            liquidity_index: number;
            /** Overheated Index */
            overheated_index: number;
            /** Buyer Market Index */
            buyer_market_index: number;
            /** Seller Market Index */
            seller_market_index: number;
        };
        /** MarketDistributionBucket */
        MarketDistributionBucket: {
            /** Label */
            label: string;
            /** Count */
            count: number;
            /** Min Value */
            min_value?: number | null;
            /** Max Value */
            max_value?: number | null;
        };
        /** MarketIntelligenceFinding */
        MarketIntelligenceFinding: {
            /** Title */
            title: string;
            /**
             * Severity
             * @enum {string}
             */
            severity: "positive" | "neutral" | "watch" | "risk";
            /** Detail */
            detail: string;
            /** Metric Code */
            metric_code?: string | null;
        };
        /** MarketIntelligenceKpi */
        MarketIntelligenceKpi: {
            /** Code */
            code: string;
            /** Label */
            label: string;
            /** Value */
            value?: number | string | null;
            /** Unit */
            unit?: string | null;
            /** Interpretation */
            interpretation: string;
        };
        /** MarketIntelligenceReport */
        MarketIntelligenceReport: {
            /**
             * Audience
             * @enum {string}
             */
            audience: "bank" | "developer" | "fund";
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /** Market Scope */
            market_scope: string;
            /** Executive Summary */
            executive_summary: string;
            /** Data Confidence */
            data_confidence: string;
            /** Kpis */
            kpis?: components["schemas"]["MarketIntelligenceKpi"][];
            /** Findings */
            findings?: components["schemas"]["MarketIntelligenceFinding"][];
            /** Opportunities */
            opportunities?: string[];
            /** Risks */
            risks?: string[];
            /** Recommended Actions */
            recommended_actions?: string[];
            /** Area Watchlist */
            area_watchlist?: components["schemas"]["AreaComparisonItem"][];
            dashboard: components["schemas"]["MarketDashboard"];
            area_comparison: components["schemas"]["AreaComparison"];
            /** Source Notes */
            source_notes?: string[];
            /** Disclaimer */
            disclaimer: string;
        };
        /** MortgageAffordability */
        MortgageAffordability: {
            /**
             * Status
             * @enum {string}
             */
            status: "unknown" | "comfortable" | "stretched" | "high_risk";
            /** Monthly Income Pln */
            monthly_income_pln?: number | null;
            /** Available For Mortgage Comfortable Pln */
            available_for_mortgage_comfortable_pln?: number | null;
            /** Available For Mortgage Stretched Pln */
            available_for_mortgage_stretched_pln?: number | null;
            /** Base Debt To Income Pct */
            base_debt_to_income_pct?: number | null;
            /** Payment To Income Pct */
            payment_to_income_pct?: number | null;
            /** Monthly Buffer After Payment Pln */
            monthly_buffer_after_payment_pln?: number | null;
        };
        /** MortgageCalculationRequest */
        MortgageCalculationRequest: {
            /** Property Price Pln */
            property_price_pln: number;
            /** Down Payment Pln */
            down_payment_pln: number;
            /**
             * Loan Years
             * @default 25
             */
            loan_years: number;
            /**
             * Annual Interest Rate Pct
             * @default 7.5
             */
            annual_interest_rate_pct: number;
            /**
             * Rate Type
             * @default fixed
             * @enum {string}
             */
            rate_type: "fixed" | "variable";
            /**
             * Market Type
             * @default secondary
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Monthly Income Pln */
            monthly_income_pln?: number | null;
            /**
             * Monthly Existing Debt Pln
             * @default 0
             */
            monthly_existing_debt_pln: number;
            /**
             * Monthly Housing Costs Pln
             * @default 0
             */
            monthly_housing_costs_pln: number;
            /**
             * Insurance Monthly Pln
             * @default 0
             */
            insurance_monthly_pln: number;
            /**
             * Notary Fee Pln
             * @default 5000
             */
            notary_fee_pln: number;
            /**
             * Court Fees Pln
             * @default 400
             */
            court_fees_pln: number;
            /**
             * Bank Commission Pct
             * @default 0
             */
            bank_commission_pct: number;
            /**
             * Agent Commission Pct
             * @default 0
             */
            agent_commission_pct: number;
            /**
             * Renovation Budget Pln
             * @default 0
             */
            renovation_budget_pln: number;
            /**
             * Include Pcc
             * @default true
             */
            include_pcc: boolean;
        };
        /** MortgageCalculationResult */
        MortgageCalculationResult: {
            costs: components["schemas"]["MortgageCostBreakdown"];
            base_scenario: components["schemas"]["MortgageScenario"];
            /** Scenarios */
            scenarios: components["schemas"]["MortgageScenario"][];
            affordability: components["schemas"]["MortgageAffordability"];
            /** Notes */
            notes: string[];
            /** Disclaimer */
            disclaimer: string;
            legal_context: components["schemas"]["MortgageLegalContext"];
        };
        /** MortgageCostBreakdown */
        MortgageCostBreakdown: {
            /** Property Price Pln */
            property_price_pln: number;
            /** Down Payment Pln */
            down_payment_pln: number;
            /** Down Payment Pct */
            down_payment_pct: number;
            /** Loan Amount Pln */
            loan_amount_pln: number;
            /** Loan To Value Pct */
            loan_to_value_pct: number;
            /** Pcc Tax Pln */
            pcc_tax_pln: number;
            /** Notary Fee Pln */
            notary_fee_pln: number;
            /** Court Fees Pln */
            court_fees_pln: number;
            /** Bank Commission Pln */
            bank_commission_pln: number;
            /** Agent Commission Pln */
            agent_commission_pln: number;
            /** Renovation Budget Pln */
            renovation_budget_pln: number;
            /** Upfront Cash Needed Pln */
            upfront_cash_needed_pln: number;
        };
        /** MortgageLegalContext */
        MortgageLegalContext: {
            /** Checked At */
            checked_at: string;
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url: string;
        };
        /** MortgageScenario */
        MortgageScenario: {
            /** Scenario Code */
            scenario_code: string;
            /** Label */
            label: string;
            /** Annual Interest Rate Pct */
            annual_interest_rate_pct: number;
            /** Loan Years */
            loan_years: number;
            /** Monthly Principal Interest Pln */
            monthly_principal_interest_pln: number;
            /** Monthly Total Payment Pln */
            monthly_total_payment_pln: number;
            /** Total Interest Pln */
            total_interest_pln: number;
            /** Total Repaid Pln */
            total_repaid_pln: number;
            /** Debt To Income Pct */
            debt_to_income_pct?: number | null;
        };
        /** MunicipalityReference */
        MunicipalityReference: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Country Code */
            country_code: string;
            /** Region */
            region?: string | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** NewsArticle */
        NewsArticle: {
            /** Id */
            id: string;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            data_provenance?: components["schemas"]["DataProvenance"];
            /**
             * Category
             * @enum {string}
             */
            category: "market" | "mortgage" | "tax" | "legal" | "developer" | "city_investment" | "transport" | "mpzp";
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url?: string | null;
            /**
             * Published At
             * Format: date-time
             */
            published_at: string;
            /** Affected Area Ids */
            affected_area_ids?: string[];
            /** Affected Districts */
            affected_districts?: string[];
            /** Price Impact Hypothesis */
            price_impact_hypothesis?: string | null;
            /** Audience Relevance */
            audience_relevance?: ("buyer" | "realtor" | "investor")[];
            /**
             * Impact Level
             * @enum {string}
             */
            impact_level: "positive" | "neutral" | "negative" | "mixed" | "unknown";
            /** Tags */
            tags?: string[];
            /** Is Published */
            is_published: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Body */
            body: string;
        };
        /** NewsArticleAISummary */
        NewsArticleAISummary: {
            /**
             * Subject Type
             * @default news
             * @enum {string}
             */
            subject_type: "listing" | "user_submitted_draft" | "area" | "report" | "compare" | "news";
            /** Subject Id */
            subject_id: string;
            /** Article Id */
            article_id: string;
            /**
             * Category
             * @enum {string}
             */
            category: "market" | "mortgage" | "tax" | "legal" | "developer" | "city_investment" | "transport" | "mpzp";
            /** Headline */
            headline: string;
            /** Summary */
            summary: string;
            /** Key Points */
            key_points?: string[];
            /** Area Impact */
            area_impact?: string[];
            /** Buyer Notes */
            buyer_notes?: string[];
            /** Investor Notes */
            investor_notes?: string[];
            /** Citations */
            citations?: components["schemas"]["AIAnswerCitation"][];
            /** Guardrails */
            guardrails?: components["schemas"]["AIAnswerGuardrail"][];
            /** Provider */
            provider: string;
            /** Model Name */
            model_name: string;
            /** Prompt Version */
            prompt_version: string;
            /** Usage Log Id */
            usage_log_id?: string | null;
            /** Input Hash */
            input_hash: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** NewsArticleCreate */
        NewsArticleCreate: {
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /** Body */
            body: string;
            /**
             * Category
             * @default market
             * @enum {string}
             */
            category: "market" | "mortgage" | "tax" | "legal" | "developer" | "city_investment" | "transport" | "mpzp";
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url?: string | null;
            /**
             * Published At
             * Format: date-time
             */
            published_at: string;
            /** Affected Area Ids */
            affected_area_ids?: string[];
            /** Affected Districts */
            affected_districts?: string[];
            /** Price Impact Hypothesis */
            price_impact_hypothesis?: string | null;
            /** Audience Relevance */
            audience_relevance?: ("buyer" | "realtor" | "investor")[];
            /**
             * Impact Level
             * @default unknown
             * @enum {string}
             */
            impact_level: "positive" | "neutral" | "negative" | "mixed" | "unknown";
            /** Tags */
            tags?: string[];
            /**
             * Is Published
             * @default true
             */
            is_published: boolean;
        };
        /** NewsArticleListItem */
        NewsArticleListItem: {
            /** Id */
            id: string;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            data_provenance?: components["schemas"]["DataProvenance"];
            /**
             * Category
             * @enum {string}
             */
            category: "market" | "mortgage" | "tax" | "legal" | "developer" | "city_investment" | "transport" | "mpzp";
            /** Source Name */
            source_name: string;
            /** Source Url */
            source_url?: string | null;
            /**
             * Published At
             * Format: date-time
             */
            published_at: string;
            /** Affected Area Ids */
            affected_area_ids?: string[];
            /** Affected Districts */
            affected_districts?: string[];
            /** Price Impact Hypothesis */
            price_impact_hypothesis?: string | null;
            /** Audience Relevance */
            audience_relevance?: ("buyer" | "realtor" | "investor")[];
            /**
             * Impact Level
             * @enum {string}
             */
            impact_level: "positive" | "neutral" | "negative" | "mixed" | "unknown";
            /** Tags */
            tags?: string[];
            /** Is Published */
            is_published: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** NewsArticleUpdate */
        NewsArticleUpdate: {
            /** Title */
            title?: string | null;
            /** Summary */
            summary?: string | null;
            /** Body */
            body?: string | null;
            /** Category */
            category?: ("market" | "mortgage" | "tax" | "legal" | "developer" | "city_investment" | "transport" | "mpzp") | null;
            /** Source Name */
            source_name?: string | null;
            /** Source Url */
            source_url?: string | null;
            /** Published At */
            published_at?: string | null;
            /** Affected Area Ids */
            affected_area_ids?: string[] | null;
            /** Affected Districts */
            affected_districts?: string[] | null;
            /** Price Impact Hypothesis */
            price_impact_hypothesis?: string | null;
            /** Audience Relevance */
            audience_relevance?: ("buyer" | "realtor" | "investor")[] | null;
            /** Impact Level */
            impact_level?: ("positive" | "neutral" | "negative" | "mixed" | "unknown") | null;
            /** Tags */
            tags?: string[] | null;
            /** Is Published */
            is_published?: boolean | null;
        };
        /** ObjectReport */
        ObjectReport: {
            /** Listing Id */
            listing_id: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /** Template Code */
            template_code: string;
            /** Template Name */
            template_name: string;
            branding?: components["schemas"]["ReportBranding"] | null;
            buyer_decision?: components["schemas"]["BuyerDecisionPackage"] | null;
            /** Summary */
            summary: string;
            /** Sections */
            sections: components["schemas"]["ReportSection"][];
            /** Disclaimer */
            disclaimer: string;
        };
        /** ObjectWatchCreate */
        ObjectWatchCreate: {
            /** Name */
            name?: string | null;
            /** Triggers */
            triggers?: ("price_change" | "cheaper_comparable" | "days_on_market_threshold" | "planned_investment_status" | "developer_signal" | "negotiation_opportunity")[];
            /**
             * Channel
             * @default email
             * @enum {string}
             */
            channel: "email" | "telegram";
            /**
             * Frequency
             * @default daily
             * @enum {string}
             */
            frequency: "instant" | "daily" | "weekly";
            /** Delivery Target */
            delivery_target?: string | null;
        };
        /** ObjectWatchEvent */
        ObjectWatchEvent: {
            /**
             * Trigger Type
             * @enum {string}
             */
            trigger_type: "price_change" | "cheaper_comparable" | "days_on_market_threshold" | "planned_investment_status" | "developer_signal" | "negotiation_opportunity";
            /**
             * Severity
             * @enum {string}
             */
            severity: "info" | "watch" | "opportunity" | "risk";
            /** Listing Id */
            listing_id?: string | null;
            /** Related Listing Id */
            related_listing_id?: string | null;
            /** Title */
            title: string;
            /** Summary */
            summary: string;
            /** Baseline Value */
            baseline_value?: string | null;
            /** Current Value */
            current_value?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** OpenDataRoadmapItem */
        OpenDataRoadmapItem: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Provider */
            provider: string;
            /**
             * Country Code
             * @default PL
             */
            country_code: string;
            /** Region */
            region?: string | null;
            /** Domains */
            domains?: string[];
            /**
             * Source Type
             * @default official_open_data
             */
            source_type: string;
            /** Access Method */
            access_method: string;
            /** Ingestion Method */
            ingestion_method: string;
            /** Documentation Url */
            documentation_url: string;
            /** Data Url */
            data_url?: string | null;
            /** License */
            license?: string | null;
            /**
             * Legal Status
             * @default review_required
             * @enum {string}
             */
            legal_status: "unknown" | "approved" | "review_required" | "blocked";
            /** Legal Notes */
            legal_notes?: string | null;
            /** Refresh Cadence */
            refresh_cadence: string;
            /** Priority */
            priority: number;
            /**
             * Status
             * @enum {string}
             */
            status: "candidate" | "ready_for_import" | "active" | "blocked" | "needs_legal_review";
            /** Target Tables */
            target_tables?: string[];
            /** Next Step */
            next_step: string;
            /** Risks */
            risks?: string[];
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** PaidBetaTracking */
        PaidBetaTracking: {
            /** Lead Source */
            lead_source?: string | null;
            /** Segment */
            segment?: string | null;
            /**
             * Payment Status
             * @default unpaid
             * @enum {string}
             */
            payment_status: "unpaid" | "paid" | "refunded" | "waived" | "unknown";
            /**
             * Price Paid Pln
             * @default 0
             */
            price_paid_pln: number;
            /**
             * Report Type
             * @default buyer_check
             * @enum {string}
             */
            report_type: "free_check" | "buyer_check" | "full_due_diligence" | "expert_review" | "realtor_bundle" | "realtor_pro" | "custom";
            /**
             * Decision Impact
             * @default pending
             * @enum {string}
             */
            decision_impact: "pending" | "viewed" | "skipped_viewing" | "negotiated_lower" | "requested_documents" | "rejected_object" | "bought" | "no_impact" | "unknown";
            /** Decision Impact Note */
            decision_impact_note?: string | null;
            /** Objections */
            objections?: string[];
            /** Missing Trust Data */
            missing_trust_data?: string[];
            /**
             * Refund Risk
             * @default unknown
             * @enum {string}
             */
            refund_risk: "low" | "medium" | "high" | "unknown";
            /** Next Follow Up Date */
            next_follow_up_date?: string | null;
            /** Expert Review Interest */
            expert_review_interest?: boolean | null;
            /**
             * Manual Qa Status
             * @default not_started
             * @enum {string}
             */
            manual_qa_status: "not_started" | "passed" | "needs_fix" | "failed";
            /** Manual Qa Notes */
            manual_qa_notes?: string | null;
        };
        /** PaidBetaTrackingRow */
        PaidBetaTrackingRow: {
            /** Referral Id */
            referral_id: string;
            /**
             * Referral Type
             * @enum {string}
             */
            referral_type: "mortgage" | "legal" | "renovation" | "buyer_beta" | "realtor_beta";
            /**
             * Status
             * @enum {string}
             */
            status: "new" | "contacted" | "qualified" | "closed" | "rejected";
            /** Contact Name */
            contact_name?: string | null;
            /** Contact Email */
            contact_email?: string | null;
            /** Contact Phone */
            contact_phone?: string | null;
            /** City */
            city: string;
            /** District */
            district?: string | null;
            /** Listing Id */
            listing_id?: string | null;
            /** Report Id */
            report_id?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            tracking: components["schemas"]["PaidBetaTracking"];
        };
        /** PaidBetaTrackingUpdate */
        PaidBetaTrackingUpdate: {
            /** Lead Source */
            lead_source?: string | null;
            /** Segment */
            segment?: string | null;
            /** Payment Status */
            payment_status?: ("unpaid" | "paid" | "refunded" | "waived" | "unknown") | null;
            /** Price Paid Pln */
            price_paid_pln?: number | null;
            /** Report Type */
            report_type?: ("free_check" | "buyer_check" | "full_due_diligence" | "expert_review" | "realtor_bundle" | "realtor_pro" | "custom") | null;
            /** Decision Impact */
            decision_impact?: ("pending" | "viewed" | "skipped_viewing" | "negotiated_lower" | "requested_documents" | "rejected_object" | "bought" | "no_impact" | "unknown") | null;
            /** Decision Impact Note */
            decision_impact_note?: string | null;
            /** Objections */
            objections?: string[] | null;
            /** Missing Trust Data */
            missing_trust_data?: string[] | null;
            /** Refund Risk */
            refund_risk?: ("low" | "medium" | "high" | "unknown") | null;
            /** Next Follow Up Date */
            next_follow_up_date?: string | null;
            /** Expert Review Interest */
            expert_review_interest?: boolean | null;
            /** Manual Qa Status */
            manual_qa_status?: ("not_started" | "passed" | "needs_fix" | "failed") | null;
            /** Manual Qa Notes */
            manual_qa_notes?: string | null;
        };
        /** PartnerCsvImportResponse */
        PartnerCsvImportResponse: {
            /** Rows Seen */
            rows_seen: number;
            /** Raw Created */
            raw_created: number;
            /** Raw Updated */
            raw_updated: number;
            /** Properties Created */
            properties_created: number;
            /** Properties Updated */
            properties_updated: number;
            /** Snapshots Created */
            snapshots_created: number;
            /** Snapshots Updated */
            snapshots_updated: number;
            /**
             * Removed Marked
             * @default 0
             */
            removed_marked: number;
            /** Dry Run */
            dry_run: boolean;
            /** Listing Ids */
            listing_ids?: string[];
            /** Errors */
            errors?: string[];
            job: components["schemas"]["IngestionJob"];
        };
        /** PartnerLeadScore */
        PartnerLeadScore: {
            referral: components["schemas"]["PartnerReferral"];
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /** Total Score */
            total_score: number;
            /**
             * Priority
             * @enum {string}
             */
            priority: "hot" | "warm" | "nurture" | "low_fit" | "disqualified";
            /**
             * Partner Fit
             * @enum {string}
             */
            partner_fit: "mortgage" | "legal" | "renovation" | "beta_sales" | "general";
            /** Qualification Status */
            qualification_status: string;
            /** Estimated Deal Value Pln */
            estimated_deal_value_pln?: number | null;
            /** Next Action Due Hours */
            next_action_due_hours: number;
            /** Routing Tags */
            routing_tags?: string[];
            /** Reasons */
            reasons?: string[];
            /** Risks */
            risks?: string[];
            /** Recommended Actions */
            recommended_actions?: string[];
            /** Components */
            components?: components["schemas"]["PartnerLeadScoreComponent"][];
            /** Disclaimer */
            disclaimer: string;
        };
        /** PartnerLeadScoreComponent */
        PartnerLeadScoreComponent: {
            /** Code */
            code: string;
            /** Label */
            label: string;
            /** Score */
            score: number;
            /** Weight */
            weight: number;
            /** Weighted Score */
            weighted_score: number;
            /** Reason */
            reason: string;
        };
        /** PartnerReferral */
        PartnerReferral: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /**
             * Referral Type
             * @enum {string}
             */
            referral_type: "mortgage" | "legal" | "renovation" | "buyer_beta" | "realtor_beta";
            /**
             * Status
             * @enum {string}
             */
            status: "new" | "contacted" | "qualified" | "closed" | "rejected";
            /** Source Context */
            source_context: string;
            /** Listing Id */
            listing_id?: string | null;
            /** Report Id */
            report_id?: string | null;
            /** City */
            city: string;
            /** District */
            district?: string | null;
            /** Contact Name */
            contact_name?: string | null;
            /** Contact Email */
            contact_email?: string | null;
            /** Contact Phone */
            contact_phone?: string | null;
            /** Message */
            message?: string | null;
            /** Consent To Contact */
            consent_to_contact: boolean;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /** Assigned To */
            assigned_to?: string | null;
            /** Partner Name */
            partner_name?: string | null;
            /** Notes */
            notes?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** PartnerReferralCreate */
        PartnerReferralCreate: {
            /**
             * Referral Type
             * @enum {string}
             */
            referral_type: "mortgage" | "legal" | "renovation" | "buyer_beta" | "realtor_beta";
            /**
             * Source Context
             * @default mortgage_calculator
             */
            source_context: string;
            /** Listing Id */
            listing_id?: string | null;
            /** Report Id */
            report_id?: string | null;
            /**
             * City
             * @default Wrocław
             */
            city: string;
            /** District */
            district?: string | null;
            /** Contact Name */
            contact_name?: string | null;
            /** Contact Email */
            contact_email?: string | null;
            /** Contact Phone */
            contact_phone?: string | null;
            /** Message */
            message?: string | null;
            /**
             * Consent To Contact
             * @default false
             */
            consent_to_contact: boolean;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** PartnerReferralUpdate */
        PartnerReferralUpdate: {
            /** Status */
            status?: ("new" | "contacted" | "qualified" | "closed" | "rejected") | null;
            /** Assigned To */
            assigned_to?: string | null;
            /** Partner Name */
            partner_name?: string | null;
            /** Notes */
            notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            } | null;
        };
        /** PaymentWebhookEvent */
        PaymentWebhookEvent: {
            /** Id */
            id: string;
            /**
             * Provider
             * @enum {string}
             */
            provider: "mock" | "stripe" | "payu";
            /** Provider Event Id */
            provider_event_id: string;
            /** Order Id */
            order_id?: string | null;
            /** Event Type */
            event_type: string;
            /**
             * Status
             * @enum {string}
             */
            status: "processed" | "duplicate" | "ignored" | "rejected";
            /** Payload Hash */
            payload_hash: string;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** PaymentWebhookResult */
        PaymentWebhookResult: {
            /**
             * Provider
             * @enum {string}
             */
            provider: "mock" | "stripe" | "payu";
            /** Provider Event Id */
            provider_event_id: string;
            /**
             * Status
             * @enum {string}
             */
            status: "processed" | "duplicate" | "ignored" | "rejected";
            /** Message */
            message: string;
            order?: components["schemas"]["ReportOrder"] | null;
            /** Generated Report Id */
            generated_report_id?: string | null;
            webhook_event: components["schemas"]["PaymentWebhookEvent"];
        };
        /** PlanLimits */
        PlanLimits: {
            /**
             * Plan
             * @enum {string}
             */
            plan: "free" | "buyer_pro" | "investor" | "realtor" | "agency" | "enterprise";
            /** Max Favorites */
            max_favorites: number;
            /** Max Alerts */
            max_alerts: number;
            /** Monthly Reports */
            monthly_reports: number;
            /** Max Compare Items */
            max_compare_items: number;
            /** Can Export */
            can_export: boolean;
            /** Can Use Api */
            can_use_api: boolean;
            /** Can White Label */
            can_white_label: boolean;
        };
        /** PlannedInvestment */
        PlannedInvestment: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Investment Type */
            investment_type: string;
            /** Status */
            status: string;
            /** City */
            city: string;
            /** District */
            district?: string | null;
            /** Expected Year */
            expected_year?: number | null;
            /** Lat */
            lat: number;
            /** Lon */
            lon: number;
            /** Source Url */
            source_url?: string | null;
            /** Confidence Score */
            confidence_score: number;
            /** Notes */
            notes?: string | null;
        };
        /** PlannedInvestmentCreate */
        PlannedInvestmentCreate: {
            /** Name */
            name: string;
            /** Investment Type */
            investment_type: string;
            /**
             * Status
             * @default planned
             */
            status: string;
            /** City */
            city: string;
            /** District */
            district?: string | null;
            /** Expected Year */
            expected_year?: number | null;
            /** Lat */
            lat: number;
            /** Lon */
            lon: number;
            /** Source Url */
            source_url?: string | null;
            /**
             * Confidence Score
             * @default 50
             */
            confidence_score: number;
            /** Notes */
            notes?: string | null;
        };
        /** PlannedInvestmentImpactItem */
        PlannedInvestmentImpactItem: {
            investment: components["schemas"]["PlannedInvestment"];
            /** Distance M */
            distance_m: number;
            /** Radius M */
            radius_m: number;
            /** Impact Weight */
            impact_weight: number;
        };
        /** PlannedInvestmentImportResponse */
        PlannedInvestmentImportResponse: {
            /** Rows Seen */
            rows_seen: number;
            /** Created */
            created: number;
            /** Updated */
            updated: number;
            /** Skipped */
            skipped: number;
            /** Dry Run */
            dry_run: boolean;
            /** Investment Ids */
            investment_ids?: string[];
            /** Source Ids */
            source_ids?: string[];
            /** Errors */
            errors?: string[];
            job: components["schemas"]["IngestionJob"];
        };
        /** PlannedInvestmentUpdate */
        PlannedInvestmentUpdate: {
            /** Name */
            name?: string | null;
            /** Investment Type */
            investment_type?: string | null;
            /** Status */
            status?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Expected Year */
            expected_year?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Source Url */
            source_url?: string | null;
            /** Confidence Score */
            confidence_score?: number | null;
            /** Notes */
            notes?: string | null;
        };
        /** PostViewingChecklistAnswers */
        PostViewingChecklistAnswers: {
            /**
             * Condition
             * @default unknown
             * @enum {string}
             */
            condition: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Windows
             * @default unknown
             * @enum {string}
             */
            windows: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Noise
             * @default unknown
             * @enum {string}
             */
            noise: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Smell
             * @default unknown
             * @enum {string}
             */
            smell: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Humidity
             * @default unknown
             * @enum {string}
             */
            humidity: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Staircase
             * @default unknown
             * @enum {string}
             */
            staircase: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Orientation
             * @default unknown
             * @enum {string}
             */
            orientation: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Kitchen Bathroom
             * @default unknown
             * @enum {string}
             */
            kitchen_bathroom: "unknown" | "good" | "minor_issue" | "major_issue";
            /**
             * Renovation Need
             * @default unknown
             * @enum {string}
             */
            renovation_need: "unknown" | "none" | "refresh" | "light" | "full";
            /** Notes */
            notes?: string | null;
        };
        /** PostViewingVerdictRecalculation */
        PostViewingVerdictRecalculation: {
            original_decision: components["schemas"]["BuyerDecisionPackage"];
            updated_decision: components["schemas"]["BuyerDecisionPackage"];
            checklist_answers: components["schemas"]["PostViewingChecklistAnswers"];
            /** Risk Adjustment Points */
            risk_adjustment_points: number;
            /** Offer Adjustment Pln */
            offer_adjustment_pln: number;
            /** Applied Findings */
            applied_findings?: string[];
            /** Recommended Actions */
            recommended_actions?: string[];
            /** Disclaimer */
            disclaimer: string;
        };
        /** PriceHistoryPoint */
        PriceHistoryPoint: {
            /**
             * Observed At
             * Format: date
             */
            observed_at: string;
            /** Price */
            price: number;
            /** Price Per M2 */
            price_per_m2: number;
        };
        /** PriceHistoryRebuildResult */
        PriceHistoryRebuildResult: {
            /** Property Sources Seen */
            property_sources_seen: number;
            /** Snapshots Seen */
            snapshots_seen: number;
            /** Snapshots Updated */
            snapshots_updated: number;
            /**
             * Listing Events Created
             * @default 0
             */
            listing_events_created: number;
        };
        /** ProductionReadinessCheck */
        ProductionReadinessCheck: {
            /** Name */
            name: string;
            /**
             * Status
             * @enum {string}
             */
            status: "pass" | "warn" | "fail";
            /**
             * Severity
             * @enum {string}
             */
            severity: "info" | "warning" | "critical";
            /** Message */
            message: string;
            /** Remediation */
            remediation?: string | null;
        };
        /** ProductionReadinessReport */
        ProductionReadinessReport: {
            /**
             * Status
             * @enum {string}
             */
            status: "ready" | "degraded" | "blocked";
            /** Environment */
            environment: string;
            /** Check Count */
            check_count: number;
            /** Failed Count */
            failed_count: number;
            /** Warning Count */
            warning_count: number;
            /** Checks */
            checks: components["schemas"]["ProductionReadinessCheck"][];
        };
        /** PropertyDeduplicationMatch */
        PropertyDeduplicationMatch: {
            /** Id */
            id: number;
            /** Job Id */
            job_id?: string | null;
            /** Source Name */
            source_name: string;
            /** Source Listing Id */
            source_listing_id: string;
            /** Candidate Property Id */
            candidate_property_id?: number | null;
            /** Matched Property Id */
            matched_property_id?: number | null;
            /**
             * Decision
             * @enum {string}
             */
            decision: "matched" | "review_required" | "rejected";
            /**
             * Review Status
             * @enum {string}
             */
            review_status: "open" | "auto_resolved";
            /** Match Score */
            match_score: number;
            /** Reasons */
            reasons?: string[];
            /** Incoming Payload */
            incoming_payload?: {
                [key: string]: unknown;
            };
            /** Candidate Payload */
            candidate_payload?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** PropertyDeduplicationMatchUpdate */
        PropertyDeduplicationMatchUpdate: {
            /**
             * Review Status
             * @enum {string}
             */
            review_status: "open" | "auto_resolved";
        };
        /** PropertyDueDiligence */
        PropertyDueDiligence: {
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Score */
            score: number;
            /** Label */
            label: string;
            /** Red Flags */
            red_flags?: string[];
            /** Unknowns */
            unknowns?: string[];
            /** Documents To Request */
            documents_to_request?: string[];
            /** Questions For Seller */
            questions_for_seller?: string[];
            /** Checklist */
            checklist?: components["schemas"]["DueDiligenceChecklistItem"][];
            /** Disclaimer */
            disclaimer: string;
        };
        /** PropertyScores */
        PropertyScores: {
            /** Formula Version */
            formula_version: string;
            /** Weights Profile */
            weights_profile: string;
            /**
             * Decision Label
             * @enum {string}
             */
            decision_label: "strong_candidate" | "good_option" | "fair_option" | "overpriced" | "risky" | "weak_fit";
            /**
             * Price Label
             * @enum {string}
             */
            price_label: "below_fair" | "fair" | "above_fair" | "overpriced";
            /**
             * Risk Label
             * @enum {string}
             */
            risk_label: "low_risk" | "moderate_risk" | "elevated_risk" | "high_risk";
            /**
             * Negotiation Label
             * @enum {string}
             */
            negotiation_label: "weak_negotiation" | "some_negotiation" | "negotiable" | "strong_negotiation";
            /**
             * Liquidity Label
             * @enum {string}
             */
            liquidity_label: "weak" | "moderate" | "good" | "strong";
            /**
             * Rental Potential Label
             * @enum {string}
             */
            rental_potential_label: "weak" | "moderate" | "good" | "strong";
            /** Investment Score */
            investment_score: number;
            /** Risk Score */
            risk_score: number;
            /** Negotiation Score */
            negotiation_score: number;
            /** Liquidity Score */
            liquidity_score: number;
            /** Rental Potential Score */
            rental_potential_score: number;
            /** Fair Price Low */
            fair_price_low: number;
            /** Fair Price Mid */
            fair_price_mid: number;
            /** Fair Price High */
            fair_price_high: number;
            /** Fair Price Confidence Score */
            fair_price_confidence_score: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            breakdown: components["schemas"]["ScoreBreakdown"];
            /** Reasons */
            reasons: string[];
            /** Warnings */
            warnings: string[];
            explainability?: components["schemas"]["ScoreExplainability"];
        };
        /** RawListingSummary */
        RawListingSummary: {
            /** Id */
            id: number | string;
            /** Source Name */
            source_name: string;
            /** Source Listing Id */
            source_listing_id: string;
            /** Source Url */
            source_url: string;
            /**
             * Fetched At
             * Format: date-time
             */
            fetched_at: string;
            /** Payload Hash */
            payload_hash: string;
            /** Raw Payload */
            raw_payload?: {
                [key: string]: unknown;
            };
        };
        /** RealtorClientShortlist */
        RealtorClientShortlist: {
            /** Client Name */
            client_name?: string | null;
            /** Agent Name */
            agent_name?: string | null;
            /** Agent Email */
            agent_email?: string | null;
            /** Subject */
            subject: string;
            /** Summary */
            summary: string;
            /** Client Message */
            client_message: string;
            /** Items */
            items?: components["schemas"]["RealtorClientShortlistItem"][];
            comparison_summary: components["schemas"]["CompareSummary"];
            mortgage_assumptions: components["schemas"]["CompareMortgageAssumptions"];
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** RealtorClientShortlistItem */
        RealtorClientShortlistItem: {
            /** Listing Id */
            listing_id: string;
            /** Rank */
            rank: number;
            /** Title */
            title: string;
            /** Address */
            address: string;
            /** District */
            district: string;
            /** City */
            city: string;
            /** Price */
            price: number;
            /** Currency */
            currency: string;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Decision Score */
            decision_score: number;
            /**
             * Decision Label
             * @enum {string}
             */
            decision_label: "strong_candidate" | "good_option" | "fair_option" | "overpriced" | "risky" | "weak_fit";
            /** Fair Price Mid */
            fair_price_mid: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /** Estimated Monthly Payment Pln */
            estimated_monthly_payment_pln: number;
            /** Upfront Cash Needed Pln */
            upfront_cash_needed_pln: number;
            /** Estimated Monthly Rent Pln */
            estimated_monthly_rent_pln: number;
            /** Estimated Gross Rental Yield Pct */
            estimated_gross_rental_yield_pct: number;
            /** Recommendation */
            recommendation: string;
            /** Client Pitch */
            client_pitch: string;
            /** Talking Points */
            talking_points?: string[];
            /** Cautions */
            cautions?: string[];
            /** Source Url */
            source_url?: string | null;
        };
        /** RealtorClientShortlistRequest */
        RealtorClientShortlistRequest: {
            /** Listing Ids */
            listing_ids: string[];
            /** Client Name */
            client_name?: string | null;
            /** Intro */
            intro?: string | null;
            /**
             * Include Source Links
             * @default false
             */
            include_source_links: boolean;
        };
        /** RealtorSavedSearchDigest */
        RealtorSavedSearchDigest: {
            alert: components["schemas"]["Alert"];
            /** Client Name */
            client_name?: string | null;
            /** Agent Name */
            agent_name?: string | null;
            /** Agent Email */
            agent_email?: string | null;
            /** Subject */
            subject: string;
            /** Summary */
            summary: string;
            /** Client Message */
            client_message: string;
            /** Total Matches */
            total_matches: number;
            /** Items */
            items?: components["schemas"]["RealtorSavedSearchDigestItem"][];
            /** Applied Filters */
            applied_filters: {
                [key: string]: unknown;
            };
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /** Disclaimer */
            disclaimer: string;
        };
        /** RealtorSavedSearchDigestItem */
        RealtorSavedSearchDigestItem: {
            /** Listing Id */
            listing_id: string;
            /** Title */
            title: string;
            /** Address */
            address: string;
            /** District */
            district: string;
            /** City */
            city: string;
            /** Price */
            price: number;
            /** Currency */
            currency: string;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Price Per M2 */
            price_per_m2: number;
            /** Fair Price Mid */
            fair_price_mid: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
            /**
             * Decision Label
             * @enum {string}
             */
            decision_label: "strong_candidate" | "good_option" | "fair_option" | "overpriced" | "risky" | "weak_fit";
            /** Negotiation Score */
            negotiation_score: number;
            /** Liquidity Score */
            liquidity_score: number;
            /** Rental Potential Score */
            rental_potential_score: number;
            /** Client Pitch */
            client_pitch: string;
            /** Talking Points */
            talking_points?: string[];
            /** Cautions */
            cautions?: string[];
            /** Source Url */
            source_url?: string | null;
        };
        /** RealtorSavedSearchDigestRequest */
        RealtorSavedSearchDigestRequest: {
            /** Client Name */
            client_name?: string | null;
            /** Intro */
            intro?: string | null;
            /**
             * Max Matches
             * @default 5
             */
            max_matches: number;
            /**
             * Include Source Links
             * @default false
             */
            include_source_links: boolean;
        };
        /** RentalCashflowScenario */
        RentalCashflowScenario: {
            /** Code */
            code: string;
            /** Label */
            label: string;
            /** Monthly Rent Pln */
            monthly_rent_pln: number;
            /** Vacancy Loss Pln */
            vacancy_loss_pln: number;
            /** Operating Costs Pln */
            operating_costs_pln: number;
            /** Mortgage Payment Pln */
            mortgage_payment_pln: number;
            /** Net Cashflow Monthly Pln */
            net_cashflow_monthly_pln: number;
            /** Annual Net Cashflow Pln */
            annual_net_cashflow_pln: number;
            /** Cash Invested Pln */
            cash_invested_pln: number;
            /** Gross Yield Pct */
            gross_yield_pct: number;
            /** Net Yield On Cash Pct */
            net_yield_on_cash_pct: number;
        };
        /** ReportBranding */
        ReportBranding: {
            /** Agency Name */
            agency_name?: string | null;
            /** Agent Name */
            agent_name?: string | null;
            /** Agent Email */
            agent_email?: string | null;
            /** Agent Phone */
            agent_phone?: string | null;
            /** Website Url */
            website_url?: string | null;
            /** Note */
            note?: string | null;
            /** Logo Url */
            logo_url?: string | null;
            /** Primary Color */
            primary_color?: string | null;
            /** Accent Color */
            accent_color?: string | null;
            /** Footer Text */
            footer_text?: string | null;
            /** Agency Disclaimer */
            agency_disclaimer?: string | null;
        };
        /** ReportEmailRequest */
        ReportEmailRequest: {
            /** Target Email */
            target_email?: string | null;
            /**
             * Dry Run
             * @default true
             */
            dry_run: boolean;
        };
        /** ReportEmailResult */
        ReportEmailResult: {
            /** Report Id */
            report_id: string;
            /** Provider */
            provider: string;
            /**
             * Status
             * @enum {string}
             */
            status: "dry_run" | "sent" | "skipped" | "failed";
            /** Target Email */
            target_email?: string | null;
            /** Subject */
            subject: string;
            /** Message */
            message: string;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** ReportOrder */
        ReportOrder: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Listing Id */
            listing_id: string;
            /**
             * Product Code
             * @enum {string}
             */
            product_code: "object_report" | "full_object_analysis" | "investor_report" | "area_report" | "report_bundle_5";
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /**
             * Report Format
             * @enum {string}
             */
            report_format: "json" | "html";
            /**
             * Status
             * @enum {string}
             */
            status: "unpaid" | "paid" | "fulfilled" | "canceled";
            /** Amount Grosz */
            amount_grosz: number;
            /**
             * Currency
             * @default PLN
             */
            currency: string;
            /** Checkout Url */
            checkout_url?: string | null;
            /** Generated Report Id */
            generated_report_id?: string | null;
            billing_details?: components["schemas"]["ReportOrderBillingDetails"] | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Paid At */
            paid_at?: string | null;
            /** Fulfilled At */
            fulfilled_at?: string | null;
        };
        /** ReportOrderBillingDetails */
        ReportOrderBillingDetails: {
            /**
             * Invoice Requested
             * @default false
             */
            invoice_requested: boolean;
            /**
             * Customer Type
             * @default company
             * @enum {string}
             */
            customer_type: "individual" | "company";
            /** Company Name */
            company_name?: string | null;
            /** Vat Id */
            vat_id?: string | null;
            /**
             * Country Code
             * @default PL
             */
            country_code: string;
            /** Street Address */
            street_address?: string | null;
            /** Postal Code */
            postal_code?: string | null;
            /** City */
            city?: string | null;
            /** Email */
            email?: string | null;
        };
        /** ReportOrderCreate */
        ReportOrderCreate: {
            /** Listing Id */
            listing_id: string;
            /**
             * Product Code
             * @default object_report
             * @enum {string}
             */
            product_code: "object_report" | "full_object_analysis" | "investor_report" | "area_report" | "report_bundle_5";
            /** Audience */
            audience?: ("buyer" | "realtor" | "investor") | null;
            /**
             * Report Format
             * @default html
             * @enum {string}
             */
            report_format: "json" | "html";
            billing_details?: components["schemas"]["ReportOrderBillingDetails"] | null;
        };
        /** ReportOrderEvent */
        ReportOrderEvent: {
            /** Id */
            id: string;
            /** Order Id */
            order_id: string;
            /** Owner Id */
            owner_id: string;
            /**
             * Event Type
             * @enum {string}
             */
            event_type: "order_created" | "checkout_created" | "payment_marked_paid" | "payment_webhook_processed" | "payment_webhook_ignored" | "report_fulfilled" | "fulfillment_skipped" | "payment_provider_error";
            /** Actor Id */
            actor_id?: string | null;
            /** Message */
            message?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** ReportProduct */
        ReportProduct: {
            /**
             * Code
             * @enum {string}
             */
            code: "object_report" | "full_object_analysis" | "investor_report" | "area_report" | "report_bundle_5";
            /** Title */
            title: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /** Amount Grosz */
            amount_grosz: number;
            /**
             * Currency
             * @default PLN
             */
            currency: string;
            /** Description */
            description: string;
            /** Features */
            features: string[];
        };
        /** ReportRequest */
        ReportRequest: {
            /** Listing Id */
            listing_id: string;
            /**
             * Audience
             * @default buyer
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            branding?: components["schemas"]["ReportBranding"] | null;
        };
        /** ReportSection */
        ReportSection: {
            /** Title */
            title: string;
            /** Items */
            items: string[];
        };
        /** ReportTemplateDescriptor */
        ReportTemplateDescriptor: {
            /** Code */
            code: string;
            /** Name */
            name: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            /** Description */
            description: string;
            /** Default Sections */
            default_sections: string[];
        };
        /** RuntimeContext */
        RuntimeContext: {
            /**
             * Data Mode
             * @enum {string}
             */
            data_mode: "live" | "demo";
            /** Demo Mode Enabled */
            demo_mode_enabled: boolean;
        };
        /** SchoolReference */
        SchoolReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Name */
            name: string;
            /** School Type */
            school_type: string;
            /** Operator Type */
            operator_type?: string | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Source Url */
            source_url?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** ScoreBreakdown */
        ScoreBreakdown: {
            /** Price Position */
            price_position: number;
            /** Area Trend */
            area_trend: number;
            /** Transport */
            transport: number;
            /** Future Infrastructure */
            future_infrastructure: number;
            /** Liquidity */
            liquidity: number;
            /** Lifestyle Infrastructure */
            lifestyle_infrastructure: number;
            /** Rental Potential */
            rental_potential: number;
            /** Data Quality */
            data_quality: number;
            /** Risk Penalty */
            risk_penalty: number;
        };
        /** ScoreDriver */
        ScoreDriver: {
            /** Code */
            code: string;
            /**
             * Direction
             * @enum {string}
             */
            direction: "positive" | "negative" | "unknown";
        };
        /** ScoreExplainability */
        ScoreExplainability: {
            /**
             * Version
             * @default score-explanation-v1
             */
            version: string;
            /**
             * Coverage Score
             * @default 0
             */
            coverage_score: number;
            /** Drivers */
            drivers?: components["schemas"]["ScoreDriver"][];
            /** Missing Data Codes */
            missing_data_codes?: string[];
        };
        /** ScoringBacktestDriftSegment */
        ScoringBacktestDriftSegment: {
            /**
             * Segment Type
             * @enum {string}
             */
            segment_type: "area" | "period";
            /** Key */
            key: string;
            /** Label */
            label: string;
            /** Evaluated Points */
            evaluated_points: number;
            /** Mean Absolute Error Pct */
            mean_absolute_error_pct?: number | null;
            /** Median Absolute Error Pct */
            median_absolute_error_pct?: number | null;
            /** Within 10 Pct */
            within_10_pct?: number | null;
            /**
             * Severity
             * @enum {string}
             */
            severity: "healthy" | "watch" | "drift" | "critical";
            /** Trend Note */
            trend_note: string;
        };
        /** ScoringBacktestErrorBucket */
        ScoringBacktestErrorBucket: {
            /** Code */
            code: string;
            /** Label */
            label: string;
            /** Min Error Pct */
            min_error_pct: number;
            /** Max Error Pct */
            max_error_pct?: number | null;
            /** Evaluated Points */
            evaluated_points: number;
            /** Share Pct */
            share_pct: number;
            /** Mean Absolute Error Pct */
            mean_absolute_error_pct?: number | null;
            /** Overestimate Count */
            overestimate_count: number;
            /** Underestimate Count */
            underestimate_count: number;
        };
        /** ScoringBacktestItem */
        ScoringBacktestItem: {
            /** Listing Id */
            listing_id: string;
            /** Title */
            title: string;
            /** Area Id */
            area_id: string;
            /**
             * Observed At
             * Format: date
             */
            observed_at: string;
            /**
             * Target Observed At
             * Format: date
             */
            target_observed_at: string;
            /** Predicted Fair Price Mid */
            predicted_fair_price_mid: number;
            /** Actual Price */
            actual_price: number;
            /** Absolute Error Pct */
            absolute_error_pct: number;
            /** Formula Version */
            formula_version: string;
            /** Weights Profile */
            weights_profile: string;
        };
        /** ScoringBacktestReport */
        ScoringBacktestReport: {
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /**
             * Overall Severity
             * @enum {string}
             */
            overall_severity: "healthy" | "watch" | "drift" | "critical";
            /** Quality Label */
            quality_label: string;
            backtest: components["schemas"]["ScoringBacktestResult"];
            /** Error Buckets */
            error_buckets?: components["schemas"]["ScoringBacktestErrorBucket"][];
            /** Area Drift */
            area_drift?: components["schemas"]["ScoringBacktestDriftSegment"][];
            /** Period Drift */
            period_drift?: components["schemas"]["ScoringBacktestDriftSegment"][];
            /** High Error Examples */
            high_error_examples?: components["schemas"]["ScoringBacktestItem"][];
            /** Findings */
            findings?: string[];
            /** Recommendations */
            recommendations?: string[];
            /** Methodology Note */
            methodology_note: string;
        };
        /** ScoringBacktestResult */
        ScoringBacktestResult: {
            /** Formula Version */
            formula_version: string;
            /** Weights Profile */
            weights_profile: string;
            /** Listings Seen */
            listings_seen: number;
            /** Listings Evaluated */
            listings_evaluated: number;
            /** Evaluated Points */
            evaluated_points: number;
            /** Mean Absolute Error Pct */
            mean_absolute_error_pct?: number | null;
            /** Median Absolute Error Pct */
            median_absolute_error_pct?: number | null;
            /** Within 5 Pct */
            within_5_pct?: number | null;
            /** Within 10 Pct */
            within_10_pct?: number | null;
            /** Items */
            items?: components["schemas"]["ScoringBacktestItem"][];
        };
        /** ScoringServiceComparable */
        ScoringServiceComparable: {
            /** Listing Id */
            listing_id: string;
            /** Title */
            title: string;
            /** Address */
            address: string;
            /** City */
            city: string;
            /** District */
            district: string;
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Price */
            price: number;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Price Per M2 */
            price_per_m2: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /** Price Delta To Subject Pct */
            price_delta_to_subject_pct: number;
            /** Price Per M2 Delta To Subject Pct */
            price_per_m2_delta_to_subject_pct: number;
        };
        /** ScoringServiceRequest */
        ScoringServiceRequest: {
            /** External Reference */
            external_reference?: string | null;
            /** Title */
            title?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Address */
            address: string;
            /**
             * City
             * @default Wrocław
             */
            city: string;
            /** District */
            district: string;
            /**
             * Market Type
             * @default secondary
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Price */
            price: number;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Distance To Center Km */
            distance_to_center_km?: number | null;
            /** Nearest Stop M */
            nearest_stop_m?: number | null;
            /** Nearest School M */
            nearest_school_m?: number | null;
            /** Nearest Major Road M */
            nearest_major_road_m?: number | null;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m?: number | null;
            /** Parks Within 1Km */
            parks_within_1km?: number | null;
            /** Schools Within 1Km */
            schools_within_1km?: number | null;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km?: number | null;
            /**
             * Audience
             * @default investor
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor" | "underwriting" | "developer";
        };
        /** ScoringServiceResult */
        ScoringServiceResult: {
            /** Request Id */
            request_id: string;
            /**
             * Generated At
             * Format: date-time
             */
            generated_at: string;
            /**
             * Audience
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor" | "underwriting" | "developer";
            /**
             * Persisted
             * @default false
             */
            persisted: boolean;
            input: components["schemas"]["ScoringServiceRequest"];
            /** Confidence Score */
            confidence_score: number;
            scores: components["schemas"]["PropertyScores"];
            valuation: components["schemas"]["ScoringServiceValuation"];
            area_statistics: components["schemas"]["AreaStatistics"];
            developer_reputation?: components["schemas"]["DeveloperReputation"] | null;
            /** Comparables */
            comparables?: components["schemas"]["ScoringServiceComparable"][];
            /** Decision Summary */
            decision_summary: string;
            /** Key Findings */
            key_findings?: string[];
            /** Risk Flags */
            risk_flags?: string[];
            /** Recommended Actions */
            recommended_actions?: string[];
            /** Data Quality Notes */
            data_quality_notes?: string[];
            /** Methodology Notes */
            methodology_notes?: string[];
            /** Disclaimer */
            disclaimer: string;
        };
        /** ScoringServiceValuation */
        ScoringServiceValuation: {
            /** Asking Price */
            asking_price: number;
            /** Price Per M2 */
            price_per_m2: number;
            /** Fair Price Low */
            fair_price_low: number;
            /** Fair Price Mid */
            fair_price_mid: number;
            /** Fair Price High */
            fair_price_high: number;
            /** Fair Price Confidence Score */
            fair_price_confidence_score: number;
            /** Price Delta To Fair Mid Pct */
            price_delta_to_fair_mid_pct: number;
        };
        /** SourceCheckJob */
        SourceCheckJob: {
            /** Id */
            id: string;
            /** Source Id */
            source_id?: string | null;
            /** Source Name */
            source_name: string;
            /** Source Type */
            source_type: string;
            /**
             * Check Type
             * @enum {string}
             */
            check_type: "robots_txt" | "terms_review" | "connectivity" | "partner_feed" | "one_off_user_url" | "manual_review";
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "succeeded" | "failed" | "blocked";
            /** Target Domain */
            target_domain?: string | null;
            /** Target Url Hash */
            target_url_hash?: string | null;
            /** Created By */
            created_by: string;
            /** Scheduled For */
            scheduled_for?: string | null;
            /** Started At */
            started_at?: string | null;
            /** Finished At */
            finished_at?: string | null;
            /** Notes */
            notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /** Result */
            result?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** SourceCheckJobCreate */
        SourceCheckJobCreate: {
            /** Source Id */
            source_id?: string | null;
            /** Source Name */
            source_name: string;
            /**
             * Source Type
             * @default portal
             */
            source_type: string;
            /**
             * Check Type
             * @default manual_review
             * @enum {string}
             */
            check_type: "robots_txt" | "terms_review" | "connectivity" | "partner_feed" | "one_off_user_url" | "manual_review";
            /**
             * Status
             * @default queued
             * @enum {string}
             */
            status: "queued" | "running" | "succeeded" | "failed" | "blocked";
            /** Target Domain */
            target_domain?: string | null;
            /** Target Url Hash */
            target_url_hash?: string | null;
            /**
             * Created By
             * @default system
             */
            created_by: string;
            /** Scheduled For */
            scheduled_for?: string | null;
            /** Notes */
            notes?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** SourceError */
        SourceError: {
            /** Id */
            id: string;
            /** Source Id */
            source_id?: string | null;
            /** Source Name */
            source_name: string;
            /** Source Type */
            source_type: string;
            /** Source Check Job Id */
            source_check_job_id?: string | null;
            /** Ingestion Job Id */
            ingestion_job_id?: string | null;
            /**
             * Severity
             * @enum {string}
             */
            severity: "info" | "warning" | "error";
            /**
             * Status
             * @enum {string}
             */
            status: "open" | "retry_scheduled" | "resolved" | "ignored";
            /** Error Code */
            error_code: string;
            /** Message */
            message: string;
            /** Retryable */
            retryable: boolean;
            /** Retry Count */
            retry_count: number;
            /** Next Retry At */
            next_retry_at?: string | null;
            /** Last Retry Job Id */
            last_retry_job_id?: string | null;
            /** Resolved At */
            resolved_at?: string | null;
            /** Resolved By */
            resolved_by?: string | null;
            /** Resolution Note */
            resolution_note?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** SourceErrorCreate */
        SourceErrorCreate: {
            /** Source Id */
            source_id?: string | null;
            /** Source Name */
            source_name: string;
            /**
             * Source Type
             * @default portal
             */
            source_type: string;
            /** Source Check Job Id */
            source_check_job_id?: string | null;
            /** Ingestion Job Id */
            ingestion_job_id?: string | null;
            /**
             * Severity
             * @default error
             * @enum {string}
             */
            severity: "info" | "warning" | "error";
            /**
             * Status
             * @default open
             * @enum {string}
             */
            status: "open" | "retry_scheduled" | "resolved" | "ignored";
            /** Error Code */
            error_code: string;
            /** Message */
            message: string;
            /**
             * Retryable
             * @default true
             */
            retryable: boolean;
            /** Next Retry At */
            next_retry_at?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** SourceErrorRetryResult */
        SourceErrorRetryResult: {
            error: components["schemas"]["SourceError"];
            retry_job: components["schemas"]["SourceCheckJob"];
        };
        /** SourceErrorUpdate */
        SourceErrorUpdate: {
            /** Status */
            status?: ("open" | "retry_scheduled" | "resolved" | "ignored") | null;
            /** Retryable */
            retryable?: boolean | null;
            /** Next Retry At */
            next_retry_at?: string | null;
            /** Resolved By */
            resolved_by?: string | null;
            /** Resolution Note */
            resolution_note?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            } | null;
        };
        /** SourceReferencePreview */
        SourceReferencePreview: {
            /** Source Url Private */
            source_url_private: string;
            /** Source Domain */
            source_domain?: string | null;
            /**
             * Provider
             * @enum {string}
             */
            provider: "otodom" | "olx" | "other";
            /** Provider Label */
            provider_label: string;
            /** Listing Reference Id */
            listing_reference_id?: string | null;
            /** Source Slug */
            source_slug?: string | null;
            /** Suggested Title */
            suggested_title?: string | null;
            /** Manual Fields Required */
            manual_fields_required: string[];
            /** Manual Fields Recommended */
            manual_fields_recommended: string[];
            /** Privacy Note */
            privacy_note: string;
            /** Warnings */
            warnings?: string[];
        };
        /** SourceReferencePreviewRequest */
        SourceReferencePreviewRequest: {
            /** Source Url */
            source_url: string;
        };
        /** SourceRegistryEntry */
        SourceRegistryEntry: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /** Source Type */
            source_type: string;
            /** Base Url */
            base_url?: string | null;
            /**
             * Legal Status
             * @default unknown
             * @enum {string}
             */
            legal_status: "unknown" | "approved" | "review_required" | "blocked";
            /**
             * Refresh Cadence
             * @default manual
             */
            refresh_cadence: string;
            /**
             * Owner
             * @default internal
             */
            owner: string;
            /**
             * Ingestion Method
             * @default manual
             */
            ingestion_method: string;
            /** Allowed Use */
            allowed_use?: string[];
            /** Robots Txt Url */
            robots_txt_url?: string | null;
            /** Terms Url */
            terms_url?: string | null;
            /** Notes */
            notes?: string | null;
            /** Raw Payload Retention Days */
            raw_payload_retention_days?: number | null;
            /** Private Url Retention Days */
            private_url_retention_days?: number | null;
            /** Retention Notes */
            retention_notes?: string | null;
            /**
             * Is Demo
             * @default false
             */
            is_demo: boolean;
            /**
             * Is Active
             * @default true
             */
            is_active: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** SourceRegistryEntryCreate */
        SourceRegistryEntryCreate: {
            /** Name */
            name: string;
            /**
             * Source Type
             * @default partner_csv
             */
            source_type: string;
            /** Base Url */
            base_url?: string | null;
            /**
             * Legal Status
             * @default review_required
             * @enum {string}
             */
            legal_status: "unknown" | "approved" | "review_required" | "blocked";
            /**
             * Refresh Cadence
             * @default manual
             */
            refresh_cadence: string;
            /**
             * Owner
             * @default internal
             */
            owner: string;
            /**
             * Ingestion Method
             * @default partner_csv
             */
            ingestion_method: string;
            /** Allowed Use */
            allowed_use?: string[];
            /** Robots Txt Url */
            robots_txt_url?: string | null;
            /** Terms Url */
            terms_url?: string | null;
            /** Notes */
            notes?: string | null;
            /** Raw Payload Retention Days */
            raw_payload_retention_days?: number | null;
            /** Private Url Retention Days */
            private_url_retention_days?: number | null;
            /** Retention Notes */
            retention_notes?: string | null;
            /**
             * Is Demo
             * @default false
             */
            is_demo: boolean;
            /**
             * Is Active
             * @default true
             */
            is_active: boolean;
        };
        /** SourceRegistryEntryUpdate */
        SourceRegistryEntryUpdate: {
            /** Name */
            name?: string | null;
            /** Source Type */
            source_type?: string | null;
            /** Base Url */
            base_url?: string | null;
            /** Legal Status */
            legal_status?: ("unknown" | "approved" | "review_required" | "blocked") | null;
            /** Refresh Cadence */
            refresh_cadence?: string | null;
            /** Owner */
            owner?: string | null;
            /** Ingestion Method */
            ingestion_method?: string | null;
            /** Allowed Use */
            allowed_use?: string[] | null;
            /** Robots Txt Url */
            robots_txt_url?: string | null;
            /** Terms Url */
            terms_url?: string | null;
            /** Notes */
            notes?: string | null;
            /** Raw Payload Retention Days */
            raw_payload_retention_days?: number | null;
            /** Private Url Retention Days */
            private_url_retention_days?: number | null;
            /** Retention Notes */
            retention_notes?: string | null;
            /** Is Demo */
            is_demo?: boolean | null;
            /** Is Active */
            is_active?: boolean | null;
        };
        /** SourceRetentionPruneResult */
        SourceRetentionPruneResult: {
            /** Dry Run */
            dry_run: boolean;
            /** Source Name */
            source_name?: string | null;
            /** Sources Checked */
            sources_checked: number;
            /** Raw Listings Seen */
            raw_listings_seen: number;
            /** Raw Payloads Pruned */
            raw_payloads_pruned: number;
            /** Item Ids */
            item_ids?: string[];
            /** Cutoff By Source */
            cutoff_by_source?: {
                [key: string]: string;
            };
        };
        /** SourceUrlImportFields */
        SourceUrlImportFields: {
            /** Title */
            title?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Address */
            address?: string | null;
            /** City */
            city?: string | null;
            /** District */
            district?: string | null;
            /** Market Type */
            market_type?: ("primary" | "secondary") | null;
            /** Price */
            price?: number | null;
            /** Area M2 */
            area_m2?: number | null;
            /** Rooms */
            rooms?: number | null;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
        };
        /** SourceUrlImportRequest */
        SourceUrlImportRequest: {
            /** Source Url */
            source_url: string;
            /**
             * Timeout Seconds
             * @default 8
             */
            timeout_seconds: number;
            /**
             * Consent Given
             * @default false
             */
            consent_given: boolean;
            /**
             * Consent Version
             * @default listing-import-v1
             */
            consent_version: string;
        };
        /** SourceUrlImportResult */
        SourceUrlImportResult: {
            reference_preview: components["schemas"]["SourceReferencePreview"];
            /**
             * Status
             * @enum {string}
             */
            status: "extracted" | "partial" | "failed" | "unsupported";
            fields: components["schemas"]["SourceUrlImportFields"];
            /** Fields Extracted */
            fields_extracted?: string[];
            /** Extraction Source */
            extraction_source?: string | null;
            /** Fetched At */
            fetched_at?: string | null;
            /** Fetch Status Code */
            fetch_status_code?: number | null;
            /** Warnings */
            warnings?: string[];
        };
        /** Subscription */
        Subscription: {
            /** Id */
            id: string;
            /** User Id */
            user_id: string;
            /**
             * Plan
             * @enum {string}
             */
            plan: "free" | "buyer_pro" | "investor" | "realtor" | "agency" | "enterprise";
            /**
             * Status
             * @enum {string}
             */
            status: "trialing" | "active" | "past_due" | "canceled";
            /** Current Period Start */
            current_period_start?: string | null;
            /** Current Period End */
            current_period_end?: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** SubscriptionUpdate */
        SubscriptionUpdate: {
            /** Plan */
            plan?: ("free" | "buyer_pro" | "investor" | "realtor" | "agency" | "enterprise") | null;
            /** Status */
            status?: ("trialing" | "active" | "past_due" | "canceled") | null;
        };
        /** TotalAcquisitionCost */
        TotalAcquisitionCost: {
            /** Purchase Price Pln */
            purchase_price_pln: number;
            /** Renovation Condition */
            renovation_condition?: string | null;
            /**
             * Renovation Budget Source
             * @default market_state_default
             */
            renovation_budget_source: string;
            /** Pcc Tax Pln */
            pcc_tax_pln: number;
            /** Notary And Court Pln */
            notary_and_court_pln: number;
            /** Bank Costs Pln */
            bank_costs_pln: number;
            /** Agent Commission Pln */
            agent_commission_pln: number;
            /** Renovation Estimate Pln */
            renovation_estimate_pln: number;
            /** Furniture Estimate Pln */
            furniture_estimate_pln: number;
            /** Transaction Costs Pln */
            transaction_costs_pln: number;
            /** Total Move In Cost Pln */
            total_move_in_cost_pln: number;
            /** Upfront Cash Needed Pln */
            upfront_cash_needed_pln: number;
            /** Ready To Move Alternative Price Pln */
            ready_to_move_alternative_price_pln?: number | null;
            /** Post Renovation Value Gap Pln */
            post_renovation_value_gap_pln?: number | null;
            /** Monthly Payment Baseline Pln */
            monthly_payment_baseline_pln: number;
            /** Notes */
            notes?: string[];
        };
        /** TransportRouteReference */
        TransportRouteReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Route Number */
            route_number: string;
            /** Route Name */
            route_name: string;
            /** Route Type */
            route_type: string;
            /** Operator */
            operator?: string | null;
            /**
             * Status
             * @default active
             */
            status: string;
            /** Stop Ids */
            stop_ids?: string[];
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** TransportStopReference */
        TransportStopReference: {
            /** Id */
            id: string;
            /** Municipality Id */
            municipality_id: string;
            /** Municipality Name */
            municipality_name: string;
            /** District Id */
            district_id?: string | null;
            /** District Name */
            district_name?: string | null;
            /** Name */
            name: string;
            /** Stop Type */
            stop_type: string;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Lines */
            lines?: string[];
            /** Source Url */
            source_url?: string | null;
            /** Metadata */
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** UserAccount */
        UserAccount: {
            /** Id */
            id: string;
            /** Email */
            email?: string | null;
            /** Display Name */
            display_name?: string | null;
            /**
             * Role
             * @enum {string}
             */
            role: "buyer" | "realtor" | "agency_admin" | "admin";
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** UserSubmittedListingAnalysis */
        UserSubmittedListingAnalysis: {
            analysis: components["schemas"]["ListingAnalysis"];
            /** Confidence Score */
            confidence_score: number;
            /** Source Url Private */
            source_url_private?: string | null;
            /** Source Domain */
            source_domain?: string | null;
            /** Warnings */
            warnings?: string[];
            /** Comparables Basis */
            comparables_basis: string;
            /** Retention Note */
            retention_note: string;
            /** Draft Id */
            draft_id?: string | null;
            /** Draft Expires At */
            draft_expires_at?: string | null;
        };
        /** UserSubmittedListingDraft */
        UserSubmittedListingDraft: {
            /** Id */
            id: string;
            /** Owner Id */
            owner_id: string;
            /** Listing Id */
            listing_id: string;
            /** Source Url Private */
            source_url_private?: string | null;
            /** Source Domain */
            source_domain?: string | null;
            /** Address */
            address: string;
            /** City */
            city: string;
            /** District */
            district: string;
            /**
             * Market Type
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Price */
            price: number;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Data Quality Score */
            data_quality_score: number;
            /** Confidence Score */
            confidence_score: number;
            /** Request Payload */
            request_payload?: {
                [key: string]: unknown;
            };
            /** Analysis Payload */
            analysis_payload?: {
                [key: string]: unknown;
            };
            /**
             * Expires At
             * Format: date-time
             */
            expires_at: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** UserSubmittedListingDraftPruneResult */
        UserSubmittedListingDraftPruneResult: {
            /** Deleted */
            deleted: number;
        };
        /** UserSubmittedListingReport */
        UserSubmittedListingReport: {
            analysis: components["schemas"]["UserSubmittedListingAnalysis"];
            report: components["schemas"]["ObjectReport"];
        };
        /** UserSubmittedListingReportRequest */
        UserSubmittedListingReportRequest: {
            /** Title */
            title?: string | null;
            /** Source Url */
            source_url?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Address */
            address: string;
            /**
             * City
             * @default Wrocław
             */
            city: string;
            /** District */
            district: string;
            /**
             * Market Type
             * @default secondary
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /**
             * Purchase Intent
             * @default unsure
             * @enum {string}
             */
            purchase_intent: "self" | "family" | "rental" | "investment" | "unsure";
            /** Renovation Condition */
            renovation_condition?: ("move_in_ready" | "refresh" | "light_renovation" | "full_renovation" | "shell_developer_standard" | "custom_budget") | null;
            /** Custom Renovation Budget Pln */
            custom_renovation_budget_pln?: number | null;
            /** Price */
            price: number;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Distance To Center Km */
            distance_to_center_km?: number | null;
            /** Nearest Stop M */
            nearest_stop_m?: number | null;
            /** Nearest School M */
            nearest_school_m?: number | null;
            /** Nearest Major Road M */
            nearest_major_road_m?: number | null;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m?: number | null;
            /** Parks Within 1Km */
            parks_within_1km?: number | null;
            /** Schools Within 1Km */
            schools_within_1km?: number | null;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km?: number | null;
            /** Confirm Private Analysis */
            confirm_private_analysis: boolean;
            /**
             * Save Private Draft
             * @default true
             */
            save_private_draft: boolean;
            /**
             * Retention Days
             * @default 30
             */
            retention_days: number;
            /**
             * Audience
             * @default buyer
             * @enum {string}
             */
            audience: "buyer" | "realtor" | "investor";
            branding?: components["schemas"]["ReportBranding"] | null;
        };
        /** UserSubmittedListingRequest */
        UserSubmittedListingRequest: {
            /** Title */
            title?: string | null;
            /** Source Url */
            source_url?: string | null;
            /** Developer Id */
            developer_id?: string | null;
            /** Developer Name */
            developer_name?: string | null;
            /** Investment Name */
            investment_name?: string | null;
            /** Primary Market Project Id */
            primary_market_project_id?: string | null;
            /** Address */
            address: string;
            /**
             * City
             * @default Wrocław
             */
            city: string;
            /** District */
            district: string;
            /**
             * Market Type
             * @default secondary
             * @enum {string}
             */
            market_type: "primary" | "secondary";
            /**
             * Purchase Intent
             * @default unsure
             * @enum {string}
             */
            purchase_intent: "self" | "family" | "rental" | "investment" | "unsure";
            /** Renovation Condition */
            renovation_condition?: ("move_in_ready" | "refresh" | "light_renovation" | "full_renovation" | "shell_developer_standard" | "custom_budget") | null;
            /** Custom Renovation Budget Pln */
            custom_renovation_budget_pln?: number | null;
            /** Price */
            price: number;
            /** Area M2 */
            area_m2: number;
            /** Rooms */
            rooms: number;
            /** Floor */
            floor?: number | null;
            /** Building Floors */
            building_floors?: number | null;
            /** Building Year */
            building_year?: number | null;
            /** Lat */
            lat?: number | null;
            /** Lon */
            lon?: number | null;
            /** Distance To Center Km */
            distance_to_center_km?: number | null;
            /** Nearest Stop M */
            nearest_stop_m?: number | null;
            /** Nearest School M */
            nearest_school_m?: number | null;
            /** Nearest Major Road M */
            nearest_major_road_m?: number | null;
            /** Nearest Industrial Zone M */
            nearest_industrial_zone_m?: number | null;
            /** Parks Within 1Km */
            parks_within_1km?: number | null;
            /** Schools Within 1Km */
            schools_within_1km?: number | null;
            /** Planned Investments Within 2Km */
            planned_investments_within_2km?: number | null;
            /** Confirm Private Analysis */
            confirm_private_analysis: boolean;
            /**
             * Save Private Draft
             * @default true
             */
            save_private_draft: boolean;
            /**
             * Retention Days
             * @default 30
             */
            retention_days: number;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
        /** ViewingAssistant */
        ViewingAssistant: {
            /**
             * Recommendation
             * @enum {string}
             */
            recommendation: "view" | "skip" | "verify_first";
            /** Positives */
            positives?: string[];
            /** Risks */
            risks?: string[];
            /** Seller Questions */
            seller_questions?: string[];
            /** Photos To Take */
            photos_to_take?: string[];
            /** Documents To Request */
            documents_to_request?: string[];
            /** Building Checks */
            building_checks?: string[];
            /** Surroundings Checks */
            surroundings_checks?: string[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}

export type $defs = Record<string, never>;

export interface operations {
    health_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    readiness_ready_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductionReadinessReport"];
                };
            };
        };
    };
    runtime_context_runtime_context_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RuntimeContext"];
                };
            };
        };
    };
    register_api_v1_auth_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthRegistration"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSession"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    login_api_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuthCredentials"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSession"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    session_api_v1_auth_session_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthSession"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    list_listings_api_v1_listings_get: {
        parameters: {
            query?: {
                /** @description Voivodeship slug or name */
                voivodeship?: string | null;
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
                /** @description Gmina or municipality name */
                municipality?: string | null;
                /** @description Address, district, title or source id */
                query?: string | null;
                rooms?: number | null;
                market_type?: ("primary" | "secondary") | null;
                min_price?: number | null;
                max_price?: number | null;
                min_price_per_m2?: number | null;
                max_price_per_m2?: number | null;
                min_area_m2?: number | null;
                max_area_m2?: number | null;
                /** @description Building type code */
                building_type?: string | null;
                /** @description Renovation/finish state code */
                renovation_state?: string | null;
                /** @description Require balcony flag */
                has_balcony?: boolean | null;
                /** @description Require terrace flag */
                has_terrace?: boolean | null;
                /** @description Require garden flag */
                has_garden?: boolean | null;
                /** @description Require elevator flag */
                has_elevator?: boolean | null;
                /** @description Parking type code */
                parking_type?: string | null;
                /** @description Heating type code */
                heating_type?: string | null;
                min_floor?: number | null;
                max_floor?: number | null;
                max_building_floors?: number | null;
                min_building_year?: number | null;
                max_building_year?: number | null;
                max_days_on_market?: number | null;
                max_distance_to_center_km?: number | null;
                max_nearest_stop_m?: number | null;
                max_nearest_school_m?: number | null;
                min_nearest_major_road_m?: number | null;
                min_nearest_industrial_zone_m?: number | null;
                min_investment_score?: number | null;
                max_risk_score?: number | null;
                min_negotiation_score?: number | null;
                min_liquidity_score?: number | null;
                min_rental_potential_score?: number | null;
                min_data_quality_score?: number | null;
                min_developer_reputation_score?: number | null;
                min_developer_confidence_score?: number | null;
                min_developer_completed_projects?: number | null;
                min_developer_active_projects?: number | null;
                require_developer_reputation?: boolean;
                exclude_developer_risk_signals?: boolean;
                lat?: number | null;
                lon?: number | null;
                radius_km?: number | null;
                sort?: "price_asc" | "price_desc" | "price_per_m2_asc" | "price_per_m2_desc" | "investment_score_desc" | "investment_score_asc" | "risk_score_asc" | "risk_score_desc" | "negotiation_score_desc" | "negotiation_score_asc" | "liquidity_score_desc" | "liquidity_score_asc" | "rental_potential_score_desc" | "rental_potential_score_asc" | "developer_reputation_score_desc" | "developer_reputation_score_asc" | "developer_confidence_score_desc" | "developer_confidence_score_asc" | "days_on_market_asc" | "days_on_market_desc" | "newest" | "oldest";
                page?: number;
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingSearchResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_hidden_gems_api_v1_listings_hidden_gems_get: {
        parameters: {
            query?: {
                /** @description Voivodeship slug or name */
                voivodeship?: string | null;
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
                /** @description Gmina or municipality name */
                municipality?: string | null;
                /** @description Address, district, title or source id */
                query?: string | null;
                rooms?: number | null;
                market_type?: ("primary" | "secondary") | null;
                max_price?: number | null;
                min_area_m2?: number | null;
                /** @description Building type code */
                building_type?: string | null;
                /** @description Renovation/finish state code */
                renovation_state?: string | null;
                /** @description Require balcony flag */
                has_balcony?: boolean | null;
                /** @description Require terrace flag */
                has_terrace?: boolean | null;
                /** @description Require garden flag */
                has_garden?: boolean | null;
                /** @description Require elevator flag */
                has_elevator?: boolean | null;
                /** @description Parking type code */
                parking_type?: string | null;
                /** @description Heating type code */
                heating_type?: string | null;
                min_floor?: number | null;
                max_floor?: number | null;
                max_building_floors?: number | null;
                min_building_year?: number | null;
                max_building_year?: number | null;
                max_distance_to_center_km?: number | null;
                max_nearest_stop_m?: number | null;
                max_nearest_school_m?: number | null;
                min_nearest_major_road_m?: number | null;
                min_nearest_industrial_zone_m?: number | null;
                max_price_delta_to_fair_mid_pct?: number;
                min_investment_score?: number;
                max_risk_score?: number;
                min_liquidity_score?: number;
                min_rental_potential_score?: number;
                min_data_quality_score?: number;
                min_developer_reputation_score?: number | null;
                min_developer_confidence_score?: number | null;
                min_developer_completed_projects?: number | null;
                min_developer_active_projects?: number | null;
                require_developer_reputation?: boolean;
                exclude_developer_risk_signals?: boolean;
                page?: number;
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HiddenGemsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_areas_api_v1_areas_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AreaStatistics"][];
                };
            };
        };
    };
    get_coverage_api_v1_coverage_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoverageMetadata"];
                };
            };
        };
    };
    compare_areas_api_v1_areas_compare_get: {
        parameters: {
            query?: {
                city?: string | null;
                sort?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AreaComparison"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_news_articles_api_v1_news_get: {
        parameters: {
            query?: {
                category?: ("market" | "mortgage" | "tax" | "legal" | "developer" | "city_investment" | "transport" | "mpzp") | null;
                area_id?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsArticleListItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_news_article_api_v1_news__article_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                article_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsArticle"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_news_article_api_v1_admin_news_articles_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewsArticleCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsArticle"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_news_article_api_v1_admin_news_articles__article_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                article_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewsArticleUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsArticle"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_developers_api_v1_developers_get: {
        parameters: {
            query?: {
                city?: string | null;
                min_reputation_score?: number | null;
                min_confidence_score?: number | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperRankingResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_developer_api_v1_developers__developer_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                developer_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperReputation"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_admin_developer_feed_api_v1_admin_developers_import_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_admin_developer_feed_api_v1_admin_developers_import_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperFeedImportResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upsert_admin_developer_profile_api_v1_admin_developers_profiles__developer_id__put: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                developer_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeveloperProfile"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperReputation"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_admin_developer_profile_api_v1_admin_developers_profiles__developer_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                developer_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upsert_admin_developer_project_api_v1_admin_developers_projects__project_id__put: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeveloperProject"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperProject"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_admin_developer_project_api_v1_admin_developers_projects__project_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                project_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upsert_admin_developer_alias_api_v1_admin_developers_aliases__alias_id__put: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alias_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeveloperAlias"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperAlias"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_admin_developer_alias_api_v1_admin_developers_aliases__alias_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alias_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upsert_admin_developer_quality_signal_api_v1_admin_developers_signals__signal_id__put: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                signal_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeveloperQualitySignal"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperQualitySignal"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_admin_developer_quality_signal_api_v1_admin_developers_signals__signal_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                signal_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_developer_quality_signal_moderation_api_v1_admin_developers_signals__signal_id__moderation_patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                signal_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeveloperQualitySignalModerationUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperQualitySignal"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_municipalities_api_v1_locations_municipalities_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MunicipalityReference"][];
                };
            };
        };
    };
    list_district_references_api_v1_locations_districts_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                city?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DistrictReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_location_references_api_v1_locations_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                location_type?: ("district" | "neighborhood" | "locality" | "landmark" | "transport_node") | null;
                query?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_transport_stops_api_v1_infrastructure_transport_stops_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                city?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransportStopReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_transport_routes_api_v1_infrastructure_transport_routes_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                city?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransportRouteReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_schools_api_v1_infrastructure_schools_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                city?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SchoolReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_kindergartens_api_v1_infrastructure_kindergartens_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                city?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KindergartenReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_amenities_api_v1_infrastructure_amenities_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                city?: string | null;
                amenity_type?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AmenityReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_industrial_zones_api_v1_infrastructure_industrial_zones_get: {
        parameters: {
            query?: {
                municipality_id?: string | null;
                district_id?: string | null;
                city?: string | null;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IndustrialZoneReference"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_planned_investments_api_v1_planned_investments_get: {
        parameters: {
            query?: {
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedInvestment"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_plans_api_v1_plans_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlanLimits"][];
                };
            };
        };
    };
    get_market_dashboard_api_v1_market_dashboard_get: {
        parameters: {
            query?: {
                city?: string | null;
                district?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketDashboard"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_market_intelligence_report_api_v1_market_intelligence_report_get: {
        parameters: {
            query?: {
                audience?: "bank" | "developer" | "fund";
                city?: string | null;
                district?: string | null;
                area_limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarketIntelligenceReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    evaluate_scoring_service_listing_endpoint_api_v1_scoring_evaluate_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScoringServiceRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScoringServiceResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_enterprise_custom_dashboards_api_v1_enterprise_custom_dashboards_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomDashboardConfig"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomDashboardCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomDashboardConfig"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                dashboard_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomDashboardConfig"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                dashboard_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                dashboard_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomDashboardUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomDashboardConfig"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    preview_enterprise_custom_dashboard_api_v1_enterprise_custom_dashboards__dashboard_id__preview_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                dashboard_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomDashboardPreview"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_api_lite_listings_api_v1_api_lite_listings_get: {
        parameters: {
            query?: {
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
                /** @description Gmina or municipality name */
                municipality?: string | null;
                /** @description Address, district, title or source id */
                query?: string | null;
                rooms?: number | null;
                market_type?: ("primary" | "secondary") | null;
                min_price?: number | null;
                max_price?: number | null;
                min_area_m2?: number | null;
                max_area_m2?: number | null;
                min_investment_score?: number | null;
                max_risk_score?: number | null;
                min_liquidity_score?: number | null;
                min_rental_potential_score?: number | null;
                min_data_quality_score?: number | null;
                min_developer_reputation_score?: number | null;
                exclude_developer_risk_signals?: boolean;
                sort?: "price_asc" | "price_desc" | "price_per_m2_asc" | "price_per_m2_desc" | "investment_score_desc" | "investment_score_asc" | "risk_score_asc" | "risk_score_desc" | "negotiation_score_desc" | "negotiation_score_asc" | "liquidity_score_desc" | "liquidity_score_asc" | "rental_potential_score_desc" | "rental_potential_score_asc" | "developer_reputation_score_desc" | "developer_reputation_score_asc" | "developer_confidence_score_desc" | "developer_confidence_score_asc" | "days_on_market_asc" | "days_on_market_desc" | "newest" | "oldest";
                page?: number;
                page_size?: number;
            };
            header?: {
                "X-Domarion-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiLiteListingSearchResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_api_lite_listing_detail_api_v1_api_lite_listings__listing_id__get: {
        parameters: {
            query?: never;
            header?: {
                "X-Domarion-API-Key"?: string | null;
            };
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiLiteListingDetail"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    compare_api_lite_areas_api_v1_api_lite_areas_compare_get: {
        parameters: {
            query?: {
                city?: string | null;
                sort?: string;
                limit?: number;
            };
            header?: {
                "X-Domarion-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AreaComparison"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_api_lite_usage_api_v1_api_lite_usage_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                "X-Domarion-API-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiLiteUsageSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    calculate_mortgage_budget_api_v1_mortgage_calculate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MortgageCalculationRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MortgageCalculationResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_partner_referrals_api_v1_partner_referrals_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerReferral"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_partner_referral_api_v1_partner_referrals_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PartnerReferralCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerReferral"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_partner_referral_api_v1_partner_referrals__referral_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                referral_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerReferral"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_partner_referrals_api_v1_admin_partner_referrals_get: {
        parameters: {
            query?: {
                status?: ("new" | "contacted" | "qualified" | "closed" | "rejected") | null;
                referral_type?: ("mortgage" | "legal" | "renovation" | "buyer_beta" | "realtor_beta") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerReferral"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_partner_referral_lead_scores_api_v1_admin_partner_referrals_lead_scores_get: {
        parameters: {
            query?: {
                status?: ("new" | "contacted" | "qualified" | "closed" | "rejected") | null;
                referral_type?: ("mortgage" | "legal" | "renovation" | "buyer_beta" | "realtor_beta") | null;
                min_score?: number | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerLeadScore"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_admin_partner_referral_lead_score_api_v1_admin_partner_referrals__referral_id__lead_score_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                referral_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerLeadScore"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_paid_beta_tracking_api_v1_admin_paid_beta_tracking_get: {
        parameters: {
            query?: {
                status?: ("new" | "contacted" | "qualified" | "closed" | "rejected") | null;
                referral_type?: ("mortgage" | "legal" | "renovation" | "buyer_beta" | "realtor_beta") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaidBetaTrackingRow"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_paid_beta_tracking_api_v1_admin_paid_beta_tracking__referral_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                referral_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PaidBetaTrackingUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaidBetaTrackingRow"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_partner_referral_api_v1_admin_partner_referrals__referral_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                referral_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PartnerReferralUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerReferral"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    preview_user_submitted_listing_reference_api_v1_user_submitted_listings_reference_preview_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceReferencePreviewRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceReferencePreview"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_user_submitted_listing_from_url_api_v1_user_submitted_listings_import_from_url_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceUrlImportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceUrlImportResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    analyze_user_submitted_listing_endpoint_api_v1_user_submitted_listings_analyze_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserSubmittedListingRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSubmittedListingAnalysis"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_user_submitted_listing_report_api_v1_user_submitted_listings_report_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserSubmittedListingReportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSubmittedListingReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_user_submitted_listing_drafts_api_v1_user_submitted_listings_drafts_get: {
        parameters: {
            query?: {
                include_expired?: boolean;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSubmittedListingDraft"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_user_submitted_listing_draft_api_v1_user_submitted_listings_drafts__draft_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                draft_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSubmittedListingDraft"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_user_submitted_listing_draft_api_v1_user_submitted_listings_drafts__draft_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                draft_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    recalculate_user_submitted_listing_post_viewing_verdict_api_v1_user_submitted_listings_drafts__draft_id__post_viewing_verdict_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                draft_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostViewingChecklistAnswers"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostViewingVerdictRecalculation"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_user_submitted_listing_object_watch_api_v1_user_submitted_listings_drafts__draft_id__watch_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                draft_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ObjectWatchCreate"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Alert"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_user_submitted_listing_draft_report_api_v1_user_submitted_listings_drafts__draft_id__reports_generate_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                draft_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateUserSubmittedDraftReportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeneratedReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_user_submitted_listing_drafts_api_v1_admin_user_submitted_listing_drafts_get: {
        parameters: {
            query?: {
                include_expired?: boolean;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSubmittedListingDraft"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    prune_admin_user_submitted_listing_drafts_api_v1_admin_user_submitted_listing_drafts_prune_expired_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserSubmittedListingDraftPruneResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_ingestion_jobs_api_v1_admin_ingestion_jobs_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IngestionJob"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_ingestion_job_api_v1_admin_ingestion_jobs_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IngestionJobCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IngestionJob"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_ingestion_source_health_api_v1_admin_ingestion_source_health_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IngestionSourceHealth"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_source_check_jobs_api_v1_admin_ingestion_source_checks_get: {
        parameters: {
            query?: {
                source_name?: string | null;
                status?: ("queued" | "running" | "succeeded" | "failed" | "blocked") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceCheckJob"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_source_check_job_api_v1_admin_ingestion_source_checks_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceCheckJobCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceCheckJob"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_source_errors_api_v1_admin_ingestion_source_errors_get: {
        parameters: {
            query?: {
                source_name?: string | null;
                status?: ("open" | "retry_scheduled" | "resolved" | "ignored") | null;
                severity?: ("info" | "warning" | "error") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceError"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_source_error_api_v1_admin_ingestion_source_errors_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceErrorCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceError"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_source_error_api_v1_admin_ingestion_source_errors__error_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                error_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceErrorUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceError"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    retry_admin_source_error_api_v1_admin_ingestion_source_errors__error_id__retry_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                error_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceErrorRetryResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_ingestion_sources_api_v1_admin_ingestion_sources_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceRegistryEntry"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_ingestion_source_api_v1_admin_ingestion_sources_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceRegistryEntryCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceRegistryEntry"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_open_data_roadmap_api_v1_admin_ingestion_open_data_roadmap_get: {
        parameters: {
            query?: {
                domain?: string | null;
                status?: ("candidate" | "ready_for_import" | "active" | "blocked" | "needs_legal_review") | null;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OpenDataRoadmapItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_ingestion_source_api_v1_admin_ingestion_sources__source_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                source_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SourceRegistryEntryUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceRegistryEntry"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_audit_logs_api_v1_admin_audit_logs_get: {
        parameters: {
            query?: {
                action_type?: string | null;
                actor_id?: string | null;
                resource_type?: string | null;
                status?: ("succeeded" | "failed" | "blocked") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AdminAuditLog"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    prune_admin_retained_raw_payloads_api_v1_admin_ingestion_sources_prune_retained_raw_payloads_post: {
        parameters: {
            query?: {
                dry_run?: boolean;
                source_name?: string | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SourceRetentionPruneResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_data_deletion_requests_api_v1_admin_data_deletion_requests_get: {
        parameters: {
            query?: {
                status?: ("open" | "processed" | "rejected") | null;
                target_type?: ("raw_listing" | "user_submitted_draft" | "generated_report" | "source_reference" | "other") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataDeletionRequest"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_data_deletion_request_api_v1_admin_data_deletion_requests_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DataDeletionRequestCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataDeletionRequest"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    process_admin_data_deletion_request_api_v1_admin_data_deletion_requests__request_id__process_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                request_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DataDeletionRequestProcess"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataDeletionRequest"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_admin_scoring_backtest_api_v1_admin_scoring_backtest_get: {
        parameters: {
            query?: {
                city?: string | null;
                district?: string | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScoringBacktestResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_admin_scoring_backtest_report_api_v1_admin_scoring_backtest_report_get: {
        parameters: {
            query?: {
                city?: string | null;
                district?: string | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScoringBacktestReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_area_market_snapshots_api_v1_admin_area_market_snapshots_post: {
        parameters: {
            query?: {
                dry_run?: boolean;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AreaMarketSnapshotJobResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    rebuild_admin_price_history_api_v1_admin_price_history_rebuild_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PriceHistoryRebuildResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    enrich_admin_infrastructure_api_v1_admin_infrastructure_enrich_post: {
        parameters: {
            query?: {
                dry_run?: boolean;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InfrastructureEnrichmentJobResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_admin_ingestion_job_api_v1_admin_ingestion_jobs__job_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IngestionJob"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_data_quality_logs_api_v1_admin_data_quality_logs_get: {
        parameters: {
            query?: {
                job_id?: string | null;
                severity?: ("info" | "warning" | "error") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataQualityLog"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_data_quality_log_api_v1_admin_data_quality_logs_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DataQualityLogCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DataQualityLog"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_raw_listings_api_v1_admin_raw_listings_get: {
        parameters: {
            query?: {
                source_name?: string | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RawListingSummary"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_admin_raw_listing_api_v1_admin_raw_listings__raw_listing_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                raw_listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RawListingSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    correct_admin_normalized_listing_api_v1_admin_listings__listing_id__normalized_patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ListingCorrectionRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingCorrectionResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_property_deduplication_matches_api_v1_admin_deduplication_matches_get: {
        parameters: {
            query?: {
                job_id?: string | null;
                source_listing_id?: string | null;
                decision?: ("matched" | "review_required" | "rejected") | null;
                review_status?: ("open" | "auto_resolved") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyDeduplicationMatch"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_property_deduplication_match_api_v1_admin_deduplication_matches__match_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                match_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PropertyDeduplicationMatchUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyDeduplicationMatch"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_admin_partner_csv_api_v1_admin_listings_import_csv_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_admin_partner_csv_api_v1_admin_listings_import_csv_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PartnerCsvImportResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_admin_planned_investments_api_v1_admin_planned_investments_get: {
        parameters: {
            query?: {
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedInvestment"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_admin_planned_investment_api_v1_admin_planned_investments_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlannedInvestmentCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedInvestment"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_admin_planned_investments_api_v1_admin_planned_investments_import_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_admin_planned_investments_api_v1_admin_planned_investments_import_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedInvestmentImportResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_admin_infrastructure_references_api_v1_admin_infrastructure_import_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_import_admin_infrastructure_references_api_v1_admin_infrastructure_import_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InfrastructureReferenceImportResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_admin_planned_investment_api_v1_admin_planned_investments__investment_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                investment_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedInvestment"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_admin_planned_investment_api_v1_admin_planned_investments__investment_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                investment_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_admin_planned_investment_api_v1_admin_planned_investments__investment_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                investment_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlannedInvestmentUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PlannedInvestment"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_one_time_report_products_api_v1_report_products_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportProduct"][];
                };
            };
        };
    };
    get_me_api_v1_me_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_my_subscription_api_v1_me_subscription_patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubscriptionUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_agency_workspaces_api_v1_agencies_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgencyWorkspaceSummary"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_agency_workspace_api_v1_agencies_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgencyWorkspaceCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgencyWorkspace"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_agency_workspace_api_v1_agencies__agency_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgencyWorkspace"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_agency_workspace_api_v1_agencies__agency_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgencyWorkspaceUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgencyWorkspace"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_agency_member_api_v1_agencies__agency_id__members_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgencyMemberCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgencyMembership"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_agency_member_api_v1_agencies__agency_id__members__membership_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                membership_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_agency_member_api_v1_agencies__agency_id__members__membership_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                membership_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgencyMemberUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgencyMembership"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_agency_crm_clients_api_v1_agencies__agency_id__crm_clients_get: {
        parameters: {
            query?: {
                status?: ("active" | "paused" | "won" | "lost" | "archived") | null;
                query?: string | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmClient"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_agency_crm_client_api_v1_agencies__agency_id__crm_clients_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrmClientCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmClient"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_agency_crm_client_api_v1_agencies__agency_id__crm_clients__client_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmClientDetail"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_agency_crm_client_api_v1_agencies__agency_id__crm_clients__client_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrmClientUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmClient"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_agency_crm_notes_api_v1_agencies__agency_id__crm_clients__client_id__notes_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmNote"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_agency_crm_note_api_v1_agencies__agency_id__crm_clients__client_id__notes_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrmNoteCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmNote"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_agency_crm_note_api_v1_agencies__agency_id__crm_clients__client_id__notes__note_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
                note_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_agency_crm_note_api_v1_agencies__agency_id__crm_clients__client_id__notes__note_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
                note_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrmNoteUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmNote"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_agency_crm_shortlists_api_v1_agencies__agency_id__crm_clients__client_id__shortlists_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmShortlist"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrmShortlistCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmShortlist"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
                shortlist_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmShortlist"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
                shortlist_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_agency_crm_shortlist_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
                shortlist_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CrmShortlistUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmShortlist"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    preview_agency_crm_shortlist_share_api_v1_agencies__agency_id__crm_clients__client_id__shortlists__shortlist_id__share_preview_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                agency_id: string;
                client_id: string;
                shortlist_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmSharePreview"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_public_crm_shared_shortlist_api_v1_crm_shared_shortlists__share_token__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                share_token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CrmSharePreview"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_report_orders_api_v1_report_orders_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportOrder"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_report_order_api_v1_report_orders_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportOrderCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckoutSession"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_report_order_api_v1_report_orders__order_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportOrder"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_report_order_events_api_v1_report_orders__order_id__events_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportOrderEvent"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    mock_pay_report_order_api_v1_report_orders__order_id__mock_pay_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportOrder"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    fulfill_report_order_api_v1_report_orders__order_id__fulfill_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportOrder"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    receive_payment_webhook_api_v1_payment_webhooks__provider__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                provider: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentWebhookResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_map_features_api_v1_map_features_get: {
        parameters: {
            query?: {
                /** @description Voivodeship slug or name */
                voivodeship?: string | null;
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
                /** @description Gmina or municipality name */
                municipality?: string | null;
                rooms?: number | null;
                max_price?: number | null;
                min_area_m2?: number | null;
                /** @description Building type code */
                building_type?: string | null;
                /** @description Renovation/finish state code */
                renovation_state?: string | null;
                /** @description Require balcony flag */
                has_balcony?: boolean | null;
                /** @description Require terrace flag */
                has_terrace?: boolean | null;
                /** @description Require garden flag */
                has_garden?: boolean | null;
                /** @description Require elevator flag */
                has_elevator?: boolean | null;
                /** @description Parking type code */
                parking_type?: string | null;
                /** @description Heating type code */
                heating_type?: string | null;
                min_floor?: number | null;
                max_floor?: number | null;
                max_building_floors?: number | null;
                min_building_year?: number | null;
                max_building_year?: number | null;
                /** @description Optional map viewport: min_lon,min_lat,max_lon,max_lat */
                bbox?: string | null;
                lat?: number | null;
                lon?: number | null;
                radius_km?: number | null;
                min_investment_score?: number | null;
                max_risk_score?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MapFeatureCollection"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_api_v1_listings__listing_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Listing"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    analyze_listing_api_v1_listings__listing_id__analysis_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingAnalysis"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    recalculate_listing_post_viewing_verdict_api_v1_listings__listing_id__post_viewing_verdict_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostViewingChecklistAnswers"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostViewingVerdictRecalculation"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_listing_object_watch_api_v1_listings__listing_id__watch_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ObjectWatchCreate"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Alert"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_future_impact_api_v1_listings__listing_id__future_impact_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingFutureImpact"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_growth_analysis_api_v1_listings__listing_id__growth_analysis_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingGrowthAnalysis"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_risk_profile_api_v1_listings__listing_id__risk_profile_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingRiskProfile"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_rental_estimate_api_v1_listings__listing_id__rental_estimate_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListingRentalEstimate"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_listing_developer_api_v1_listings__listing_id__developer_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeveloperReputation"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_area_statistics_api_v1_areas__area_id__statistics_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                area_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AreaStatistics"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    compare_listings_api_v1_compare_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompareRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompareResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    build_realtor_client_shortlist_preview_api_v1_realtor_client_shortlists_preview_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RealtorClientShortlistRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RealtorClientShortlist"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_object_report_api_v1_reports_object_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ObjectReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_object_report_templates_api_v1_reports_templates_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportTemplateDescriptor"][];
                };
            };
        };
    };
    generate_object_report_api_v1_reports_object_generate_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateReportRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeneratedReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_object_report_html_api_v1_reports_object__listing_id__html_get: {
        parameters: {
            query?: {
                audience?: "buyer" | "realtor" | "investor";
            };
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/html": string;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_object_report_pdf_api_v1_reports_object__listing_id__pdf_get: {
        parameters: {
            query?: {
                audience?: "buyer" | "realtor" | "investor";
            };
            header?: never;
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_generated_reports_api_v1_reports_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeneratedReportListItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_ai_assistant_data_contract_api_v1_ai_data_contract_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIAssistantDataContract"];
                };
            };
        };
    };
    list_ai_assistant_questions_api_v1_ai_questions_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIQuestionDescriptor"][];
                };
            };
        };
    };
    summarize_area_impact_api_v1_ai_areas__area_id__summary_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                area_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AreaImpactSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    summarize_news_article_api_v1_ai_news__article_id__summary_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                article_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsArticleAISummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    answer_compare_ai_question_api_v1_ai_compare_answer_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AICompareAnswerRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AICompareAnswer"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    answer_listing_ai_question_api_v1_ai_listings__listing_id__answer_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                listing_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AIListingAnswerRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIListingAnswer"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    answer_user_submitted_listing_ai_question_api_v1_ai_user_submitted_listing_drafts__draft_id__answer_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                draft_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AIListingAnswerRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIListingAnswer"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_ai_insights_api_v1_ai_insights_get: {
        parameters: {
            query?: {
                subject_type?: ("listing" | "user_submitted_draft" | "area" | "report" | "compare" | "news") | null;
                subject_id?: string | null;
                insight_type?: ("report_summary" | "object_explanation" | "area_summary" | "news_summary" | "assistant_answer") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIInsightListItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_ai_insight_api_v1_ai_insights__insight_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                insight_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIInsight"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_generated_reports_api_v1_reports_export_get: {
        parameters: {
            query?: {
                format?: string;
                audience?: ("buyer" | "realtor" | "investor") | null;
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_listing_dataset_api_v1_datasets_listings_export_get: {
        parameters: {
            query?: {
                format?: string;
                /** @description City name, for example Wrocław */
                city?: string | null;
                /** @description District or estate name */
                district?: string | null;
                /** @description Gmina or municipality name */
                municipality?: string | null;
                /** @description Address, district, title or source id */
                query?: string | null;
                rooms?: number | null;
                market_type?: ("primary" | "secondary") | null;
                min_price?: number | null;
                max_price?: number | null;
                min_area_m2?: number | null;
                max_area_m2?: number | null;
                min_investment_score?: number | null;
                max_risk_score?: number | null;
                min_liquidity_score?: number | null;
                min_rental_potential_score?: number | null;
                min_data_quality_score?: number | null;
                min_developer_reputation_score?: number | null;
                exclude_developer_risk_signals?: boolean;
                sort?: "price_asc" | "price_desc" | "price_per_m2_asc" | "price_per_m2_desc" | "investment_score_desc" | "investment_score_asc" | "risk_score_asc" | "risk_score_desc" | "negotiation_score_desc" | "negotiation_score_asc" | "liquidity_score_desc" | "liquidity_score_asc" | "rental_potential_score_desc" | "rental_potential_score_asc" | "developer_reputation_score_desc" | "developer_reputation_score_asc" | "developer_confidence_score_desc" | "developer_confidence_score_asc" | "days_on_market_asc" | "days_on_market_desc" | "newest" | "oldest";
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                    "text/csv": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    email_generated_report_api_v1_reports__report_id__email_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                report_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReportEmailRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportEmailResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_generated_report_pdf_api_v1_reports__report_id__pdf_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                report_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_generated_report_api_v1_reports__report_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                report_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeneratedReport"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_generated_report_content_api_v1_reports__report_id__content_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                report_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_favorites_api_v1_favorites_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Favorite"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_favorite_api_v1_favorites_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FavoriteCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Favorite"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_favorite_api_v1_favorites__favorite_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                favorite_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Favorite"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_favorite_api_v1_favorites__favorite_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                favorite_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_favorite_api_v1_favorites__favorite_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                favorite_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FavoriteUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Favorite"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_alerts_api_v1_alerts_get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Alert"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_alert_api_v1_alerts_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AlertCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Alert"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_alert_api_v1_alerts__alert_id__get: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alert_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Alert"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_alert_api_v1_alerts__alert_id__delete: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alert_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_alert_api_v1_alerts__alert_id__patch: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alert_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AlertUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Alert"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    preview_alert_api_v1_alerts__alert_id__preview_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path: {
                alert_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlertPreview"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    build_realtor_alert_digest_api_v1_alerts__alert_id__realtor_digest_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alert_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["RealtorSavedSearchDigestRequest"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RealtorSavedSearchDigest"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    deliver_alert_api_v1_alerts__alert_id__deliver_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path: {
                alert_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AlertDeliveryRequest"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlertDeliveryJob"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_alert_delivery_jobs_api_v1_alert_delivery_jobs_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlertDeliveryJob"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    deliver_daily_email_alerts_api_v1_admin_alerts_deliver_daily_email_post: {
        parameters: {
            query?: never;
            header?: {
                authorization?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AlertDeliveryBatchRequest"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlertDeliveryBatchResult"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
