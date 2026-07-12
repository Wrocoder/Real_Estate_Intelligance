from hashlib import sha256
from pathlib import Path

from domarion.report_artifacts.base import StoredReportArtifact


class LocalReportArtifactStore:
    backend_name = "local"

    def __init__(self, base_dir: Path, public_base_url: str | None = None) -> None:
        self.base_dir = base_dir
        self.public_base_url = public_base_url.rstrip("/") if public_base_url else None

    def put_artifact(
        self,
        key: str,
        content: bytes,
        content_type: str,
    ) -> StoredReportArtifact:
        safe_path = self._safe_path(key)
        safe_path.parent.mkdir(parents=True, exist_ok=True)
        safe_path.write_bytes(content)
        return StoredReportArtifact(
            backend=self.backend_name,
            key=key,
            size_bytes=len(content),
            sha256=sha256(content).hexdigest(),
            public_url=self._public_url(key),
        )

    def _safe_path(self, key: str) -> Path:
        if not key or key.startswith(("/", "\\")) or ".." in Path(key).parts:
            raise ValueError("Invalid report artifact key")
        return self.base_dir.joinpath(*Path(key).parts)

    def _public_url(self, key: str) -> str | None:
        if not self.public_base_url:
            return None
        normalized_key = key.replace("\\", "/")
        return f"{self.public_base_url}/{normalized_key}"
