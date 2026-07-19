import hashlib
import json
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from math import ceil
from threading import Lock
from typing import Any, cast
from uuid import uuid4

from domarion.core.config import Settings
from domarion.schemas import (
    ApiLiteListing,
    ApiLiteListingDetail,
    ApiLiteListingEvent,
    ApiLiteListingScore,
    ApiLiteUsageLog,
    ApiLiteUsageSummary,
    ListingAnalysis,
    SubscriptionPlan,
)
from domarion.services.plans import PLAN_LIMITS

DEFAULT_LOCAL_API_LITE_KEY = "domarion-local-api-key"
DEFAULT_API_LITE_SCOPES = (
    "listings:read",
    "scores:read",
    "areas:read",
    "usage:read",
)


class ApiLiteConfigurationError(ValueError):
    pass


@dataclass(frozen=True)
class ApiLitePrincipal:
    key_id: str
    label: str
    owner_id: str
    plan: SubscriptionPlan
    scopes: tuple[str, ...]
    monthly_quota: int
    rate_limit_per_minute: int

    def can_access(self, scope: str) -> bool:
        return "*" in self.scopes or scope in self.scopes


class MemoryApiLiteUsageTracker:
    def __init__(self) -> None:
        self._logs: list[ApiLiteUsageLog] = []
        self._lock = Lock()

    def clear(self) -> None:
        with self._lock:
            self._logs.clear()

    def record(
        self,
        principal: ApiLitePrincipal,
        *,
        endpoint: str,
        method: str,
        status_code: int,
        request_units: int = 1,
        metadata: dict[str, Any] | None = None,
    ) -> ApiLiteUsageLog:
        event = ApiLiteUsageLog(
            id=f"apiuse_{uuid4().hex[:12]}",
            key_id=principal.key_id,
            owner_id=principal.owner_id,
            plan=principal.plan,
            endpoint=endpoint,
            method=method.upper(),
            status_code=status_code,
            request_units=request_units,
            created_at=datetime.now(UTC),
            metadata=metadata or {},
        )
        with self._lock:
            self._logs.append(event)
        return event

    def used_units(self, key_id: str, period: str | None = None) -> int:
        target_period = period or current_api_lite_period()
        with self._lock:
            return sum(
                log.request_units
                for log in self._logs
                if log.key_id == key_id and _usage_period(log.created_at) == target_period
            )

    def recent_units(self, key_id: str, *, since: datetime) -> int:
        with self._lock:
            return sum(
                log.request_units
                for log in self._logs
                if log.key_id == key_id and log.created_at >= since
            )

    def list_logs(
        self,
        key_id: str,
        *,
        period: str | None = None,
        limit: int = 50,
    ) -> list[ApiLiteUsageLog]:
        target_period = period or current_api_lite_period()
        with self._lock:
            logs = [
                log
                for log in self._logs
                if log.key_id == key_id and _usage_period(log.created_at) == target_period
            ]
        return sorted(logs, key=lambda item: item.created_at, reverse=True)[:limit]


memory_api_lite_usage_tracker = MemoryApiLiteUsageTracker()


def resolve_api_lite_key(api_key: str, settings: Settings) -> ApiLitePrincipal | None:
    normalized_key = api_key.strip()
    if not normalized_key:
        return None

    for configured_key, configured_hash, principal in _configured_api_lite_keys(settings):
        if configured_key and secrets.compare_digest(normalized_key, configured_key):
            return principal
        if configured_hash and secrets.compare_digest(_sha256(normalized_key), configured_hash):
            return principal
    return None


def current_api_lite_period() -> str:
    return _usage_period(datetime.now(UTC))


def api_lite_request_units(page_size: int | None = None) -> int:
    if page_size is None:
        return 1
    return max(1, ceil(page_size / 25))


