from datetime import date

from domarion.schemas import (
    DeveloperAlias,
    DeveloperProfile,
    DeveloperProject,
    DeveloperQualitySignal,
    DeveloperReputation,
    DeveloperSourceCitation,
)


def build_developer_reputation(
    profile: DeveloperProfile,
    projects: list[DeveloperProject],
    signals: list[DeveloperQualitySignal],
    aliases: list[DeveloperAlias] | None = None,
) -> DeveloperReputation:
    aliases = aliases or []
    completed_projects_count = sum(1 for project in projects if project.status == "completed")
    active_projects_count = sum(1 for project in projects if project.status == "active")
    local_projects_count = sum(
        1 for project in projects if project.city.casefold() == "Wrocław".casefold()
    )

    track_record_score = _clamp_score(
        45 + completed_projects_count * 13 + active_projects_count * 4
    )
    delivery_score = _developer_factor_score(signals, "delivery", base=62)
    technical_quality_score = _developer_factor_score(signals, "technical_quality", base=64)
    legal_compliance_score = _developer_factor_score(signals, "legal", base=66)
    financial_stability_score = _developer_factor_score(signals, "financial", base=62)
    transparency_score = _developer_factor_score(signals, "transparency", base=58)
    local_experience_score = _clamp_score(42 + local_projects_count * 12)

    reputation_score = _clamp_score(
        track_record_score * 0.20
        + delivery_score * 0.15
        + technical_quality_score * 0.17
        + legal_compliance_score * 0.14
        + financial_stability_score * 0.12
        + transparency_score * 0.10
        + local_experience_score * 0.12
    )
    confidence_score = _clamp_score(
        34
        + len(set(profile.source_names)) * 8
        + min(len(signals), 8) * 5
        + min(len(projects), 10) * 4
    )
    risk_signals = [signal.summary for signal in signals if signal.severity in {"warning", "risk"}]
    positive_signals = [signal.summary for signal in signals if signal.severity == "positive"]

    if any(signal.severity == "risk" for signal in signals):
        label = "risk_review"
    elif reputation_score >= 75 and confidence_score >= 60:
        label = "strong"
    elif reputation_score >= 65:
        label = "good"
    elif reputation_score >= 52:
        label = "mixed"
    else:
        label = "limited_data"

    return DeveloperReputation(
        developer=profile,
        reputation_score=reputation_score,
        confidence_score=confidence_score,
        label=label,
        track_record_score=track_record_score,
        delivery_score=delivery_score,
        technical_quality_score=technical_quality_score,
        legal_compliance_score=legal_compliance_score,
        financial_stability_score=financial_stability_score,
        transparency_score=transparency_score,
        local_experience_score=local_experience_score,
        completed_projects_count=completed_projects_count,
        active_projects_count=active_projects_count,
        positive_signals=positive_signals,
        risk_signals=risk_signals,
        due_diligence_questions=_developer_due_diligence_questions(
            reputation_score=reputation_score,
            confidence_score=confidence_score,
            risk_signals=risk_signals,
            active_projects_count=active_projects_count,
        ),
        source_citations=_developer_source_citations(profile, signals, aliases),
        aliases=aliases,
        projects=projects,
        quality_signals=signals,
    )


def _developer_factor_score(
    signals: list[DeveloperQualitySignal],
    signal_type: str,
    *,
    base: int,
) -> int:
    score = base
    for signal in signals:
        if signal.signal_type != signal_type:
            continue
        if signal.severity == "positive":
            score += 12
        elif signal.severity == "info":
            score += 4
        elif signal.severity == "warning":
            score -= 14
        elif signal.severity == "risk":
            score -= 28
        score += round((signal.confidence_score - 50) / 20)
    return _clamp_score(score)


def _developer_due_diligence_questions(
    *,
    reputation_score: int,
    confidence_score: int,
    risk_signals: list[str],
    active_projects_count: int,
) -> list[str]:
    questions = [
        "Confirm KRS/REGON status, ownership and whether the selling entity is an SPV.",
        "Ask for handover schedule, escrow account type and defect-remediation process.",
    ]
    if confidence_score < 65:
        questions.append("Request additional references from completed local projects.")
    if reputation_score < 65 or risk_signals:
        questions.append("Check court/UOKiK history and independent technical inspections.")
    if active_projects_count:
        questions.append("Compare current project timeline with recently delivered projects.")
    return questions


def _developer_source_citations(
    profile: DeveloperProfile,
    signals: list[DeveloperQualitySignal],
    aliases: list[DeveloperAlias],
) -> list[DeveloperSourceCitation]:
    citations = [
        DeveloperSourceCitation(
            source_name=source_name,
            checked_at=profile.updated_at,
            note="Developer profile source.",
        )
        for source_name in profile.source_names
    ]
    for signal in signals:
        citations.append(
            DeveloperSourceCitation(
                source_name=signal.source_name,
                source_url=signal.source_url,
                checked_at=signal.observed_at or date.today(),
                note=signal.title,
            )
        )
    for alias in aliases:
        citations.append(
            DeveloperSourceCitation(
                source_name=alias.source_name,
                source_url=alias.source_url,
                checked_at=profile.updated_at,
                note=f"Developer alias: {alias.alias} ({alias.alias_type}).",
            )
        )
    unique = {}
    for citation in citations:
        key = (citation.source_name, citation.source_url, citation.note)
        unique[key] = citation
    return list(unique.values())[:8]


def _clamp_score(value: float) -> int:
    return max(0, min(100, int(round(value))))
