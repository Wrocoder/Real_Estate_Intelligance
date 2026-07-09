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

    def list_reports(self, limit: int = 50) -> list[GeneratedReportListItem]:
        reports = sorted(self._items.values(), key=lambda item: item.created_at, reverse=True)
        return [
            GeneratedReportListItem(**report.model_dump(exclude={"content", "report_metadata"}))
            for report in reports[:limit]
        ]

    def get_report(self, report_id: str) -> GeneratedReport | None:
        return self._items.get(report_id)

    def clear(self) -> None:
        self._items.clear()
