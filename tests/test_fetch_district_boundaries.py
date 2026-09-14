from pathlib import Path
from types import SimpleNamespace

import pytest

from scripts import fetch_district_boundaries


class _Response:
    def __init__(self, payload: bytes) -> None:
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def read(self, _limit: int) -> bytes:
        return self.payload


def test_download_retries_transient_network_errors(monkeypatch) -> None:
    attempts = 0

    def open_source(_request, *, timeout: int):
        nonlocal attempts
        assert timeout == 60
        attempts += 1
        if attempts < 3:
            raise OSError("temporary network error")
        return _Response(b"boundary-data")

    monkeypatch.setattr(fetch_district_boundaries, "urlopen", open_source)

    payload = fetch_district_boundaries._download(
        "https://example.test/boundaries",
        retry_delay_seconds=0,
    )

    assert payload == b"boundary-data"
    assert attempts == 3


def test_validate_boundary_file_checks_expected_count(monkeypatch, tmp_path: Path) -> None:
    boundary_file = tmp_path / "districts.geojson"
    boundary_file.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(
        fetch_district_boundaries,
        "load_district_boundaries",
        lambda _path, *, source_crs: [SimpleNamespace(slug="one")],
    )

    with pytest.raises(ValueError, match="expected 2, received 1"):
        fetch_district_boundaries._validate_boundary_file(
            boundary_file,
            {
                "city": "Example",
                "source_crs": 2180,
                "expected_boundaries": 2,
            },
        )


def test_main_uses_valid_existing_file_after_download_timeout(
    monkeypatch, tmp_path: Path, capsys
) -> None:
    manifest = tmp_path / "manifest.json"
    data_dir = tmp_path / "data"
    target = data_dir / "districts" / "example.geojson"
    target.parent.mkdir(parents=True)
    target.write_text('{"existing": true}', encoding="utf-8")
    manifest.write_text(
        """[
          {
            "city": "Example",
            "location": "districts/example.geojson",
            "source_url": "https://example.test/districts",
            "source_crs": 2180,
            "expected_boundaries": 1
          }
        ]""",
        encoding="utf-8",
    )
    monkeypatch.setattr(
        fetch_district_boundaries,
        "load_district_boundaries",
        lambda _path, *, source_crs: [SimpleNamespace(slug="one")],
    )
    monkeypatch.setattr(
        fetch_district_boundaries,
        "_download",
        lambda _url: (_ for _ in ()).throw(OSError("timed out")),
    )
    monkeypatch.setattr(
        "sys.argv",
        [
            "fetch_district_boundaries.py",
            "--manifest",
            str(manifest),
            "--data-dir",
            str(data_dir),
            "--fallback-existing",
        ],
    )

    fetch_district_boundaries.main()

    assert target.read_text(encoding="utf-8") == '{"existing": true}'
    assert '"source": "existing-fallback"' in capsys.readouterr().out


def test_main_copies_validated_pinned_file_without_network(
    monkeypatch, tmp_path: Path, capsys
) -> None:
    manifest = tmp_path / "manifest.json"
    source_dir = tmp_path / "source"
    data_dir = tmp_path / "data"
    source_dir.mkdir()
    source = source_dir / "example.geojson"
    source.write_text('{"pinned": true}', encoding="utf-8")
    manifest.write_text(
        """[
          {
            "city": "Example",
            "location": "example.geojson",
            "source_url": "https://example.test/districts",
            "source_crs": 2180,
            "expected_boundaries": 1
          }
        ]""",
        encoding="utf-8",
    )
    monkeypatch.setattr(
        fetch_district_boundaries,
        "load_district_boundaries",
        lambda _path, *, source_crs: [SimpleNamespace(slug="one")],
    )
    monkeypatch.setattr(
        fetch_district_boundaries,
        "_download",
        lambda _url: pytest.fail("pinned preparation must not use the network"),
    )
    monkeypatch.setattr(
        "sys.argv",
        [
            "fetch_district_boundaries.py",
            "--manifest",
            str(manifest),
            "--data-dir",
            str(data_dir),
            "--source-dir",
            str(source_dir),
        ],
    )

    fetch_district_boundaries.main()

    assert (data_dir / "example.geojson").read_bytes() == source.read_bytes()
    assert '"source": "pinned"' in capsys.readouterr().out
