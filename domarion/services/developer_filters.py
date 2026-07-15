"""Shared filters for developer reputation constraints."""

from __future__ import annotations

from domarion.schemas import ListingAnalysis


def matches_developer_reputation_filters(
    analysis: ListingAnalysis,
    *,
    min_developer_reputation_score: int | None = None,
    min_developer_confidence_score: int | None = None,
    min_developer_completed_projects: int | None = None,
    min_developer_active_projects: int | None = None,
    require_developer_reputation: bool = False,
    exclude_developer_risk_signals: bool = False,
) -> bool:
    """Return whether an analysis satisfies developer reputation filters."""

    reputation = analysis.developer_reputation
    requires_profile = (
        require_developer_reputation
        or min_developer_reputation_score is not None
        or min_developer_confidence_score is not None
        or min_developer_completed_projects is not None
        or min_developer_active_projects is not None
        or exclude_developer_risk_signals
    )
    if requires_profile and reputation is None:
        return False

    if reputation is None:
        return True

    if (
        min_developer_reputation_score is not None
        and reputation.reputation_score < min_developer_reputation_score
    ):
        return False
    if (
        min_developer_confidence_score is not None
        and reputation.confidence_score < min_developer_confidence_score
    ):
        return False
    if (
        min_developer_completed_projects is not None
        and reputation.completed_projects_count < min_developer_completed_projects
    ):
        return False
    if (
        min_developer_active_projects is not None
        and reputation.active_projects_count < min_developer_active_projects
    ):
        return False
    if exclude_developer_risk_signals and reputation.risk_signals:
        return False

    return True
