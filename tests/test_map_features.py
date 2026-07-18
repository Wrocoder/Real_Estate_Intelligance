from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_map_features_returns_listings_planned_investments_and_infrastructure() -> None:
    response = client.get("/api/v1/map/features")
    payload = response.json()

    assert response.status_code == 200
    assert payload["type"] == "FeatureCollection"
    assert payload["metadata"]["listing_count"] >= 3
    assert payload["metadata"]["planned_investment_count"] >= 4
    assert payload["metadata"]["infrastructure_count"] >= 10
    assert payload["metadata"]["infrastructure_counts"]["transport_stop_count"] >= 2
    assert payload["metadata"]["infrastructure_counts"]["school_count"] >= 2
    assert payload["metadata"]["administrative_layer_count"] >= 3
    assert payload["metadata"]["administrative_counts"]["district_boundary_count"] >= 3

    feature_types = {feature["properties"]["feature_type"] for feature in payload["features"]}
    assert {
        "listing",
        "planned_investment",
        "transport_stop",
        "school",
        "kindergarten",
        "amenity",
        "industrial_zone",
        "district_boundary",
        "municipality_boundary",
        "voivodeship_boundary",
    } <= feature_types

    listing = next(
        feature
        for feature in payload["features"]
        if feature["properties"].get("listing_id") == "wr-001"
    )
    assert listing["geometry"]["coordinates"] == [16.9653, 51.1117]
    assert listing["properties"]["price_label"] == "690k zł"
    assert 0 <= listing["properties"]["investment_score"] <= 100

    stop = next(
        feature
        for feature in payload["features"]
        if feature["properties"].get("reference_id") == "stop-wroclaw-nowy-dwor-pr"
    )
    assert stop["geometry"]["coordinates"] == [16.9671, 51.1125]
    assert stop["properties"]["feature_type"] == "transport_stop"
    assert stop["properties"]["lines_label"] == "13, 23, 142"

    district_boundary = next(
        feature
        for feature in payload["features"]
        if feature["properties"].get("reference_id") == "wroclaw-fabryczna"
    )
    assert district_boundary["geometry"]["type"] == "Polygon"
    assert district_boundary["properties"]["feature_type"] == "district_boundary"
    assert district_boundary["properties"]["geometry_accuracy"] == "approximate"
    assert district_boundary["properties"]["median_price_per_m2"] == 11800


def test_map_features_supports_bbox_filter() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={"bbox": "16.94,51.09,16.99,51.13"},
    )
    payload = response.json()

    assert response.status_code == 200
    listing_ids = {
        feature["properties"].get("listing_id")
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "listing"
    }
    assert listing_ids == {"wr-001"}
    infrastructure_ids = {
        feature["properties"].get("reference_id")
        for feature in payload["features"]
        if feature["properties"]["feature_type"] != "listing"
        and feature["properties"]["feature_type"] != "planned_investment"
    }
    assert "stop-wroclaw-nowy-dwor-pr" in infrastructure_ids
    assert "stop-wroclaw-jagodno-buforowa" not in infrastructure_ids


def test_map_features_supports_district_infrastructure_filter() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={"city": "Wrocław", "district": "Fabryczna"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["infrastructure_count"] >= 1
    infrastructure_features = [
        feature
        for feature in payload["features"]
        if feature["properties"]["feature_type"]
        in {"transport_stop", "school", "kindergarten", "amenity", "industrial_zone"}
    ]
    assert infrastructure_features
    assert {feature["properties"]["district"] for feature in infrastructure_features} == {
        "Fabryczna"
    }
    district_boundaries = [
        feature
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "district_boundary"
    ]
    assert {feature["properties"]["name"] for feature in district_boundaries} == {"Fabryczna"}


def test_map_features_supports_municipality_filter() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={"municipality": "Kobierzyce"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["filters"]["municipality"] == "Kobierzyce"
    assert payload["metadata"]["listing_count"] == 2
    listing_features = [
        feature
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "listing"
    ]
    assert {feature["properties"]["listing_id"] for feature in listing_features} == {
        "kob-001",
        "kob-002",
    }
    assert {feature["properties"]["municipality"] for feature in listing_features} == {
        "Kobierzyce"
    }


def test_map_features_does_not_return_default_administrative_layer_for_unknown_city() -> None:
    response = client.get("/api/v1/map/features", params={"city": "Warszawa"})
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["administrative_layer_count"] == 0
    assert payload["features"] == []


def test_map_features_supports_building_attribute_filters() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={
            "city": "Wrocław",
            "building_type": "low_rise_block",
            "renovation_state": "needs_refresh",
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["filters"]["building_type"] == "low_rise_block"
    assert payload["metadata"]["filters"]["renovation_state"] == "needs_refresh"
    listing_features = [
        feature
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "listing"
    ]
    assert {feature["properties"]["listing_id"] for feature in listing_features} == {"wr-003"}
    assert listing_features[0]["properties"]["building_type"] == "low_rise_block"
    assert listing_features[0]["properties"]["renovation_state"] == "needs_refresh"


def test_map_features_supports_lifestyle_filters() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={
            "city": "Wrocław",
            "has_elevator": True,
            "parking_type": "garage",
            "heating_type": "heat_pump",
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["filters"]["has_elevator"] is True
    assert payload["metadata"]["filters"]["parking_type"] == "garage"
    listing_features = [
        feature
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "listing"
    ]
    assert {feature["properties"]["listing_id"] for feature in listing_features} == {"wr-002"}
    assert listing_features[0]["properties"]["has_elevator"] is True
    assert listing_features[0]["properties"]["heating_type"] == "heat_pump"


def test_map_features_supports_radius_and_score_filters() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={
            "lat": 51.1079,
            "lon": 17.0385,
            "radius_km": 8,
            "min_investment_score": 40,
            "max_risk_score": 60,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["filters"]["radius_km"] == 8.0
    assert payload["metadata"]["listing_count"] >= 1
    assert all(
        feature["properties"]["investment_score"] >= 40
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "listing"
    )


def test_map_features_supports_floor_and_building_year_filters() -> None:
    response = client.get(
        "/api/v1/map/features",
        params={
            "city": "Wrocław",
            "min_floor": 2,
            "max_floor": 4,
            "max_building_floors": 6,
            "min_building_year": 2010,
            "max_building_year": 2013,
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["metadata"]["filters"]["min_floor"] == 2
    assert payload["metadata"]["filters"]["max_building_year"] == 2013
    listing_features = [
        feature
        for feature in payload["features"]
        if feature["properties"]["feature_type"] == "listing"
    ]
    assert {feature["properties"]["listing_id"] for feature in listing_features} == {"wr-001"}
    assert listing_features[0]["properties"]["floor"] == 3
    assert listing_features[0]["properties"]["building_floors"] == 6
    assert listing_features[0]["properties"]["building_year"] == 2012


def test_map_features_rejects_invalid_bbox() -> None:
    response = client.get("/api/v1/map/features", params={"bbox": "not-a-bbox"})

    assert response.status_code == 400
    assert "bbox" in response.json()["detail"]


def test_map_features_radius_requires_center() -> None:
    response = client.get("/api/v1/map/features", params={"radius_km": 5})

    assert response.status_code == 400
    assert response.json()["detail"] == "radius_km requires lat and lon"
