from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol
from uuid import uuid4

from domarion.core import get_settings
from domarion.schemas import Alert, AlertDeliveryJob, AlertDeliveryRequest, AlertPreview


@dataclass(frozen=True)
class AlertDeliveryResult:
    provider: str
    status: str
    delivered_count: int
    message: str
    metadata: dict


class AlertChannelProvider(Protocol):
    def deliver(
        self,
        alert: Alert,
        preview: AlertPreview,
        owner_email: str | None,
        request: AlertDeliveryRequest,
    ) -> AlertDeliveryResult:
        raise NotImplementedError


class EmailAlertProvider:
    provider = "email:smtp"

    def deliver(
        self,
        alert: Alert,
        preview: AlertPreview,
        owner_email: str | None,
        request: AlertDeliveryRequest,
    ) -> AlertDeliveryResult:
        listing_ids = _preview_listing_ids(preview)
        target = alert.delivery_target or owner_email

        if request.dry_run:
            return _dry_run_result(alert.channel, listing_ids, target)
        if not listing_ids:
            return _skipped_result(self.provider, "No matching listings to deliver.", target)
        if not target:
            return _skipped_result(self.provider, "Email target is missing.", target)

        settings = get_settings()
        if not settings.alert_email_enabled or not settings.alert_smtp_host:
            return _skipped_result(
                self.provider,
                "Email delivery is not configured. "
                "Set ALERT_EMAIL_ENABLED=true and ALERT_SMTP_HOST.",
                target,
            )

        return AlertDeliveryResult(
            provider=self.provider,
            status="sent",
            delivered_count=1,
            message=f"Email alert accepted for {target}.",
            metadata={
                "target": target,
                "sender": settings.alert_email_sender,
                "smtp_host": settings.alert_smtp_host,
                "listing_ids": listing_ids,
            },
        )


class TelegramAlertProvider:
    provider = "telegram:bot-api"

    def deliver(
        self,
        alert: Alert,
        preview: AlertPreview,
        owner_email: str | None,
        request: AlertDeliveryRequest,
    ) -> AlertDeliveryResult:
        listing_ids = _preview_listing_ids(preview)
        target = alert.delivery_target

        if request.dry_run:
            return _dry_run_result(alert.channel, listing_ids, target)
        if not listing_ids:
            return _skipped_result(self.provider, "No matching listings to deliver.", target)
        if not target:
            return _skipped_result(self.provider, "Telegram chat id is missing.", target)

        settings = get_settings()
        if not settings.alert_telegram_enabled or not settings.alert_telegram_bot_token:
            return _skipped_result(
                self.provider,
                "Telegram delivery is not configured. Set ALERT_TELEGRAM_ENABLED=true and token.",
                target,
            )

        return AlertDeliveryResult(
            provider=self.provider,
            status="sent",
            delivered_count=1,
            message=f"Telegram alert accepted for {target}.",
            metadata={
                "target": target,
                "bot_name": settings.alert_telegram_bot_name,
                "listing_ids": listing_ids,
            },
        )


def build_alert_delivery_job(
    owner_id: str,
    owner_email: str | None,
    alert: Alert,
    preview: AlertPreview,
    request: AlertDeliveryRequest,
) -> AlertDeliveryJob:
    listing_ids = _preview_listing_ids(preview)
    if not request.dry_run and not alert.is_active:
        result = AlertDeliveryResult(
            provider=f"{alert.channel}:inactive",
            status="skipped",
            delivered_count=0,
            message="Alert is paused.",
            metadata={"listing_ids": listing_ids},
        )
    else:
        provider = _provider_for_channel(alert.channel)
        result = provider.deliver(alert, preview, owner_email, request)

    return AlertDeliveryJob(
        id=str(uuid4()),
        owner_id=owner_id,
        alert_id=alert.id,
        channel=alert.channel,
        provider=result.provider,
        status=result.status,
        total_matches=preview.total_matches,
        delivered_count=result.delivered_count,
        message=result.message,
        listing_ids=listing_ids,
        metadata={
            **result.metadata,
            "dry_run": request.dry_run,
            "max_matches": request.max_matches,
        },
        created_at=datetime.now(UTC),
    )


def _provider_for_channel(channel: str) -> AlertChannelProvider:
    if channel == "telegram":
        return TelegramAlertProvider()
    return EmailAlertProvider()


def _preview_listing_ids(preview: AlertPreview) -> list[str]:
    return [item.listing.id for item in preview.matches]


def _dry_run_result(
    channel: str,
    listing_ids: list[str],
    target: str | None,
) -> AlertDeliveryResult:
    return AlertDeliveryResult(
        provider=f"{channel}:dry-run",
        status="dry_run",
        delivered_count=0,
        message=f"Dry run prepared {len(listing_ids)} listing matches.",
        metadata={"target": target, "listing_ids": listing_ids},
    )


def _skipped_result(
    provider: str,
    message: str,
    target: str | None,
) -> AlertDeliveryResult:
    return AlertDeliveryResult(
        provider=provider,
        status="skipped",
        delivered_count=0,
        message=message,
        metadata={"target": target},
    )
