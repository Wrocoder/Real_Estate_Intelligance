import hashlib
import re
from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import (
    DocumentAnalysisDocumentType,
    DocumentAnalysisStatus,
    DocumentAnalysisUploadChannel,
    DocumentCheck,
    DocumentConflict,
    DocumentSignal,
    DocumentSignalProvenance,
    DocumentUnknown,
    UserSubmittedListingDraft,
)

DOCUMENT_ANALYSIS_DISCLAIMER = (
    "Document analysis is automated decision-support screening. It is not legal, "
    "technical, tax or valuation advice and does not confirm clean title, seller "
    "authority or technical condition."
)
ALLOWED_DOCUMENT_TYPES: set[str] = {
    "kw_extract",
    "floor_plan",
    "community_statement",
    "energy_certificate",
    "developer_prospectus",
    "building_permit",
    "agreement_draft",
    "other",
}
ALLOWED_FILE_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "text/plain",
}
MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_DOCUMENT_CHECKS_PER_DRAFT = 5

_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?48[\s-]?)?(?:\d[\s-]?){9}(?!\d)")
_PESEL_RE = re.compile(r"\b\d{11}\b")
_BANK_RE = re.compile(r"\b(?:PL)?\d{26}\b", re.IGNORECASE)
_WHITESPACE_RE = re.compile(r"\s+")


def analyze_user_submitted_document(
    *,
    draft: UserSubmittedListingDraft,
    document_type: str | None,
    filename: str | None,
    content_type: str | None,
    file_bytes: bytes | None,
    metadata_text: str | None,
    retain_original: bool,
    expert_review_consent: bool,
    confirm_private_document_analysis: bool,
    existing_document_count: int,
) -> DocumentCheck:
    if not confirm_private_document_analysis:
        raise ValueError("confirmation is required for private document analysis")
    if retain_original:
        raise ValueError("raw document retention is not available in the automated first slice")
    if expert_review_consent and not retain_original:
        raise ValueError("expert review consent is only used when original retention is requested")
    if existing_document_count >= MAX_DOCUMENT_CHECKS_PER_DRAFT:
        raise ValueError("document check limit reached for this draft")

    normalized_type = _normalize_document_type(document_type)
    upload_channel: DocumentAnalysisUploadChannel = "file" if file_bytes is not None else "metadata_only"
    file_size = len(file_bytes or b"")
    if file_bytes is not None:
        _validate_file(filename, content_type, file_size)
    if file_bytes is None and not _clean(metadata_text):
        raise ValueError("file or metadata_text is required")

    extracted_text = _extract_text(file_bytes, content_type) if file_bytes is not None else ""
    combined_text = _clean("\n".join(item for item in [metadata_text, extracted_text] if item))
    redacted_text = _redact(combined_text)
    source_hash = _source_hash(file_bytes=file_bytes, metadata_text=metadata_text)
    source_document = filename or _document_label(normalized_type)
    signals, conflicts = _signals_for_document(
        document_type=normalized_type,
        text=redacted_text,
        source_document=source_document,
        upload_channel=upload_channel,
    )
    unknowns = _unknowns_for_document(normalized_type, signals)
    status = _document_status(signals, unknowns, upload_channel, content_type)
    confidence = _confidence(signals, unknowns, upload_channel, content_type)
    now = datetime.now(UTC)
    return DocumentCheck(
        id=str(uuid4()),
        draft_id=draft.id,
        document_type=normalized_type,
        upload_channel=upload_channel,
        status=status,
        filename=filename,
        content_type=content_type,
        file_size_bytes=file_size,
        source_hash=source_hash,
        signals=signals,
        unknowns=unknowns,
        conflicts=conflicts,
        confidence=confidence,
        retention_deadline=draft.expires_at,
        raw_document_retained=False,
        disclaimer=DOCUMENT_ANALYSIS_DISCLAIMER,
        created_at=now,
        updated_at=now,
    )


def _normalize_document_type(document_type: str | None) -> DocumentAnalysisDocumentType:
    candidate = (document_type or "other").strip()
    if candidate not in ALLOWED_DOCUMENT_TYPES:
        raise ValueError("unsupported document_type")
    return candidate  # type: ignore[return-value]


