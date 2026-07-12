from pathlib import Path

from domarion.core import get_settings
from domarion.report_artifacts.local import LocalReportArtifactStore
from domarion.report_artifacts.s3 import S3ReportArtifactStore
from domarion.report_store.artifact_backed import ArtifactBackedReportStore
from domarion.report_store.factory import get_report_store, memory_report_store
from domarion.report_store.memory import InMemoryReportStore
from domarion.schemas import GeneratedReportCreate


def test_artifact_backed_report_store_writes_local_artifact(tmp_path: Path) -> None:
    store = ArtifactBackedReportStore(
        InMemoryReportStore(),
        LocalReportArtifactStore(
            tmp_path,
            public_base_url="https://cdn.example/reports",
        ),
    )

    report = store.save_report(_report_payload(owner_id="owner/with spaces"))
    artifact_key = report.report_metadata["artifact_storage_key"]
    artifact_path = tmp_path.joinpath(*Path(artifact_key).parts)

    assert report.id
    assert report.content == "<html>Report</html>"
    assert artifact_path.read_text(encoding="utf-8") == "<html>Report</html>"
    assert report.report_metadata["artifact_storage_backend"] == "local"
    assert report.report_metadata["artifact_size_bytes"] == len(report.content.encode("utf-8"))
    assert report.report_metadata["artifact_content_sha256"]
    assert report.report_metadata["artifact_public_url"] == (
        f"https://cdn.example/reports/{artifact_key}"
    )
    assert artifact_key.startswith("reports/owner-with-spaces/")
    assert artifact_key.endswith(".html")


def test_s3_report_artifact_store_puts_object_with_prefix() -> None:
    fake_client = FakeS3Client()
    store = S3ReportArtifactStore(
        bucket="domarion-artifacts",
        prefix="prod/reports",
        public_base_url="https://cdn.example",
        client=fake_client,
    )

    artifact = store.put_artifact(
        key="reports/owner/report-1.json",
        content=b'{"ok": true}',
        content_type="application/json",
    )

    assert fake_client.calls == [
        {
            "Bucket": "domarion-artifacts",
            "Key": "prod/reports/reports/owner/report-1.json",
            "Body": b'{"ok": true}',
            "ContentType": "application/json",
        }
    ]
    assert artifact.backend == "s3"
    assert artifact.key == "prod/reports/reports/owner/report-1.json"
    assert artifact.public_url == "https://cdn.example/prod/reports/reports/owner/report-1.json"
    assert artifact.size_bytes == len(b'{"ok": true}')


def test_report_store_factory_wraps_memory_store_with_local_artifacts(
    tmp_path: Path,
    monkeypatch,
) -> None:
    memory_report_store.clear()
    monkeypatch.setenv("REPORT_ARTIFACT_STORAGE_BACKEND", "local")
    monkeypatch.setenv("REPORT_ARTIFACT_LOCAL_DIR", str(tmp_path))
    monkeypatch.setenv("REPORT_ARTIFACT_PUBLIC_BASE_URL", "https://cdn.local")
    get_settings.cache_clear()

    store_iterator = get_report_store()
    try:
        store = next(store_iterator)
        report = store.save_report(_report_payload())
    finally:
        store_iterator.close()
        get_settings.cache_clear()

    artifact_key = report.report_metadata["artifact_storage_key"]
    assert tmp_path.joinpath(*Path(artifact_key).parts).exists()
    assert report.report_metadata["artifact_public_url"] == f"https://cdn.local/{artifact_key}"


class FakeS3Client:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def put_object(self, **kwargs) -> None:
        self.calls.append(kwargs)


def _report_payload(owner_id: str = "demo-user") -> GeneratedReportCreate:
    return GeneratedReportCreate(
        owner_id=owner_id,
        listing_id="wr-001",
        audience="buyer",
        report_format="html",
        content_type="text/html; charset=utf-8",
        title="Report",
        summary="Summary",
        content="<html>Report</html>",
        report_metadata={"report_product_code": "object_report"},
    )
