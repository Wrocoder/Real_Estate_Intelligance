import json
from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace

from domarion.db.models import TransactionObservation
from domarion.ingestion import rcn_transactions
from domarion.ingestion.district_boundaries import load_district_boundaries


def _feature(**overrides):
    feature = {
        "feature_id": "lokale.1",
        "tran_przestrzen_nazw": "PL.PZGiK.RCN",
        "tran_lokalny_id_iip": "transaction-1",
        "tran_wersja_id": "2026-01-10T12:00:00",
        "tran_rodzaj_trans": "wolnyRynek",
        "tran_rodzaj_rynku": "wtorny",
        "tran_cena_brutto": "720000",
        "dok_data": "2026-01-08 02:00:00+01",
        "nier_rodzaj": "nieruchomoscLokalowa",
        "nier_prawo": "wlasnosc",
        "lok_funkcja": "mieszkalna",
        "lok_liczba_izb": "3",
        "lok_nr_kond": "4",
        "lok_pow_uzyt": "60,0",
        "lok_cena_brutto": "690000",
        "lok_adres": "MSC:Wrocław;UL:Testowa;NR_PORZ:1",
        "_geometry_x": "365000.0",
        "_geometry_y": "350000.0",
        "_geometry_crs": "urn:ogc:def:crs:EPSG::2180",
    }
    feature.update(overrides)
    return feature


def test_normalize_rcn_feature_uses_apartment_price_and_preserves_crs_geometry():
    record = rcn_transactions.normalize_rcn_feature(
        _feature(),
        row_number=1,
        source_name="RCN GUGiK",
        source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
    )

    assert record.source_observation_id.endswith(":2026-01-10T12:00:00")
    assert record.city == "Wrocław"
    assert record.area_id == "wroclaw-city"
    assert record.market_type == "secondary"
    assert record.property_price_gross == 690000
    assert record.transaction_price_gross == 720000
    assert record.price_basis == "local"
    assert record.price_per_m2 == Decimal("11500")
    assert record.geometry_x == Decimal("365000.0")
    assert record.geometry_crs == "urn:ogc:def:crs:EPSG::2180"
    assert record.transaction_date == datetime(2026, 1, 8, 1, 0)


def test_normalize_rcn_feature_rejects_non_residential_rows():
    try:
        rcn_transactions.normalize_rcn_feature(
            _feature(lok_funkcja="biurowa"),
            row_number=1,
            source_name="RCN GUGiK",
            source_url=None,
        )
    except rcn_transactions.RcnTransactionError as exc:
        assert "non-residential" in str(exc)
    else:
        raise AssertionError("non-residential RCN row was accepted")


def test_import_rcn_transactions_writes_transaction_table_only(monkeypatch, tmp_path):
    path = tmp_path / "rcn.json"
    path.write_text(
        '{"type":"FeatureCollection","features":[{"id":"transaction-1",'
        '"properties":' + json.dumps(_feature()) + "}]}",
        encoding="utf-8",
    )
    source = SimpleNamespace(
        id=7,
        name="RCN GUGiK",
        base_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
        source_type="transaction_register",
        legal_status="approved",
        ingestion_method="rcn_wfs",
        allowed_use_json=["analytics", "market_metrics", "reports"],
        is_demo=False,
        is_active=True,
    )

    class Session:
        def __init__(self):
            self.added = []
            self.scalar_calls = 0

        def scalar(self, statement):
            self.scalar_calls += 1
            return source if self.scalar_calls == 1 else None

        def add(self, row):
            self.added.append(row)

        def flush(self):
            return None

    session = Session()
    monkeypatch.setattr(rcn_transactions, "refresh_market_metrics", lambda *args, **kwargs: {})
    result = rcn_transactions.import_rcn_transactions(
        session,
        path,
        source_name="RCN GUGiK",
    )

    assert result.transactions_created == 1
    assert any(isinstance(row, TransactionObservation) for row in session.added)
    assert not any(row.__class__.__name__ == "ListingSnapshot" for row in session.added)


def test_load_district_boundaries_reads_geojson_without_inventing_names(tmp_path):
    path = tmp_path / "districts.geojson"
    path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"name": "Stare Miasto"},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[1, 1], [2, 1], [2, 2], [1, 1]]],
                        },
                    },
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[3, 3], [4, 3], [4, 4], [3, 3]]],
                        },
                    },
                ],
            }
        ),
        encoding="utf-8",
    )

    records = load_district_boundaries(path, source_crs=2177)

    assert len(records) == 1
    assert records[0].district == "Stare Miasto"
    assert records[0].slug == "stare-miasto"
    assert records[0].source_crs == 2177
    assert records[0].geometry_wkt.startswith("MULTIPOLYGON(")
