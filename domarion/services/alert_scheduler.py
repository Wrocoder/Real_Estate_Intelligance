from datetime import UTC, datetime, timedelta

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Alert,
    AlertDeliveryBatchRequest,
    AlertDeliveryBatchResult,
    AlertDeliveryBatchSkip,
    AlertDeliveryJob,
    AlertDeliveryRequest,
)
from domarion.services.alert_delivery import build_alert_delivery_job
from domarion.services.alerts import build_alert_preview
from domarion.user_store.base import UserStore

DAILY_ALERT_COOLDOWN = timedelta(hours=24)


def run_daily_email_alert_delivery(
    repository: RealEstateRepository,
    user_store: UserStore,
    request: AlertDeliveryBatchRequest | None = None,
    now: datetime | None = None,
) -> AlertDeliveryBatchResult:
    payload = request or AlertDeliveryBatchRequest()
    timestamp = now or datetime.now(UTC)
    alerts = user_store.list_all_alerts(
        frequency="daily",
        channel="email",
        active_only=True,
        limit=payload.limit,
    )

    jobs: list[AlertDeliveryJob] = []
    skipped: list[AlertDeliveryBatchSkip] = []
    for alert in alerts:
        latest_delivery = user_store.get_latest_alert_delivery_job(
            alert.owner_id,
            alert.id,
            include_dry_run=False,
        )
        if not payload.force and _is_inside_cooldown(latest_delivery, timestamp):
            skipped.append(_cooldown_skip(alert, latest_delivery))
            continue

        preview = build_alert_preview(repository, alert, limit=payload.max_matches)
        job = build_alert_delivery_job(
            owner_id=alert.owner_id,
            owner_email=None,
            alert=alert,
            preview=preview,
            request=AlertDeliveryRequest(
                dry_run=payload.dry_run,
                max_matches=payload.max_matches,
            ),
        )
        if not payload.dry_run:
            job = user_store.save_alert_delivery_job(job)
        jobs.append(job)

    return AlertDeliveryBatchResult(
        frequency="daily",
        channel="email",
        dry_run=payload.dry_run,
        force=payload.force,
        alerts_seen=len(alerts),
        jobs_prepared=len(jobs),
        jobs_persisted=0 if payload.dry_run else len(jobs),
        delivered_count=sum(job.delivered_count for job in jobs),
        sent_count=sum(1 for job in jobs if job.status == "sent"),
        skipped_count=len(skipped) + sum(1 for job in jobs if job.status == "skipped"),
        failed_count=sum(1 for job in jobs if job.status == "failed"),
        jobs=jobs,
        skipped=skipped,
    )


def _is_inside_cooldown(job: AlertDeliveryJob | None, now: datetime) -> bool:
    if job is None:
        return False
    return _as_utc(job.created_at) > _as_utc(now) - DAILY_ALERT_COOLDOWN


def _cooldown_skip(
    alert: Alert,
    latest_delivery: AlertDeliveryJob | None,
) -> AlertDeliveryBatchSkip:
    return AlertDeliveryBatchSkip(
        owner_id=alert.owner_id,
        alert_id=alert.id,
        reason="cooldown",
        last_delivery_job_id=latest_delivery.id if latest_delivery else None,
        last_delivery_at=latest_delivery.created_at if latest_delivery else None,
    )


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
