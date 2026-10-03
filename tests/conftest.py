import os

# Existing API tests intentionally exercise the deterministic demo dataset.
os.environ["DEMO_MODE_ENABLED"] = "true"
os.environ["DATA_REPOSITORY_BACKEND"] = "memory"
os.environ["REPORT_STORE_BACKEND"] = "memory"
os.environ["REPORT_ORDER_STORE_BACKEND"] = "memory"
os.environ["USER_STORE_BACKEND"] = "memory"
os.environ["AUTH_STORE_BACKEND"] = "memory"
os.environ["AGENCY_STORE_BACKEND"] = "memory"
os.environ["CRM_STORE_BACKEND"] = "memory"
os.environ["INGESTION_ADMIN_STORE_BACKEND"] = "memory"
os.environ["USER_SUBMITTED_LISTING_STORE_BACKEND"] = "memory"
os.environ["PARTNER_REFERRAL_STORE_BACKEND"] = "memory"
os.environ["AI_INSIGHT_STORE_BACKEND"] = "memory"
os.environ["NEWS_STORE_BACKEND"] = "memory"
os.environ["CUSTOM_DASHBOARD_STORE_BACKEND"] = "memory"
os.environ["PRODUCT_ANALYTICS_STORE_BACKEND"] = "memory"
