from typing import Protocol

from domarion.schemas import GeneratedReport, GeneratedReportCreate, GeneratedReportListItem


class ReportStore(Protocol):
    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        raise NotImplementedError

    def list_reports(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportListItem]:
        raise NotImplementedError

    def get_report(
        self,
        report_id: str,
        owner_id: str | None = None,
    ) -> GeneratedReport | None:
        raise NotImplementedError