def build_api_lite_listing(analysis: ListingAnalysis) -> ApiLiteListing:
    listing = analysis.listing
    return ApiLiteListing(
        id=listing.id,
        title=listing.title,
        source_name=listing.source_name,
        city=listing.city,
        district=listing.district,
        area_id=listing.area_id,
        municipality=listing.municipality,
        address=listing.address,
        market_type=listing.market_type,
        building_type=listing.building_type,
        renovation_state=listing.renovation_state,
        has_balcony=listing.has_balcony,
        has_terrace=listing.has_terrace,
        has_garden=listing.has_garden,
        has_elevator=listing.has_elevator,
        parking_type=listing.parking_type,
        heating_type=listing.heating_type,
        developer_id=listing.developer_id,
        developer_name=listing.developer_name,
        investment_name=listing.investment_name,
        primary_market_project_id=listing.primary_market_project_id,
        price=listing.price,
        currency=listing.currency,
        area_m2=listing.area_m2,
        price_per_m2=listing.price_per_m2,
        rooms=listing.rooms,
        floor=listing.floor,
        building_floors=listing.building_floors,
        building_year=listing.building_year,
        first_seen_at=listing.first_seen_at,
        last_seen_at=listing.last_seen_at,
        days_on_market=listing.days_on_market,
        price_reductions=listing.price_reductions,
        price_increases=listing.price_increases,
        relisted=listing.relisted,
        lat=listing.lat,
        lon=listing.lon,
        distance_to_center_km=listing.distance_to_center_km,
        nearest_stop_m=listing.nearest_stop_m,
        nearest_school_m=listing.nearest_school_m,
        nearest_major_road_m=listing.nearest_major_road_m,
        nearest_industrial_zone_m=listing.nearest_industrial_zone_m,
        parks_within_1km=listing.parks_within_1km,
        schools_within_1km=listing.schools_within_1km,
        planned_investments_within_2km=listing.planned_investments_within_2km,
        data_quality_score=listing.data_quality_score,
        scores=_api_lite_scores(analysis),
        insights=analysis.insights,
        data_quality_notes=analysis.data_quality_notes,
        disclaimer=analysis.disclaimer,
    )


def build_api_lite_listing_detail(analysis: ListingAnalysis) -> ApiLiteListingDetail:
    base = build_api_lite_listing(analysis)
    developer_reputation = analysis.developer_reputation
    risk_signals_count = 0
    if developer_reputation is not None:
        risk_signals_count = len(developer_reputation.risk_signals)
    return ApiLiteListingDetail(
        **base.model_dump(),
        area_statistics=analysis.area_statistics,
        price_history=analysis.price_history,
        listing_events=[
            ApiLiteListingEvent(
                listing_id=event.listing_id,
                event_type=event.event_type,
                observed_at=event.observed_at,
                summary=event.summary,
            )
            for event in analysis.listing_events
        ],
        comparable_listing_ids=[listing.id for listing in analysis.comparables],
        comparables_count=len(analysis.comparables),
        developer_reputation_score=(
            developer_reputation.reputation_score if developer_reputation is not None else None
        ),
        developer_confidence_score=(
            developer_reputation.confidence_score if developer_reputation is not None else None
        ),
        developer_risk_signals_count=risk_signals_count,
    )


def build_api_lite_usage_summary(
    principal: ApiLitePrincipal,
    *,
    limit: int = 50,
) -> ApiLiteUsageSummary:
    period = current_api_lite_period()
    used_units = memory_api_lite_usage_tracker.used_units(principal.key_id, period)
    return ApiLiteUsageSummary(
        key_id=principal.key_id,
        label=principal.label,
        owner_id=principal.owner_id,
        plan=principal.plan,
        scopes=list(principal.scopes),
        usage_period=period,
        monthly_quota=principal.monthly_quota,
        rate_limit_per_minute=principal.rate_limit_per_minute,
        used_units=used_units,
        remaining_units=max(0, principal.monthly_quota - used_units),
        logs=memory_api_lite_usage_tracker.list_logs(
            principal.key_id,
            period=period,
            limit=limit,
        ),
    )


def _api_lite_scores(analysis: ListingAnalysis) -> ApiLiteListingScore:
    scores = analysis.scores
    return ApiLiteListingScore(
        formula_version=scores.formula_version,
        weights_profile=scores.weights_profile,
        decision_label=scores.decision_label,
        price_label=scores.price_label,
        risk_label=scores.risk_label,
        negotiation_label=scores.negotiation_label,
        liquidity_label=scores.liquidity_label,
        rental_potential_label=scores.rental_potential_label,
        investment_score=scores.investment_score,
        risk_score=scores.risk_score,
        negotiation_score=scores.negotiation_score,
        liquidity_score=scores.liquidity_score,
        rental_potential_score=scores.rental_potential_score,
        fair_price_low=scores.fair_price_low,
        fair_price_mid=scores.fair_price_mid,
        fair_price_high=scores.fair_price_high,
        fair_price_confidence_score=scores.fair_price_confidence_score,
        price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
        reasons=scores.reasons,
        warnings=scores.warnings,
    )


