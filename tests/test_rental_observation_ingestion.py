import json
from datetime import datetime
from types import SimpleNamespace

import pytest

from domarion.db.models import RentalObservation
from domarion.ingestion import rental_observations


def _source(**overrides):
    values = {
        "id": 11,
        "name": "Approved Rental Feed",
        "base_url": "https://rentals.example.test/feed",
        "legal_status": "approved",
        "ingestion_method": "authorized_feed",
        "allowed_use_json": ["rental_analytics", "reports"],
        "is_demo": False,
        "is_active": True,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def _write_csv(path, *, observed_at: str, monthly_rent: int = 3200) -> None:
    path.write_text(
        "source_observation_id,observed_at,city,district,monthly_rent_pln,"
        "area_m2,rooms,source_url,lat,lon\n"
        f"rent-1,{observed_at},Wrocław,Fabryczna,{monthly_rent},60,3,"
        "https://rentals.example.test/feed/rent-1,51.10,17.02\n",
        encoding="utf-8",
    )


class _Session:
    def __init__(self, source):
        self.source = source
        self.added = []

    def scalar(self, statement):  # noqa: ANN001, ARG002
        return self.source

    def scalars(self, statement):  # noqa: ANN001, ARG002
        rows = [item for item in self.added if isinstance(item, RentalObservation)]
        return SimpleNamespace(all=lambda: rows)

    def add(self, row):  # noqa: ANN001
        self.added.append(row)

    def flush(self):
        return None


def test_import_versions_changed_observations_and_reconfirms_unchanged(tmp_path) -> None:
    path = tmp_path / "rentals.csv"
    session = _Session(_source())

    _write_csv(path, observed_at="2026-09-01T08:00:00Z")
    first = rental_observations.import_rental_observations(
        session,
        path,
        source_name="Approved Rental Feed",
    )
    _write_csv(path, observed_at="2026-09-02T08:00:00Z")
    second = rental_observations.import_rental_observations(
        session,
        path,
        source_name="Approved Rental Feed",
    )
    _write_csv(path, observed_at="2026-09-03T08:00:00Z", monthly_rent=3350)
    third = rental_observations.import_rental_observations(
        session,
        path,
        source_name="Approved Rental Feed",
    )

    rows = [item for item in session.added if isinstance(item, RentalObservation)]
    assert first.observations_created == 1
    assert second.observations_reconfirmed == 1
    assert second.observations_changed == 0
    assert third.observations_changed == 1
    assert len(rows) == 2
    assert rows[0].last_confirmed_at == datetime(2026, 9, 2, 8)
    assert rows[0].content_hash != rows[1].content_hash
    json.dumps(rows[0].normalized_payload)


@pytest.mark.parametrize(
    "source, message",
    [
        (_source(legal_status="pending"), "not approved"),
        (_source(allowed_use_json=["reports"]), "rental_analytics"),
        (_source(is_demo=True), "not approved"),
    ],
)
def test_import_rejects_sources_without_explicit_legal_approval(tmp_path, source, message) -> None:
    path = tmp_path / "rentals.csv"
    _write_csv(path, observed_at="2026-09-01T08:00:00Z")

    with pytest.raises(rental_observations.RentalObservationError, match=message):
        rental_observations.import_rental_observations(
            _Session(source),
            path,
            source_name=source.name,
            dry_run=True,
        )
