from domarion.schemas import SourceRegistryEntryCreate

USER_SUBMITTED_REFERENCE_SOURCE_NAME = "User Submitted Private References"
USER_SUBMITTED_REFERENCE_SOURCE_TYPE = "user_submitted_reference"


def system_source_payloads() -> list[SourceRegistryEntryCreate]:
    return [
        SourceRegistryEntryCreate(
            name=USER_SUBMITTED_REFERENCE_SOURCE_NAME,
            source_type=USER_SUBMITTED_REFERENCE_SOURCE_TYPE,
            base_url=None,
            legal_status="approved",
            refresh_cadence="one_off_user_action",
            owner="product-legal",
            ingestion_method="user_submitted_one_off_url_import",
            allowed_use=["private_analysis", "reports", "data_quality_monitoring"],
            robots_txt_url=None,
            terms_url=None,
            notes=(
                "Private user-submitted URL references only. No bulk crawling, scheduled "
                "monitoring, anti-bot bypass, photos, contacts or public source URL display."
            ),
            is_active=True,
        )
    ]
