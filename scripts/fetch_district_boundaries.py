"""Download and parse manifest sources before replacing any active boundary file."""

import argparse
import json
import tempfile
from pathlib import Path
from time import sleep
from urllib.request import Request, urlopen

from domarion.ingestion.district_boundaries import load_district_boundaries

MAX_DOWNLOAD_BYTES = 30_000_000
DOWNLOAD_ATTEMPTS = 3


def _download(url: str, *, retry_delay_seconds: float = 1.0) -> bytes:
    request = Request(url, headers={"User-Agent": "WartoMetr-boundaries/1.0"})
    for attempt in range(1, DOWNLOAD_ATTEMPTS + 1):
        try:
            with urlopen(request, timeout=60) as response:
                payload = response.read(MAX_DOWNLOAD_BYTES + 1)
            if len(payload) > MAX_DOWNLOAD_BYTES:
                raise ValueError("Boundary download exceeds safety limit")
            return payload
        except OSError:
            if attempt == DOWNLOAD_ATTEMPTS:
                raise
            sleep(retry_delay_seconds * attempt)
    raise AssertionError("unreachable")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--data-dir", required=True, type=Path)
    args = parser.parse_args()
    root = args.data_dir.resolve()
    root.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    staged = []
    with tempfile.TemporaryDirectory(dir=root, prefix="boundary-download-") as temp:
        for index, entry in enumerate(manifest):
            target = (root / entry["location"]).resolve()
            if not target.is_relative_to(root):
                raise ValueError("Boundary target must remain inside data-dir")
            payload = _download(entry["source_url"])
            path = Path(temp) / f"{index}{target.suffix}"
            path.write_bytes(payload)
            records = load_district_boundaries(path, source_crs=entry["source_crs"])
            if not records or len({row.slug for row in records}) != len(records):
                raise ValueError(f"Empty or duplicate districts: {entry['city']}")
            staged.append((path, target))
            print(json.dumps({"city": entry["city"], "boundaries": len(records)}))
        for path, target in staged:
            target.parent.mkdir(parents=True, exist_ok=True)
            path.replace(target)


if __name__ == "__main__":
    main()