def _validate_file(filename: str | None, content_type: str | None, file_size: int) -> None:
    if file_size <= 0:
        raise ValueError("uploaded document is empty")
    if file_size > MAX_DOCUMENT_UPLOAD_BYTES:
        raise ValueError("uploaded document exceeds the 10 MB limit")
    extension = ""
    if filename and "." in filename:
        extension = "." + filename.rsplit(".", 1)[-1].lower()
    if extension not in ALLOWED_FILE_EXTENSIONS:
        raise ValueError("unsupported document file type")
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("unsupported document content type")


def _extract_text(file_bytes: bytes | None, content_type: str | None) -> str:
    if not file_bytes or content_type != "text/plain":
        return ""
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError("text documents must be UTF-8 encoded") from exc


def _source_hash(*, file_bytes: bytes | None, metadata_text: str | None) -> str:
    digest = hashlib.sha256()
    if file_bytes:
        digest.update(file_bytes)
    if metadata_text:
        digest.update(metadata_text.encode("utf-8"))
    return digest.hexdigest()


def _signals_for_document(
    *,
    document_type: DocumentAnalysisDocumentType,
    text: str,
    source_document: str,
    upload_channel: DocumentAnalysisUploadChannel,
) -> tuple[list[DocumentSignal], list[DocumentConflict]]:
    signals: list[DocumentSignal] = []
    conflicts: list[DocumentConflict] = []

    def add_signal(
        code: str,
        keywords: tuple[str, ...],
        rationale: str,
        *,
        status: str = "needs_review",
        confidence: int = 55,
        severity: str = "warning",
    ) -> None:
        snippet = _snippet_for_keywords(text, keywords)
        if snippet is None:
            return
        signals.append(
            DocumentSignal(
                checklist_code=code,
                status=status,  # type: ignore[arg-type]
                confidence=confidence,
                evidence=snippet,
                provenance=DocumentSignalProvenance(
                    source_document=source_document,
                    page=1 if upload_channel == "file" else None,
                    field=code,
                ),
                severity=severity,  # type: ignore[arg-type]
                rationale=rationale,
            )
        )

    if document_type == "kw_extract":
        add_signal(
            "kw_owner",
            ("właściciel", "wlasciciel", "księga wieczysta", "ksiega wieczysta"),
            "The document appears to mention ownership/register context; seller authority still needs professional verification.",
            status="needs_review",
            confidence=60,
        )
        add_signal(
            "kw_mortgage",
            ("hipoteka", "roszczenie", "służebność", "sluzebnosc", "egzekucja"),
            "Register encumbrance terms were detected and should be reviewed before any deposit.",
            status="conflict",
            confidence=70,
            severity="risk",
        )
        if any(token in text.lower() for token in ("hipoteka", "roszczenie", "służebność")):
            conflicts.append(
                DocumentConflict(
                    field="kw_mortgage",
                    observed_values=["register encumbrance keyword detected"],
                    severity="risk",
                    manual_review_note=(
                        "Do not treat the register as clean automatically; ask a notary or lawyer "
                        "to check the current KW sections."
                    ),
                )
            )
    elif document_type == "floor_plan":
        add_signal(
            "area_match",
            ("powierzchnia", "m2", "m²", "rzut", "plan lokalu"),
            "The document appears to contain area or layout evidence; compare it with the listing area manually.",
            status="evidence_found",
            confidence=65,
            severity="info",
        )
    elif document_type == "community_statement":
        add_signal(
            "community_debt",
            ("zaległość", "zaleglosc", "zadłużenie", "zadluzenie", "opłaty", "czynsz"),
            "Fee/debt wording was detected; verify whether arrears or planned charges exist.",
            status="needs_review",
            confidence=60,
        )
        add_signal(
            "building_repairs",
            ("fundusz remontowy", "remont", "uchwała", "uchwala"),
            "Building repair/fund wording was detected; check future wspólnota costs.",
            status="needs_review",
            confidence=55,
        )
    elif document_type == "energy_certificate":
        add_signal(
            "energy_certificate",
            ("świadectwo charakterystyki", "swiadectwo charakterystyki", "ep ", "ek "),
            "Energy certificate wording was detected; verify class and running-cost assumptions.",
            status="evidence_found",
            confidence=65,
            severity="info",
        )
    elif document_type == "developer_prospectus":
        add_signal(
            "prospekt",
            ("prospekt informacyjny", "standard wykończenia", "standard wykonczenia"),
            "Developer prospectus wording was detected; compare obligations, standard and annexes before signing.",
            status="needs_review",
            confidence=60,
        )
        add_signal(
            "escrow",
            ("rachunek powierniczy", "harmonogram płatności", "harmonogram platnosci"),
            "Escrow/payment schedule wording was detected; verify bank account structure and payment milestones.",
            status="needs_review",
            confidence=60,
        )
    elif document_type == "building_permit":
        add_signal(
            "permits",
            ("pozwolenie na budowę", "pozwolenie na budowe", "decyzja", "użytkowanie"),
            "Permit or handover wording was detected; confirm validity and finality with the source document.",
            status="needs_review",
            confidence=58,
        )
    elif document_type == "agreement_draft":
        add_signal(
            "agreement_review",
            ("zadatek", "zaliczka", "kara umowna", "odstąpienie", "odstapienie"),
            "Contract-risk wording was detected; this requires legal review, not automated approval.",
            status="needs_review",
            confidence=55,
            severity="risk",
        )

    if not text and upload_channel == "file":
        signals.append(
            DocumentSignal(
                checklist_code="document_text",
                status="not_supported",
                confidence=0,
                evidence="No machine-readable text was extracted from this file.",
                provenance=DocumentSignalProvenance(
                    source_document=source_document,
                    page=None,
                    field="document_text",
                ),
                severity="warning",
                rationale="PDF/image OCR is not enabled in this automated first slice.",
            )
        )
    return signals, conflicts


