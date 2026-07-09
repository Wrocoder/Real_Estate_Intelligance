from typing import Protocol

from domarion.schemas import GeneratedReport, GeneratedReportCreate, GeneratedReportListItem


class ReportStore(Protocol):
    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        raise NotImplementedError

    def list_reports(self, limit: int = 50) -> list[GeneratedReportListItem]:
        raise NotImplementedError

    def get_report(self, report_id: str) -> GeneratedReport | None:
        raise NotImplementedError