def _configured_api_lite_keys(
    settings: Settings,
) -> list[tuple[str | None, str | None, ApiLitePrincipal]]:
    raw_config = settings.api_lite_keys_json
    if not raw_config:
        if settings.environment.casefold() in {"local", "test", "development"}:
            return [
                (
                    DEFAULT_LOCAL_API_LITE_KEY,
                    None,
                    ApiLitePrincipal(
                        key_id="local-demo-key",
                        label="Local demo API key",
                        owner_id=settings.demo_user_id,
                        plan="enterprise",
                        scopes=DEFAULT_API_LITE_SCOPES,
                        monthly_quota=settings.api_lite_default_monthly_quota,
                        rate_limit_per_minute=settings.api_lite_default_rate_limit_per_minute,
                    ),
                )
            ]
        return []

    try:
        decoded = json.loads(raw_config)
    except json.JSONDecodeError as exc:
        raise ApiLiteConfigurationError("API_LITE_KEYS_JSON must be valid JSON") from exc

    records = [decoded] if isinstance(decoded, dict) else decoded
    if not isinstance(records, list):
        raise ApiLiteConfigurationError("API_LITE_KEYS_JSON must be an object or list of objects")

    configured: list[tuple[str | None, str | None, ApiLitePrincipal]] = []
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise ApiLiteConfigurationError("API_LITE_KEYS_JSON items must be objects")
        if record.get("active", True) is False:
            continue
        configured.append(_configured_key_from_record(record, index, settings))
    return configured


def _configured_key_from_record(
    record: dict[str, Any],
    index: int,
    settings: Settings,
) -> tuple[str | None, str | None, ApiLitePrincipal]:
    raw_key = _optional_str(record.get("key"))
    raw_hash = _optional_str(record.get("key_sha256"))
    if raw_key is None and raw_hash is None:
        raise ApiLiteConfigurationError("API-lite key config requires key or key_sha256")

    plan_name = _optional_str(record.get("plan")) or "enterprise"
    if plan_name not in PLAN_LIMITS:
        raise ApiLiteConfigurationError(f"Unsupported API-lite plan: {plan_name}")
    plan = cast(SubscriptionPlan, plan_name)

    monthly_quota = int(record.get("monthly_quota") or settings.api_lite_default_monthly_quota)
    if monthly_quota < 1:
        raise ApiLiteConfigurationError("API-lite monthly_quota must be positive")
    rate_limit_per_minute = int(
        record.get("rate_limit_per_minute") or settings.api_lite_default_rate_limit_per_minute
    )
    if rate_limit_per_minute < 1:
        raise ApiLiteConfigurationError("API-lite rate_limit_per_minute must be positive")

    scopes = _scopes(record.get("scopes"))
    key_id = _optional_str(record.get("key_id")) or _default_key_id(raw_key, raw_hash, index)
    return (
        raw_key,
        raw_hash.casefold() if raw_hash else None,
        ApiLitePrincipal(
            key_id=key_id,
            label=_optional_str(record.get("label")) or key_id,
            owner_id=_optional_str(record.get("owner_id")) or settings.demo_user_id,
            plan=plan,
            scopes=scopes,
            monthly_quota=monthly_quota,
            rate_limit_per_minute=rate_limit_per_minute,
        ),
    )


def _scopes(value: Any) -> tuple[str, ...]:
    if value is None:
        return DEFAULT_API_LITE_SCOPES
    if not isinstance(value, list):
        raise ApiLiteConfigurationError("API-lite scopes must be a list")
    scopes = tuple(str(item).strip() for item in value if str(item).strip())
    return scopes or DEFAULT_API_LITE_SCOPES


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _default_key_id(raw_key: str | None, raw_hash: str | None, index: int) -> str:
    if raw_hash:
        return f"key_{raw_hash[:12]}"
    if raw_key:
        return f"key_{_sha256(raw_key)[:12]}"
    return f"key_{index + 1}"


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _usage_period(value: datetime) -> str:
    return value.strftime("%Y-%m")


def api_lite_rate_limit_window() -> datetime:
    return datetime.now(UTC) - timedelta(minutes=1)
