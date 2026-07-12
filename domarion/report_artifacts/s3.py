from hashlib import sha256
from typing import Any

from domarion.report_artifacts.base import StoredReportArtifact


class S3ReportArtifactStore:
    backend_name = "s3"

    def __init__(
        self,
        *,
        bucket: str,
        prefix: str = "",
        public_base_url: str | None = None,
        endpoint_url: str | None = None,
        region_name: str | None = None,
        access_key_id: str | None = None,
        secret_access_key: str | None = None,
        client: Any | None = None,
    ) -> None:
        if not bucket:
            raise ValueError("REPORT_ARTIFACT_S3_BUCKET is required for S3 artifact storage")
        self.bucket = bucket
        self.prefix = prefix.strip("/")
        self.public_base_url = public_base_url.rstrip("/") if public_base_url else None
        self.client = client or self._build_client(
            endpoint_url=endpoint_url,
            region_name=region_name,
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
        )

    def put_artifact(
        self,
        key: str,
        content: bytes,
        content_type: str,
    ) -> StoredReportArtifact:
        object_key = self._object_key(key)
        self.client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=content,
            ContentType=content_type,
        )
        return StoredReportArtifact(
            backend=self.backend_name,
            key=object_key,
            size_bytes=len(content),
            sha256=sha256(content).hexdigest(),
            public_url=self._public_url(object_key),
        )

    def _object_key(self, key: str) -> str:
        if not key or key.startswith("/") or ".." in key.split("/"):
            raise ValueError("Invalid report artifact key")
        return f"{self.prefix}/{key}" if self.prefix else key

    def _public_url(self, object_key: str) -> str | None:
        if not self.public_base_url:
            return None
        return f"{self.public_base_url}/{object_key}"

    @staticmethod
    def _build_client(
        *,
        endpoint_url: str | None,
        region_name: str | None,
        access_key_id: str | None,
        secret_access_key: str | None,
    ) -> Any:
        try:
            import boto3
        except ImportError as exc:
            raise RuntimeError(
                "S3 artifact storage requires boto3. Install project dependencies first."
            ) from exc

        return boto3.client(
            "s3",
            endpoint_url=endpoint_url or None,
            region_name=region_name or None,
            aws_access_key_id=access_key_id or None,
            aws_secret_access_key=secret_access_key or None,
        )
