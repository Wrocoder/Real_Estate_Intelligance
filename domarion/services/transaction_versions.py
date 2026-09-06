"""Identity and current-version selection for transaction-register observations."""

from collections.abc import Iterable
from datetime import datetime

from domarion.db.models import TransactionObservation


def transaction_identity(source_observation_id: str, source_version: str | None) -> str:
    """Remove the explicit source version from an immutable observation key."""

    if source_version:
        suffix = f":{source_version}"
        if source_observation_id.endswith(suffix):
            return source_observation_id[: -len(suffix)]
    return source_observation_id


def latest_transaction_versions(
    rows: Iterable[TransactionObservation],
) -> list[TransactionObservation]:
    """Keep only the latest source version of each logical transaction."""

    latest: dict[tuple[int, str], TransactionObservation] = {}
    for row in rows:
        key = (
            row.source_id,
            transaction_identity(row.source_observation_id, row.source_version),
        )
        current = latest.get(key)
        if current is None or _version_rank(row) > _version_rank(current):
            latest[key] = row
    return list(latest.values())


def _version_rank(row: TransactionObservation) -> tuple[str, datetime, int]:
    return (
        row.source_version or "",
        row.observed_at or datetime.min,
        row.id or 0,
    )
