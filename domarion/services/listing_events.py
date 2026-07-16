from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import date
from typing import Any

from domarion.schemas import ListingEvent, ListingEventType

TRACKED_PARAMETER_FIELDS = (
    "title",
    "area_m2",
    "rooms",
    "floor",
    "building_floors",
    "building_year",
    "market_type",
)
REMOVED_STATUSES = {"removed", "inactive", "delisted", "sold", "expired"}


@dataclass(frozen=True)
class ListingEventInput:
    listing_id: str
    observed_at: date
    price: int
    price_per_m2: int
    payload: Mapping[str, Any]
    description_hash: str | None = None
    snapshot_id: int | None = None


@dataclass(frozen=True)
class DerivedListingEvent:
    listing_id: str
    event_type: ListingEventType
    observed_at: date
    summary: str
    payload: dict[str, Any]
    snapshot_id: int | None = None
    previous_snapshot_id: int | None = None

    def to_schema(self) -> ListingEvent:
        return ListingEvent(
            listing_id=self.listing_id,
            event_type=self.event_type,
            observed_at=self.observed_at,
            summary=self.summary,
            payload=self.payload,
        )


def derive_listing_events(
    snapshots: Sequence[ListingEventInput],
) -> list[DerivedListingEvent]:
    ordered = sorted(snapshots, key=lambda item: item.observed_at)
    if not ordered:
        return []

    first = ordered[0]
    events = [_first_seen_event(first)]
    for previous, current in zip(ordered, ordered[1:], strict=False):
        events.extend(_price_events(previous, current))
        parameter_event = _parameter_event(previous, current)
        if parameter_event is not None:
            events.append(parameter_event)
        description_event = _description_event(previous, current)
        if description_event is not None:
            events.append(description_event)
        status_event = _status_event(previous, current)
        if status_event is not None:
            events.append(status_event)
        relisted_event = _relisted_event(previous, current)
        if relisted_event is not None:
            events.append(relisted_event)

    return events


def _first_seen_event(snapshot: ListingEventInput) -> DerivedListingEvent:
    return DerivedListingEvent(
        listing_id=snapshot.listing_id,
        event_type="first_seen",
        observed_at=snapshot.observed_at,
        summary=f"Listing first seen at {snapshot.price} PLN.",
        payload={
            "price": snapshot.price,
            "price_per_m2": snapshot.price_per_m2,
            "rooms": snapshot.payload.get("rooms"),
            "area_m2": snapshot.payload.get("area_m2"),
        },
        snapshot_id=snapshot.snapshot_id,
    )


def _price_events(
    previous: ListingEventInput,
    current: ListingEventInput,
) -> list[DerivedListingEvent]:
    if current.price == previous.price:
        return []

    event_type: ListingEventType = (
        "price_reduced" if current.price < previous.price else "price_increased"
    )
    delta = current.price - previous.price
    delta_pct = round(delta / previous.price * 100, 2) if previous.price else 0
    direction = "reduced" if delta < 0 else "increased"
    return [
        DerivedListingEvent(
            listing_id=current.listing_id,
            event_type=event_type,
            observed_at=current.observed_at,
            summary=(
                f"Price {direction} from {previous.price} PLN to {current.price} PLN."
            ),
            payload={
                "previous_price": previous.price,
                "current_price": current.price,
                "delta": delta,
                "delta_pct": delta_pct,
                "previous_price_per_m2": previous.price_per_m2,
                "current_price_per_m2": current.price_per_m2,
            },
            snapshot_id=current.snapshot_id,
            previous_snapshot_id=previous.snapshot_id,
        )
    ]


def _parameter_event(
    previous: ListingEventInput,
    current: ListingEventInput,
) -> DerivedListingEvent | None:
    changes = {}
    for field in TRACKED_PARAMETER_FIELDS:
        previous_value = previous.payload.get(field)
        current_value = current.payload.get(field)
        if previous_value != current_value:
            changes[field] = {
                "previous": previous_value,
                "current": current_value,
            }

    if not changes:
        return None

    changed_fields = ", ".join(sorted(changes))
    return DerivedListingEvent(
        listing_id=current.listing_id,
        event_type="parameter_changed",
        observed_at=current.observed_at,
        summary=f"Listing parameters changed: {changed_fields}.",
        payload={"changes": changes},
        snapshot_id=current.snapshot_id,
        previous_snapshot_id=previous.snapshot_id,
    )


def _description_event(
    previous: ListingEventInput,
    current: ListingEventInput,
) -> DerivedListingEvent | None:
    previous_hash = _description_hash(previous)
    current_hash = _description_hash(current)
    if not previous_hash or not current_hash or previous_hash == current_hash:
        return None

    return DerivedListingEvent(
        listing_id=current.listing_id,
        event_type="description_changed",
        observed_at=current.observed_at,
        summary="Listing description hash changed.",
        payload={
            "previous_description_hash": previous_hash,
            "current_description_hash": current_hash,
        },
        snapshot_id=current.snapshot_id,
        previous_snapshot_id=previous.snapshot_id,
    )


def _status_event(
    previous: ListingEventInput,
    current: ListingEventInput,
) -> DerivedListingEvent | None:
    previous_status = _active_status(previous.payload)
    current_status = _active_status(current.payload)
    if previous_status == current_status:
        return None

    if current_status in REMOVED_STATUSES:
        return DerivedListingEvent(
            listing_id=current.listing_id,
            event_type="removed",
            observed_at=current.observed_at,
            summary="Listing was marked as removed from active sale.",
            payload={"previous_status": previous_status, "current_status": current_status},
            snapshot_id=current.snapshot_id,
            previous_snapshot_id=previous.snapshot_id,
        )

    if previous_status in REMOVED_STATUSES and current_status == "active":
        return DerivedListingEvent(
            listing_id=current.listing_id,
            event_type="republished",
            observed_at=current.observed_at,
            summary="Listing was marked as active again.",
            payload={"previous_status": previous_status, "current_status": current_status},
            snapshot_id=current.snapshot_id,
            previous_snapshot_id=previous.snapshot_id,
        )

    return None


def _relisted_event(
    previous: ListingEventInput,
    current: ListingEventInput,
) -> DerivedListingEvent | None:
    if _bool_value(current.payload.get("relisted")) and not _bool_value(
        previous.payload.get("relisted")
    ):
        return DerivedListingEvent(
            listing_id=current.listing_id,
            event_type="relisted",
            observed_at=current.observed_at,
            summary="Listing was marked as relisted.",
            payload={"previous_relisted": False, "current_relisted": True},
            snapshot_id=current.snapshot_id,
            previous_snapshot_id=previous.snapshot_id,
        )
    return None


def _active_status(payload: Mapping[str, Any]) -> str:
    raw_status = payload.get("active_status") or payload.get("status") or "active"
    return str(raw_status).strip().casefold() or "active"


def _description_hash(snapshot: ListingEventInput) -> str | None:
    raw_hash = snapshot.description_hash or snapshot.payload.get("description_hash")
    if raw_hash is None:
        return None
    normalized = str(raw_hash).strip()
    return normalized or None


def _bool_value(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().casefold() in {"1", "true", "yes", "y", "tak", "t"}
