import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

from sqlalchemy import BigInteger

from domarion.db.models import DataQualityLog, TransactionObservation
from domarion.ingestion import rcn_transactions
from domarion.ingestion.district_boundaries import (
    assign_transaction_districts,
    import_district_boundaries,
    load_district_boundaries,
    load_district_boundary_manifest,
)


def _feature(**overrides):
    feature = {
        "feature_id": "lokale.1",
        "tran_przestrzen_nazw": "PL.PZGiK.RCN",
        "teryt": "0264",
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


def test_transaction_observation_money_columns_support_national_rcn_totals():
    record = rcn_transactions.normalize_rcn_feature(
        _feature(
            lok_cena_brutto="2500000000",
            tran_cena_brutto="3000000000",
            lok_vat="2300000000",
        ),
        row_number=1,
        source_name="RCN GUGiK",
        source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
    )

    assert record.property_price_gross == 2_500_000_000
    assert record.transaction_price_gross == 3_000_000_000
    assert record.data_quality_score == 0
    assert (
        record.normalized_payload["analytics_exclusion_reason"]
        == "price_per_m2_requires_source_review"
    )
    assert record.vat_amount == 2_300_000_000
    for column_name in (
        "property_price_gross",
        "transaction_price_gross",
        "vat_amount",
    ):
        assert isinstance(
            TransactionObservation.__table__.columns[column_name].type,
            BigInteger,
        )


def test_normalize_rcn_feature_rejects_impossible_transaction_dates():
    for value in ("0006-04-21", "2028-03-02"):
        try:
            rcn_transactions.normalize_rcn_feature(
                _feature(dok_data=value),
                row_number=1,
                source_name="RCN GUGiK",
                source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
                observed_at=datetime(2026, 9, 13, tzinfo=UTC),
            )
        except rcn_transactions.RcnTransactionError as exc:
            assert "transaction date is outside the supported range" in str(exc)
        else:
            raise AssertionError(f"impossible transaction date {value} was accepted")


def test_normalize_rcn_feature_rejects_areas_outside_storage_range():
    for field, value, label in (
        ("lok_pow_uzyt", "1000000", "usable area"),
        ("lok_pow_przyn", "290000016", "ancillary area"),
        ("lok_pow_przyn", "-1", "ancillary area"),
    ):
        try:
            rcn_transactions.normalize_rcn_feature(
                _feature(**{field: value}),
                row_number=1,
                source_name="RCN GUGiK",
                source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
            )
        except rcn_transactions.RcnTransactionError as exc:
            assert f"{label} is outside the supported range" in str(exc)
        else:
            raise AssertionError(f"out-of-range {label} {value} was accepted")


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


def test_normalize_rcn_feature_accepts_a_bounded_polish_region():
    record = rcn_transactions.normalize_rcn_feature(
        _feature(
            teryt="1261",
            lok_adres="MSC:KRAKÓW;UL:Długa;NR_PORZ:1",
        ),
        row_number=1,
        source_name="RCN GUGiK",
        source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
        expected_teryt_prefix="12",
    )

    assert record.city == "Kraków"
    assert record.area_id == "rcn-1261-krakow-city"
    assert record.teryt == "1261"
    assert record.normalized_payload["voivodeship"] == "małopolskie"
    assert record.normalized_payload["locality_area_id"] == "rcn-1261-krakow-city"


def test_normalize_rcn_feature_uses_major_city_teryt_when_address_is_missing():
    record = rcn_transactions.normalize_rcn_feature(
        _feature(teryt="3064", lok_adres=None),
        row_number=1,
        source_name="RCN GUGiK",
        source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
        expected_teryt_prefix="30",
    )

    assert record.city == "Poznań"
    assert record.area_id == "rcn-3064-poznan-city"
    assert record.normalized_payload["voivodeship"] == "wielkopolskie"


def test_normalize_rcn_feature_uses_teryt_for_missing_locality_marker():
    record = rcn_transactions.normalize_rcn_feature(
        _feature(teryt="3064", lok_adres="MSC:<brak miejscowości>"),
        row_number=1,
        source_name="RCN GUGiK",
        source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
        expected_teryt_prefix="30",
    )

    assert record.city == "Poznań"
    assert record.area_id == "rcn-3064-poznan-city"


def test_parse_gml_epsg_2180_converts_axis_order_to_easting_northing():
    body = b"""<wfs:FeatureCollection
        xmlns:wfs="http://www.opengis.net/wfs/2.0"
        xmlns:ms="http://mapserver.gis.umn.edu/mapserver"
        xmlns:gml="http://www.opengis.net/gml">
      <wfs:member><ms:lokale gml:id="lokale.1">
        <ms:tran_lokalny_id_iip>transaction-1</ms:tran_lokalny_id_iip>
        <ms:msGeometry><gml:Point srsName="urn:ogc:def:crs:EPSG::2180">
          <gml:pos>372911.381 742142.023</gml:pos>
        </gml:Point></ms:msGeometry>
      </ms:lokale></wfs:member>
    </wfs:FeatureCollection>"""

    features, _next_url = rcn_transactions._parse_response(
        body,
        "https://mapy.geoportal.gov.pl/wss/service/rcn",
    )

    assert features[0]["_geometry_x"] == "742142.023"
    assert features[0]["_geometry_y"] == "372911.381"
    assert features[0]["_geometry_crs"] == "urn:ogc:def:crs:EPSG::2180"


def test_normalize_rcn_feature_rejects_a_row_outside_requested_region():
    try:
        rcn_transactions.normalize_rcn_feature(
            _feature(teryt="1465", lok_adres="MSC:Warszawa;UL:Długa;NR_PORZ:1"),
            row_number=1,
            source_name="RCN GUGiK",
            source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
            expected_teryt_prefix="12",
        )
    except rcn_transactions.RcnTransactionError as exc:
        assert "regional scope" in str(exc)
    else:
        raise AssertionError("out-of-scope RCN row was accepted")


def test_copy_record_preserves_matching_authoritative_district_assignment():
    record = rcn_transactions.normalize_rcn_feature(
        _feature(),
        row_number=1,
        source_name="RCN GUGiK",
        source_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
    )
    row = SimpleNamespace(
        district="Stare Miasto",
        area_id="wroclaw-stare-miasto",
        geometry_x=record.geometry_x,
        geometry_y=record.geometry_y,
        normalized_payload={
            "district": "Stare Miasto",
            "area_id": "wroclaw-stare-miasto",
            "district_assignment_source": "Wrocław Geoportal",
            "district_assignment_source_url": "https://geoportal.wroclaw.pl/",
        },
    )

    rcn_transactions._copy_record(row, record, ingestion_job_id="job-1")

    assert row.district == "Stare Miasto"
    assert row.area_id == "wroclaw-stare-miasto"
    assert row.normalized_payload["district_assignment_source"] == "Wrocław Geoportal"
    assert row.normalized_payload["district_assignment_source_url"] == (
        "https://geoportal.wroclaw.pl/"
    )
    assert row.normalized_payload["locality_area_id"] == "wroclaw-city"


def test_market_scopes_refresh_when_observations_leave_rolling_window():
    refresh_at = datetime(2026, 9, 12, 8)

    class Session:
        def execute(self, statement):  # noqa: ANN001
            return SimpleNamespace(
                all=lambda: [("Kraków", "rcn-1261-krakow-city")]
            )

    scopes = rcn_transactions._scopes_crossing_market_window(
        Session(),
        source_id=7,
        previous_refresh_at=refresh_at - timedelta(days=1),
        refresh_at=refresh_at,
    )

    assert scopes == {("Kraków", "rcn-1261-krakow-city")}


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
            return source

        def scalars(self, statement):
            return SimpleNamespace(all=lambda: [])

        def add(self, row):
            self.added.append(row)

        def flush(self):
            return None

        def expire_all(self):
            return None

    session = Session()
    monkeypatch.setattr(rcn_transactions, "refresh_market_metrics", lambda *args, **kwargs: {})
    result = rcn_transactions.import_rcn_transactions(
        session,
        path,
        source_name="RCN GUGiK",
    )

    assert result.transactions_created == 1
    assert result.transactions_changed == 0
    assert result.transactions_reconfirmed == 0
    assert any(isinstance(row, TransactionObservation) for row in session.added)
    assert not any(row.__class__.__name__ == "ListingSnapshot" for row in session.added)


def test_load_rcn_features_adds_stable_sort_and_paginates_with_start_index(monkeypatch):
    requested_urls = []

    def page(*ids):
        members = "".join(
            f'<wfs:member><ms:lokale gml:id="lokale.{item}">'
            f"<ms:tran_lokalny_id_iip>{item}</ms:tran_lokalny_id_iip>"
            "</ms:lokale></wfs:member>"
            for item in ids
        )
        return (
            '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" '
            'xmlns:ms="http://mapserver.gis.umn.edu/mapserver" '
            'xmlns:gml="http://www.opengis.net/gml">'
            f"{members}</wfs:FeatureCollection>"
        ).encode()

    def fake_fetch(url, **kwargs):  # noqa: ANN001
        requested_urls.append(url)
        start_index = int(parse_qs(urlparse(url).query).get("STARTINDEX", ["0"])[0])
        return page("1", "2") if start_index == 0 else page("3")

    monkeypatch.setattr(rcn_transactions, "_fetch", fake_fetch)

    features = rcn_transactions.load_rcn_features(
        "https://mapy.geoportal.gov.pl/wss/service/rcn?service=WFS&request=GetFeature"
        "&typeNames=ms%3Alokale&count=2&BBOX=1,2,3,4,EPSG%3A2180"
    )

    assert [item["tran_lokalny_id_iip"] for item in features] == ["1", "2", "3"]
    first_query = parse_qs(urlparse(requested_urls[0]).query)
    second_query = parse_qs(urlparse(requested_urls[1]).query)
    assert first_query["sortBy"] == [rcn_transactions.DEFAULT_RCN_SORT_BY]
    assert second_query["STARTINDEX"] == ["2"]


def test_import_rcn_transactions_distinguishes_new_changed_and_reconfirmed(monkeypatch, tmp_path):
    path = tmp_path / "rcn.json"
    features = [
        _feature(tran_wersja_id="2026-01-10T12:00:00"),
        _feature(tran_wersja_id="2026-02-10T12:00:00"),
        _feature(
            tran_lokalny_id_iip="transaction-2",
            tran_wersja_id="2026-02-11T12:00:00",
        ),
        _feature(
            tran_lokalny_id_iip="transaction-3",
            tran_wersja_id="2026-02-12T12:00:00",
            lok_funkcja="inne",
        ),
        _feature(
            tran_lokalny_id_iip="transaction-4",
            tran_wersja_id="2026-02-13T12:00:00",
            lok_funkcja="inne",
        ),
    ]
    path.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
    source = SimpleNamespace(
        id=7,
        name="RCN GUGiK",
        base_url="https://mapy.geoportal.gov.pl/wss/service/rcn",
        source_type="transaction_register",
        legal_status="approved",
        ingestion_method="rcn_wfs",
        allowed_use_json=["market_metrics", "reports"],
        is_demo=False,
        is_active=True,
    )
    existing = SimpleNamespace(
        source_id=7,
        source_observation_id=("PL.PZGiK.RCN:transaction-1:2026-01-10T12:00:00"),
        source_version="2026-01-10T12:00:00",
    )

    class Session:
        def __init__(self):
            self.added = []

        def scalar(self, statement):
            return source

        def scalars(self, statement):
            return SimpleNamespace(all=lambda: [existing])

        def add(self, row):
            self.added.append(row)

        def flush(self):
            return None

        def expire_all(self):
            return None

    monkeypatch.setattr(
        rcn_transactions,
        "assign_transaction_districts",
        lambda session, **kwargs: {
            "matched": 0,
            "reset": 0,
            "unresolved": 0,
            "affected_scopes": [],
        },
    )
    monkeypatch.setattr(rcn_transactions, "refresh_market_metrics", lambda *args, **kwargs: {})

    result_session = Session()
    result = rcn_transactions.import_rcn_transactions(
        result_session,
        path,
        source_name="RCN GUGiK",
    )

    assert result.transactions_created == 1
    assert result.transactions_changed == 1
    assert result.transactions_reconfirmed == 1
    assert result.rows_rejected == 2
    assert result.rejection_reason_counts == {
        "non-residential RCN feature rejected.": 2,
    }
    assert result.latest_source_version == "2026-02-11T12:00:00"
    assert result.latest_transaction_date == "2026-01-08"
    assert len(result.accepted_snapshot_fingerprint or "") == 64
    quality_logs = [row for row in result_session.added if isinstance(row, DataQualityLog)]
    assert len(quality_logs) == 1
    assert quality_logs[0].payload["count"] == 2
    assert quality_logs[0].payload["sample_rows"] == [4, 5]


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


def test_boundary_manifest_supports_multiple_major_cities(tmp_path):
    manifest = tmp_path / "districts.json"
    manifest.write_text(
        json.dumps(
            [
                {
                    "city": "Warszawa",
                    "location": "warszawa.geojson",
                    "source_name": "Warszawa Open Data",
                    "source_url": "https://mapa.um.warszawa.pl/",
                    "source_crs": 2180,
                },
                {
                    "city": "Kraków",
                    "location": "krakow.geojson",
                    "source_name": "MSIP Kraków",
                    "source_crs": 2180,
                },
            ]
        ),
        encoding="utf-8",
    )

    configs = load_district_boundary_manifest(manifest)

    assert [config.city for config in configs] == ["Warszawa", "Kraków"]
    assert configs[0].location == str(tmp_path / "warszawa.geojson")
    assert configs[1].source_url is None


def test_boundary_import_accepts_an_explicit_non_wroclaw_city(tmp_path):
    path = tmp_path / "warszawa.geojson"
    path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"DZIELNICA": "Mokotów"},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[1, 1], [2, 1], [2, 2], [1, 1]]],
                        },
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    result = import_district_boundaries(
        SimpleNamespace(),
        path,
        city="Warszawa",
        source_name="Warszawa Open Data",
        source_url="https://mapa.um.warszawa.pl/",
        source_crs=2180,
        dry_run=True,
    )

    assert result.city == "Warszawa"
    assert result.rows_seen == 1
    assert result.dry_run is True


