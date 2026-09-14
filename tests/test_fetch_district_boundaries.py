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
