import smtplib
from email.message import EmailMessage

from domarion.core import get_settings
from domarion.schemas import GeneratedReport, ReportEmailRequest, ReportEmailResult


def deliver_report_email(
    report: GeneratedReport,
    owner_email: str | None,
    request: ReportEmailRequest,
) -> ReportEmailResult:
    target = request.target_email or owner_email
    subject = f"Domarion report: {report.title}"

    if request.dry_run:
        return ReportEmailResult(
            report_id=report.id,
            provider="email:dry-run",
            status="dry_run",
            target_email=target,
            subject=subject,
            message="Dry run prepared report email.",
            metadata={"content_type": report.content_type},
        )
    if not target:
        return ReportEmailResult(
            report_id=report.id,
            provider="email:smtp",
            status="skipped",
            target_email=None,
            subject=subject,
            message="Email target is missing.",
            metadata={},
        )

    settings = get_settings()
    if not settings.alert_email_enabled or not settings.alert_smtp_host:
        return ReportEmailResult(
            report_id=report.id,
            provider="email:smtp",
            status="skipped",
            target_email=target,
            subject=subject,
            message=(
                "Report email delivery is not configured. "
                "Set ALERT_EMAIL_ENABLED=true and ALERT_SMTP_HOST."
            ),
            metadata={},
        )

    message = EmailMessage()
    message["From"] = settings.alert_email_sender
    message["To"] = target
    message["Subject"] = subject
    if report.content_type.startswith("text/html"):
        message.set_content(_plain_report_summary(report))
        message.add_alternative(report.content, subtype="html")
    else:
        message.set_content(report.content)

    try:
        with smtplib.SMTP(
            settings.alert_smtp_host,
            settings.alert_smtp_port,
            timeout=settings.alert_delivery_timeout_seconds,
        ) as smtp:
            if settings.alert_smtp_use_tls:
                smtp.starttls()
            if settings.alert_smtp_username and settings.alert_smtp_password:
                smtp.login(settings.alert_smtp_username, settings.alert_smtp_password)
            smtp.send_message(message)
    except OSError as exc:
        return ReportEmailResult(
            report_id=report.id,
            provider="email:smtp",
            status="failed",
            target_email=target,
            subject=subject,
            message=f"Report email delivery failed: {exc}",
            metadata={"smtp_host": settings.alert_smtp_host},
        )

    return ReportEmailResult(
        report_id=report.id,
        provider="email:smtp",
        status="sent",
        target_email=target,
        subject=subject,
        message=f"Report email sent to {target}.",
        metadata={
            "sender": settings.alert_email_sender,
            "smtp_host": settings.alert_smtp_host,
            "smtp_port": settings.alert_smtp_port,
            "content_type": report.content_type,
        },
    )


def _plain_report_summary(report: GeneratedReport) -> str:
    return (
        f"{report.title}\n\n"
        f"{report.summary}\n\n"
        "The HTML report is included in this email."
    )
