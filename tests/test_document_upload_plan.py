from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_document_upload_due_diligence_plan_covers_privacy_and_guardrails() -> None:
    document = (ROOT / "docs" / "document_upload_due_diligence_plan.md").read_text(
        encoding="utf-8"
    )

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


def test_development_plan_marks_document_upload_design_done() -> None:
    plan = (ROOT / "docs" / "development_plan.md").read_text(encoding="utf-8")
    product_direction = (
        ROOT / "docs" / "buyer_decision_product_direction.md"
    ).read_text(encoding="utf-8")

    assert (
        "- [x] Спроектировать document upload flow: extract checklist signals without"
        in plan
    )
    assert "docs/document_upload_due_diligence_plan.md" in plan
    assert (
        "- [x] Add document upload/metadata plan: extract checklist signals without"
        in product_direction
    )
    assert "docs/document_upload_due_diligence_plan.md" in product_direction
