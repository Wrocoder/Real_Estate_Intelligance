from datetime import date, datetime, timedelta
from types import SimpleNamespace

from domarion.schemas import Listing
from domarion.services import market_metrics
from domarion.services.transaction_versions import latest_transaction_versions


class _ScalarResult:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return list(self.rows)


class _Session:
    def __init__(self, snapshots):
        self.snapshots = snapshots
        self.added = []

    def scalars(self, statement):
        if len(self.added) == 0:
            return _ScalarResult(self.snapshots)
        return _ScalarResult([])

    def get(self, model, key):
        if model.__name__ == "AreaStatistic":
            return next((item for item in self.added if item.area_id == key), None)
        return None

    def add(self, item):
        self.added.append(item)

    def flush(self):
        return None

    def execute(self, statement):
        return None


def _listing():
    return Listing(
        id="listing-1",
        title="Mieszkanie",
        source_name="Approved feed",
        source_url="https://feed.example.test/1",
        city="Wrocław",
        district="Fabryczna",
        area_id="wroclaw-fabryczna",
        municipality="Wrocław",
        address="Nowy Dwór 12",
        market_type="secondary",
        price=720000,
        area_m2=60,
        price_per_m2=12000,
        rooms=3,
        first_seen_at=date(2026, 5, 1),
        last_seen_at=date(2026, 9, 5),
        days_on_market=127,
        price_reductions=1,
        price_increases=0,
        relisted=False,
        lat=51.11,
        lon=16.96,
        data_quality_score=90,
    )


def test_refresh_market_metrics_rebuilds_area_from_snapshot_history(monkeypatch):
    calculated_at = datetime(2026, 9, 5)
    baseline_at = calculated_at - timedelta(days=90)
    snapshots = [
        SimpleNamespace(
            normalized_payload={"id": "listing-1"},
            observed_at=baseline_at,
            price=600000,
            area_m2=60,
            property_source_id=1,
        ),
        SimpleNamespace(
            normalized_payload={"id": "listing-1"},
            observed_at=calculated_at,
            price=720000,
            area_m2=60,
            property_source_id=1,
        ),
    ]
    session = _Session(snapshots)

    class _Repository:
        def __init__(self, session_arg, include_demo_data):
            assert session_arg is session
            assert include_demo_data is False

        def list_listings(self, city):
            assert city == "Wrocław"
            return [_listing()]

    monkeypatch.setattr(market_metrics, "PostgresRealEstateRepository", _Repository)
    monkeypatch.setattr(market_metrics, "_load_transactions", lambda *args, **kwargs: [])

    result = market_metrics.refresh_market_metrics(
        session,
        city="Wrocław",
        now=calculated_at,
    )

    assert result["status"] == "updated"
    assert result["active_listings"] == 1
    area = session.added[0]
    assert area.area_id == "wroclaw-fabryczna"
    assert area.median_price_per_m2 == 12000
    assert area.price_change_90d_pct == 20.0


def test_refresh_market_metrics_uses_rcn_without_active_listings(monkeypatch):
    calculated_at = datetime(2026, 9, 5)
    transactions = [
        SimpleNamespace(
            area_id="wroclaw-city",
            district=None,
            price_per_m2=7000,
            transaction_date=calculated_at - timedelta(days=500),
            source=None,
        ),
        SimpleNamespace(
            area_id="wroclaw-city",
            district=None,
            price_per_m2=10000,
            transaction_date=calculated_at - timedelta(days=20),
            source=None,
        ),
        SimpleNamespace(
            area_id="wroclaw-city",
            district=None,
            price_per_m2=11000,
            transaction_date=calculated_at - timedelta(days=10),
            source=None,
        ),
    ]
    session = _Session([])

    class _Repository:
        def __init__(self, session_arg, include_demo_data):
            assert session_arg is session
            assert include_demo_data is False

        def list_listings(self, city):
            assert city == "Wrocław"
            return []

    monkeypatch.setattr(market_metrics, "PostgresRealEstateRepository", _Repository)
    monkeypatch.setattr(market_metrics, "_load_transactions", lambda *args, **kwargs: transactions)

    result = market_metrics.refresh_market_metrics(
        session,
        city="Wrocław",
        now=calculated_at,
    )

    assert result["status"] == "updated"
    assert result["active_listings"] == 0
    assert result["transaction_observations"] == 3
    assert result["decision_window_observations"] == 2
    assert result["decision_window_days"] == 365
    area = session.added[0]
    assert area.area_id == "wroclaw-city"
    assert area.median_price_per_m2 == 10500
    assert area.transaction_observation_count == 2
    assert area.transaction_history_observation_count == 3
    assert [point["median_price_per_m2"] for point in area.transaction_yearly_history_json] == [
        7000,
        10500,
    ]
    assert [point["median_price_per_m2"] for point in area.transaction_monthly_history_json] == [
        7000,
        10500,
    ]
    assert area.price_basis == "transaction_observed"
    assert area.listing_metrics_available is False


def test_latest_transaction_versions_excludes_superseded_history():
    older = SimpleNamespace(
        id=1,
        source_id=7,
        source_observation_id="PL.RCN:transaction-1:2026-01-01T10:00:00",
        source_version="2026-01-01T10:00:00",
        observed_at=datetime(2026, 1, 2),
    )
    latest = SimpleNamespace(
        id=2,
        source_id=7,
        source_observation_id="PL.RCN:transaction-1:2026-02-01T10:00:00",
        source_version="2026-02-01T10:00:00",
        observed_at=datetime(2026, 2, 2),
    )
    unrelated = SimpleNamespace(
        id=3,
        source_id=7,
        source_observation_id="PL.RCN:transaction-2:2026-01-15T10:00:00",
        source_version="2026-01-15T10:00:00",
        observed_at=datetime(2026, 1, 16),
    )

    selected = latest_transaction_versions([older, unrelated, latest])

    assert {row.id for row in selected} == {2, 3}


def test_load_transactions_filters_after_selecting_latest_source_version():
    cutoff = datetime(2026, 1, 1)
    older = SimpleNamespace(
        id=1,
        source_id=7,
        source_observation_id="PL.RCN:transaction-1:2026-01-01T10:00:00",
        source_version="2026-01-01T10:00:00",
        observed_at=datetime(2026, 1, 2),
        transaction_date=datetime(2026, 2, 1),
        data_quality_score=95,
        price_per_m2=10000,
    )
    latest = SimpleNamespace(
        id=2,
        source_id=7,
        source_observation_id="PL.RCN:transaction-1:2026-02-01T10:00:00",
        source_version="2026-02-01T10:00:00",
        observed_at=datetime(2026, 2, 2),
        transaction_date=datetime(2026, 2, 1),
        data_quality_score=95,
        price_per_m2=12000,
    )
    session = SimpleNamespace(scalars=lambda statement: _ScalarResult([older, latest]))

    selected = market_metrics._load_transactions(
        session,
        city="Wrocław",
        minimum_quality=60,
        cutoff=cutoff,
    )

    assert [row.id for row in selected] == [2]
