from pathlib import Path

from domarion.core import get_settings
from domarion.report_artifacts.base import ReportArtifactStore
from domarion.report_artifacts.local import LocalReportArtifactStore
from domarion.report_artifacts.s3 import S3ReportArtifactStore


def get_report_artifact_store() -> ReportArtifactStore | None:
    settings = get_settings()
    backend = settings.report_artifact_storage_backend

    if backend == "disabled":
        return None

    if backend == "local":
        return LocalReportArtifactStore(
            base_dir=Path(settings.report_artifact_local_dir),
            public_base_url=settings.report_artifact_public_base_url,
        )

    if backend == "s3":
        return S3ReportArtifactStore(
            bucket=settings.report_artifact_s3_bucket or "",
            prefix=settings.report_artifact_s3_prefix,
            public_base_url=settings.report_artifact_public_base_url,
            endpoint_url=settings.report_artifact_s3_endpoint_url,
            region_name=settings.report_artifact_s3_region,
            access_key_id=settings.report_artifact_s3_access_key_id,
            secret_access_key=settings.report_artifact_s3_secret_access_key,
        )

    raise RuntimeError(
        "Unsupported REPORT_ARTIFACT_STORAGE_BACKEND. Use 'disabled', 'local' or 's3'."
    )
