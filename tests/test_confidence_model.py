from datetime import date, datetime, time, timedelta

import pytest

from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import FairPriceConfidence
from domarion.services.scoring import calculate_scores

AS_OF = date(2026, 9, 16)


def evidence_fixture():
    repository = InMemoryRealEstateRepository(include_demo_data=True)
    subject = repository.get_listing("wr-001")
    subject = subject.model_copy(
        update={
            "last_seen_at": AS_OF,
            "floor": 0,
            "building_year": 2010,
            "building_type": "apartment",
            "renovation_state": "move_in_ready",
            "data_provenance": subject.data_provenance.model_copy(
                update={
                    "mode": "live",
                    "source_type": "partner_feed",
                }
            ),
        }
    )
    area = repository.get_area_statistics(subject.area_id)
    area = area.model_copy(
        update={
            "data_provenance": area.data_provenance.model_copy(
                update={
                    "mode": "live",
                    "source_type": "listing_market_statistics",
                    "sample_size": 20,
                    "updated_at": datetime.combine(AS_OF, time()),
                }
            )
        }
    )
    comparables = [subject.model_copy(update={"id": f"fixture-{i}"}) for i in range(5)]
    return subject, area, comparables


def test_complete_nearby_fresh_sample_is_high_and_measured():
    subject, area, comparables = evidence_fixture()
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.display_level == "high"
    assert confidence.median_distance_m == 0
    assert confidence.distance_observation_count == 5
    assert confidence.median_age_days == 0
    assert confidence.missing_property_fields == []
    assert confidence.model_version == "fair-price-confidence-v2"


@pytest.mark.parametrize("missing", ["lat", "floor", "building_year", "renovation_state"])
def test_missing_attributes_reduce_confidence_without_fabricated_measurements(missing):
    subject, area, comparables = evidence_fixture()
    subject = subject.model_copy(update={missing: None})
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.level != "high"
    assert confidence.missing_property_fields
    if missing == "lat":
        assert confidence.median_distance_m is None
        factor = next(item for item in confidence.factors if item.code == "geographic_scope")
        assert factor.score is None
        assert factor.status == "unknown"


@pytest.mark.parametrize("days,code", [(181, "evidence_stale"), (-1, "evidence_date_in_future")])
def test_stale_and_future_dates_cannot_produce_high_confidence(days, code):
    subject, area, comparables = evidence_fixture()
    comparables = [
        item.model_copy(update={"last_seen_at": AS_OF - timedelta(days=days)})
        for item in comparables
    ]
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.level == "low"
    assert code in confidence.limitation_codes
    if days < 0:
        assert confidence.evidence_status == "insufficient"
        assert confidence.median_age_days is None


def test_no_evidence_is_insufficient_not_neutral_and_widens_range():
    subject, area, _ = evidence_fixture()
    area = area.model_copy(
        update={
            "data_provenance": area.data_provenance.model_copy(
                update={
                    "sample_size": None,
                    "updated_at": None,
                    "source_type": "unknown",
                }
            )
        }
    )
    scores = calculate_scores(subject, area, [], evaluation_date=AS_OF)
    confidence = scores.fair_price_confidence
    assert confidence.display_level == "insufficient"
    assert confidence.score == 0
    assert confidence.median_similarity_score is None
    assert confidence.price_dispersion_pct is None
    assert scores.fair_price_evidence.range_half_width_pct == 20
    assert all(
        item.score is None
        for item in confidence.factors
        if item.code in {"relevance", "price_consistency", "source_quality"}
    )


def test_transaction_counts_do_not_fabricate_matched_apartments():
    subject, area, _ = evidence_fixture()
    area = area.model_copy(
        update={
            "price_basis": "transaction_observed",
            "transaction_observation_count": 100,
            "transaction_observed_to": datetime.combine(AS_OF, time()),
        }
    )
    confidence = calculate_scores(subject, area, [], evaluation_date=AS_OF).fair_price_confidence
    assert confidence.evidence_status == "sufficient"
    assert confidence.level != "high"
    assert confidence.comparable_count == 0
    assert confidence.median_distance_m is None
    assert confidence.median_similarity_score is None


def test_price_dispersion_and_unknown_baseline_limit_confidence():
    subject, area, comparables = evidence_fixture()
    comparables[0] = comparables[0].model_copy(update={"price_per_m2": 3000})
    area = area.model_copy(
        update={"data_provenance": area.data_provenance.model_copy(update={"updated_at": None})}
    )
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.level == "low"
    assert {"comparable_prices_inconsistent", "baseline_recency_unknown"} <= set(
        confidence.limitation_codes
    )


def test_old_payload_remains_readable_without_inventing_measurements():
    confidence = FairPriceConfidence(
        level="low", score=30, comparable_count=1, transaction_observation_count=0
    )
    assert confidence.model_version == "fair-price-confidence-v1"
    assert confidence.evidence_status is None
    assert confidence.evaluated_at is None


def test_three_comparables_produce_medium_confidence():
    subject, area, comparables = evidence_fixture()
    comparables = [item.model_copy(update={"lat": subject.lat + 0.02}) for item in comparables[:3]]
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.display_level == "medium"


def test_demo_evidence_cannot_have_high_confidence():
    subject, area, comparables = evidence_fixture()
    comparables[0] = comparables[0].model_copy(
        update={
            "data_provenance": comparables[0].data_provenance.model_copy(update={"mode": "demo"})
        }
    )
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.level == "low"
    assert "demo_evidence" in confidence.limitation_codes


def test_unknown_source_and_stale_baseline_are_explicit_limits():
    subject, area, comparables = evidence_fixture()
    area = area.model_copy(
        update={
            "data_provenance": area.data_provenance.model_copy(
                update={
                    "updated_at": datetime.combine(AS_OF - timedelta(days=366), time()),
                    "source_type": "unknown",
                }
            )
        }
    )
    confidence = calculate_scores(
        subject, area, comparables, evaluation_date=AS_OF
    ).fair_price_confidence
    assert confidence.level == "low"
    assert {"source_quality_unknown", "baseline_stale"} <= set(confidence.limitation_codes)
