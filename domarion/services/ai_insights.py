import hashlib
import json

from domarion.ai_insight_store.base import AIInsightStore
from domarion.schemas import (
    AIInsight,
    AIInsightCreate,
    AIInsightSubjectType,
    AIInsightType,
    GeneratedReport,
)

REPORT_SUMMARY_PROMPT_VERSION = "report-summary-v1"
OBJECT_EXPLANATION_PROMPT_VERSION = "object-explanation-v1"
INSIGHT_PROVIDER = "domarion_rule_based"
INSIGHT_MODEL = "domarion-deterministic-v1"


def persist_generated_report_insights(
    store: AIInsightStore,
    report: GeneratedReport,
) -> list[AIInsight]:
    if report.report_metadata.get("report_bundle_receipt") is True:
        return []

    subject_type, subject_id = _report_subject(report)
    insights = [
        store.save_insight(
            _build_report_summary_insight(
                report,
                subject_type=subject_type,
                subject_id=subject_id,
            )
        )
    ]

    if subject_type in {"listing", "user_submitted_draft"} and _has_score_metadata(report):
        insights.append(
            store.save_insight(
                _build_object_explanation_insight(
                    report,
                    subject_type=subject_type,
                    subject_id=subject_id,
                )
            )
        )

    return insights


def _build_report_summary_insight(
    report: GeneratedReport,
    *,
    subject_type: AIInsightSubjectType,
    subject_id: str,
) -> AIInsightCreate:
    insight_type: AIInsightType = "area_summary" if subject_type == "area" else "report_summary"
    metadata = _base_metadata(report)
    return AIInsightCreate(
        owner_id=report.owner_id,
        subject_type=subject_type,
        subject_id=subject_id,
        insight_type=insight_type,
        provider=INSIGHT_PROVIDER,
        model_name=INSIGHT_MODEL,
        prompt_version=REPORT_SUMMARY_PROMPT_VERSION,
        source_report_id=report.id,
        title=f"Summary: {report.title}",
        summary=report.summary,
        content=report.summary,
        input_hash=_input_hash(
            {
                "kind": insight_type,
                "report_id": report.id,
                "summary": report.summary,
                "metadata": metadata,
            }
        ),
        metadata=metadata,
    )


def _build_object_explanation_insight(
    report: GeneratedReport,
    *,
    subject_type: AIInsightSubjectType,
    subject_id: str,
) -> AIInsightCreate:
    metadata = _base_metadata(report)
    content = _object_explanation_content(report)
    summary = (
        f"{report.title}: investment {report.report_metadata.get('investment_score')}/100, "
        f"risk {report.report_metadata.get('risk_score')}/100, "
        f"price label {report.report_metadata.get('price_label')}."
    )
    return AIInsightCreate(
        owner_id=report.owner_id,
        subject_type=subject_type,
        subject_id=subject_id,
        insight_type="object_explanation",
        provider=INSIGHT_PROVIDER,
        model_name=INSIGHT_MODEL,
        prompt_version=OBJECT_EXPLANATION_PROMPT_VERSION,
        source_report_id=report.id,
        title=f"Object explanation: {report.title}",
        summary=summary,
        content=content,
        input_hash=_input_hash(
            {
                "kind": "object_explanation",
                "report_id": report.id,
                "content": content,
                "metadata": metadata,
            }
        ),
        metadata=metadata,
    )


def _report_subject(report: GeneratedReport) -> tuple[AIInsightSubjectType, str]:
    metadata = report.report_metadata
    draft_id = metadata.get("user_submitted_draft_id")
    if isinstance(draft_id, str) and draft_id:
        return "user_submitted_draft", draft_id

    area_id = metadata.get("area_id")
    if report.listing_id.startswith("area:") and isinstance(area_id, str) and area_id:
        return "area", area_id

    if report.listing_id:
        return "listing", report.listing_id

    return "report", report.id


def _has_score_metadata(report: GeneratedReport) -> bool:
    return all(
        key in report.report_metadata
        for key in (
            "investment_score",
            "risk_score",
            "negotiation_score",
            "decision_label",
            "price_label",
        )
    )


def _object_explanation_content(report: GeneratedReport) -> str:
    metadata = report.report_metadata
    lines = [
        report.summary,
        (
            "Scores: "
            f"investment {metadata.get('investment_score')}/100, "
            f"risk {metadata.get('risk_score')}/100, "
            f"negotiation {metadata.get('negotiation_score')}/100."
        ),
        (
            "Labels: "
            f"decision={metadata.get('decision_label')}, "
            f"price={metadata.get('price_label')}, "
            f"risk={metadata.get('risk_label')}, "
            f"negotiation={metadata.get('negotiation_label')}."
        ),
        (
            "Fair price confidence: "
            f"{metadata.get('fair_price_confidence_score')}/100."
        ),
        (
            "Scoring provenance: "
            f"{metadata.get('scoring_formula_version')} / "
            f"{metadata.get('scoring_weights_profile')}."
        ),
    ]
    return "\n".join(line for line in lines if line)


def _base_metadata(report: GeneratedReport) -> dict[str, object]:
    metadata = report.report_metadata
    keys = (
        "report_product_code",
        "report_template_code",
        "report_template_name",
        "area_id",
        "city",
        "district",
        "source_domain",
        "private_source_reference_present",
        "investment_score",
        "risk_score",
        "negotiation_score",
        "decision_label",
        "price_label",
        "risk_label",
        "negotiation_label",
        "fair_price_confidence_score",
        "scoring_formula_version",
        "scoring_weights_profile",
        "paid_order_id",
    )
    return {
        "listing_id": report.listing_id,
        "audience": report.audience,
        "report_format": report.report_format,
        **{key: metadata[key] for key in keys if key in metadata},
    }


def _input_hash(payload: dict[str, object]) -> str:
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