def _unknowns_for_document(
    document_type: DocumentAnalysisDocumentType,
    signals: list[DocumentSignal],
) -> list[DocumentUnknown]:
    found = {signal.checklist_code for signal in signals}
    expected = {
        "kw_extract": ("kw_owner", "kw_mortgage"),
        "floor_plan": ("area_match",),
        "community_statement": ("community_debt", "building_repairs"),
        "energy_certificate": ("energy_certificate",),
        "developer_prospectus": ("prospekt", "escrow"),
        "building_permit": ("permits",),
        "agreement_draft": ("agreement_review",),
        "other": ("document_type",),
    }[document_type]
    return [
        DocumentUnknown(
            checklist_code=code,
            reason="The uploaded material did not contain enough machine-readable evidence for this check.",
            recommended_next_action="Request the original/current document and have the relevant expert verify it before zadatek.",
        )
        for code in expected
        if code not in found
    ]


def _document_status(
    signals: list[DocumentSignal],
    unknowns: list[DocumentUnknown],
    upload_channel: DocumentAnalysisUploadChannel,
    content_type: str | None,
) -> DocumentAnalysisStatus:
    if signals and all(signal.status == "not_supported" for signal in signals):
        return "not_supported"
    if upload_channel == "file" and content_type != "text/plain" and not any(
        signal.status != "not_supported" for signal in signals
    ):
        return "not_supported"
    if unknowns or any(signal.status in {"needs_review", "conflict"} for signal in signals):
        return "needs_review"
    return "analyzed"


def _confidence(
    signals: list[DocumentSignal],
    unknowns: list[DocumentUnknown],
    upload_channel: DocumentAnalysisUploadChannel,
    content_type: str | None,
) -> int:
    if not signals:
        return 20
    values = [signal.confidence for signal in signals if signal.status != "not_supported"]
    if not values:
        return 10
    penalty = min(len(unknowns) * 8, 30)
    if upload_channel == "metadata_only":
        penalty += 10
    if content_type and content_type != "text/plain":
        penalty += 15
    return max(15, min(round(sum(values) / len(values)) - penalty, 80))


def _snippet_for_keywords(text: str, keywords: tuple[str, ...]) -> str | None:
    lowered = text.lower()
    for keyword in keywords:
        index = lowered.find(keyword.lower())
        if index < 0:
            continue
        start = max(index - 45, 0)
        end = min(index + len(keyword) + 95, len(text))
        return _truncate(_clean(text[start:end]), 180)
    return None


def _redact(value: str) -> str:
    redacted = _EMAIL_RE.sub("[redacted-email]", value)
    redacted = _BANK_RE.sub("[redacted-bank-account]", redacted)
    redacted = _PESEL_RE.sub("[redacted-id]", redacted)
    redacted = _PHONE_RE.sub("[redacted-phone]", redacted)
    return redacted


def _clean(value: str | None) -> str:
    if not value:
        return ""
    return _WHITESPACE_RE.sub(" ", value).strip()


def _truncate(value: str, limit: int) -> str:
    if len(value) <= limit:
        return value
    return value[: limit - 1].rstrip() + "…"


def _document_label(document_type: DocumentAnalysisDocumentType) -> str:
    return document_type.replace("_", " ")
