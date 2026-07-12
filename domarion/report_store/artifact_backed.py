from hashlib import sha256
from uuid import uuid4

from domarion.report_artifacts.base import ReportArtifactStore
from domarion.report_store.base import ReportStore
from domarion.schemas import GeneratedReport, GeneratedReportCreate, GeneratedReportListItem

ARTIFACT_METADATA_KEYS = {
    "artifact_storage_backend",
    "artifact_storage_key",
    "artifact_public_url",
    "artifact_content_sha256",
    "artifact_size_bytes",
}


class ArtifactBackedReportStore:
    def __init__(self, delegate: ReportStore, artifact_store: ReportArtifactStore) -> None:
        self.delegate = delegate
        self.artifact_store = artifact_store

    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        report_id = payload.id or str(uuid4())
        content = payload.content.encode("utf-8")
        key = _artifact_key(payload, report_id)
        artifact = self.artifact_store.put_artifact(
            key=key,
            content=content,
            content_type=payload.content_type,
        )
        metadata = {
            **payload.report_metadata,
            "artifact_storage_backend": artifact.backend,
            "artifact_storage_key": artifact.key,
            "artifact_public_url": artifact.public_url,
            "artifact_content_sha256": artifact.sha256,
            "artifact_size_bytes": artifact.size_bytes,
        }
        saved = self.delegate.save_report(
            payload.model_copy(update={"id": report_id, "report_metadata": metadata})
        )
        if saved.report_metadata.get("artifact_content_sha256") != sha256(content).hexdigest():
            raise RuntimeError("Saved report artifact metadata checksum mismatch")
        return saved

    def list_reports(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportListItem]:
        return self.delegate.list_reports(limit=limit, owner_id=owner_id)

    def list_reports_with_metadata(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReport]:
        return self.delegate.list_reports_with_metadata(limit=limit, owner_id=owner_id)

    def get_report(
        self,
        report_id: str,
        owner_id: str | None = None,
    ) -> GeneratedReport | None:
        return self.delegate.get_report(report_id=report_id, owner_id=owner_id)


def _artifact_key(payload: GeneratedReportCreate, report_id: str) -> str:
    owner = _safe_segment(payload.owner_id)
    extension = _artifact_extension(payload.content_type, payload.report_format)
    return f"reports/{owner}/{report_id}.{extension}"


def _artifact_extension(content_type: str, report_format: str) -> str:
    if content_type.startswith("text/html") or report_format == "html":
        return "html"
    if content_type == "application/json" or report_format == "json":
        return "json"
    return "bin"


def _safe_segment(value: str) -> str:
    cleaned = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in value)
    return cleaned.strip("-") or "unknown"
