from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_document_upload_due_diligence_plan_covers_privacy_and_guardrails() -> None:
    document = (ROOT / "docs" / "document_upload_due_diligence_plan.md").read_text(encoding="utf-8")

    for section in (
        "## Goal",
        "## First Slice",
        "## Data Model",
        "## Extraction Pipeline",
        "## API Shape",
        "## UI Flow",
        "## Security And Retention",
        "## Checklist Mapping",
        "## Acceptance Criteria",
    ):
        assert section in document

    for guardrail in (
        "not legal advice",
        "raw file bytes by default",
        "confirm_private_document_analysis=true",
        "Verified by WartoMetr analyst",
        "No automatic output claims legal certainty",
    ):
        assert guardrail in document


def test_document_upload_design_is_indexed_with_phase_16_limits() -> None:
    index = (ROOT / "docs" / "README.md").read_text(encoding="utf-8")

    assert "[Document-upload design](document_upload_due_diligence_plan.md)" in index
    assert "[Phase 16](WartoMetr_Phase_16_Implementation.md)" in index
    assert "metadata/text-first screening" in index