def test_assignment_returns_old_and_new_market_scopes():
    class Session:
        def __init__(self):
            self.scalar_results = iter([2, 1])

        def scalar(self, statement):  # noqa: ANN001
            return next(self.scalar_results)

        def scalars(self, statement):  # noqa: ANN001
            return SimpleNamespace(all=lambda: ["Warszawa"])

        def execute(self, statement, parameters):  # noqa: ANN001
            assert parameters == {"cities": ["Warszawa"]}
            return SimpleNamespace(
                fetchall=lambda: [
                    (
                        "Warszawa",
                        "rcn-1465-warszawa-city",
                        "warszawa-mokotow",
                        True,
                    ),
                    (
                        "Warszawa",
                        "warszawa-old-boundary",
                        "rcn-1465-warszawa-city",
                        False,
                    ),
                ]
            )

    result = assign_transaction_districts(Session(), cities={"Warszawa"})

    assert result["matched"] == 1
    assert result["reset"] == 1
    assert result["unresolved"] == 1
    assert result["cities"] == ["Warszawa"]
    assert result["affected_scopes"] == [
        ("Warszawa", "rcn-1465-warszawa-city"),
        ("Warszawa", "warszawa-mokotow"),
        ("Warszawa", "warszawa-old-boundary"),
    ]
