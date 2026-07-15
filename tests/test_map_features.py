from fastapi.testclient import TestClient

from domarion.main import app

client = TestClient(app)


def test_map_features_returns_listings_and_planned_investments() -> None:
    response = client.get("/api/v1/map/features")
    payload = response.json()

    assert response.status_code == 200
    assert payload["type"] == "FeatureCollection"
    assert payload["metadata"]["listing_count"] >= 3
    assert payload["metadata"]["planned_investment_count"] >= 4

    feature_types = {feature["properties"]["feature_type"] for feature in payload["features"]}
    assert feature_types == {"listing", "planned_investment"}

    listing = next(
        feature
        for feature in payload["features"]
        if feature["properties"].get("listing_id") == "wr-001"
    )
    assert listing["geometry"]["coordinates"] == [16.9653, 51.1117]
    assert listing["properties"]["price_label"] == "690k zł"
    assert 0 <= listing["properties"]["investment_score"] <= 100


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
