from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class StoredReportArtifact:
    backend: str
    key: str
    size_bytes: int
    sha256: str
    public_url: str | None = None


class ReportArtifactStore(Protocol):
    backend_name: str

    def put_artifact(
        self,
        key: str,
        content: bytes,
        content_type: str,
    ) -> StoredReportArtifact:
        raise NotImplementedError
