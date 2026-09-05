from datetime import UTC, datetime
from uuid import uuid4

from domarion.report_store.base import report_decision_summary_from_metadata
from domarion.schemas import GeneratedReport, GeneratedReportCreate, GeneratedReportListItem


class InMemoryReportStore:
    def __init__(self) -> None:
        self._items: dict[str, GeneratedReport] = {}

    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        report = GeneratedReport(
            id=payload.id or str(uuid4()),
            created_at=datetime.now(UTC),
            **payload.model_dump(exclude={"id"}),
        )
        self._items[report.id] = report
        return report

    def list_reports(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportListItem]:
        reports = self.list_reports_with_metadata(limit=limit, owner_id=owner_id)
        return [self._to_list_item(report) for report in reports]

    @staticmethod
    def _to_list_item(report: GeneratedReport) -> GeneratedReportListItem:
        metadata = report.report_metadata or {}
        report_version = metadata.get("report_template_code") or metadata.get(
            "scoring_formula_version"
        )
        return GeneratedReportListItem(
            **report.model_dump(
                exclude={
                    "content",
                    "report_metadata",
                    "report_version",
                    "data_as_of",
                    "decision_summary",
                }
            ),
            report_version=str(report_version) if report_version is not None else None,
            data_as_of=report.created_at,
            decision_summary=report_decision_summary_from_metadata(metadata),
        )

    def list_reports_with_metadata(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReport]:
        reports = list(self._items.values())
        if owner_id is not None:
            reports = [report for report in reports if report.owner_id == owner_id]
        return sorted(reports, key=lambda item: item.created_at, reverse=True)[:limit]

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
