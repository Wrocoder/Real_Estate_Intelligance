from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import GeneratedReport, GeneratedReportCreate, GeneratedReportListItem


class InMemoryReportStore:
    def __init__(self) -> None:
        self._items: dict[str, GeneratedReport] = {}

    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        report = GeneratedReport(
            id=str(uuid4()),
            created_at=datetime.now(UTC),
            **payload.model_dump(),
        )
        self._items[report.id] = report
        return report

    def list_reports(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportListItem]:
        reports = list(self._items.values())
        if owner_id is not None:
            reports = [report for report in reports if report.owner_id == owner_id]
        reports = sorted(reports, key=lambda item: item.created_at, reverse=True)
        return [
            GeneratedReportListItem(**report.model_dump(exclude={"content", "report_metadata"}))
            for report in reports[:limit]
        ]

    def get_report(
        self,
        report_id: str,
        owner_id: str | None = None,
    ) -> GeneratedReport | None:
        report = self._items.get(report_id)
        if report is None:
            return None
        if owner_id is not None and report.owner_id != owner_id:
            return None
        return report

    def clear(self) -> None:
        self._items.clear()
