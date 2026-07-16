from pathlib import Path

import pytest

from domarion.ingestion.developers import (
    DeveloperFeedError,
    import_developer_feed,
    read_developer_feed,
)
from domarion.services.developer_reputation import build_developer_reputation


def test_developer_feed_sample_parses_profiles_projects_and_signals() -> None:
    records = read_developer_feed("data/samples/developer_feed_wroclaw.json")

    assert len(records.profiles) == 2
    assert len(records.aliases) == 3
    assert len(records.projects) == 3
    assert len(records.quality_signals) == 7
    demo = next(profile for profile in records.profiles if profile.id == "demo-development")
    demo_aliases = [alias for alias in records.aliases if alias.developer_id == "demo-development"]
    signal_ids = {signal.id for signal in records.quality_signals}
    assert "Developer Demo" in demo.source_names
    assert demo.krs == "0000123456"
    assert any(alias.alias_type == "spv" for alias in demo_aliases)
    assert any(alias.alias == "Demo Development Jagodno sp. z o.o." for alias in demo_aliases)
    assert "demo-krs-active" in signal_ids
    assert "fep-uokik-contract-review" in signal_ids
    assert "demo-directory-rynekpierwotny" in signal_ids
    assert "fep-partner-inspection-common-areas" in signal_ids


def test_developer_feed_dry_run_returns_counts_without_writes() -> None:
    result = import_developer_feed(
        "data/samples/developer_feed_wroclaw.json",
        session=None,  # type: ignore[arg-type]
        dry_run=True,
    )

    assert result.rows_seen == 15
    assert result.dry_run is True
    assert result.developer_ids == ("demo-development", "fabryczna-estate-partners")


def test_developer_feed_rejects_unknown_project_developer(tmp_path: Path) -> None:
    path = tmp_path / "developer_feed.json"
    path.write_text(
        """
        {
          "source_name": "Bad Feed",
          "profiles": [{"id": "known", "name": "Known", "source_names": ["Bad Feed"]}],
          "projects": [{"developer_id": "missing", "name": "Bad", "city": "Wrocław"}]
        }
        """,
        encoding="utf-8",
    )

    with pytest.raises(DeveloperFeedError, match="Unknown developer_id"):
        read_developer_feed(path)


def test_developer_feed_rejects_unknown_partner_inspection_project(tmp_path: Path) -> None:
    path = tmp_path / "developer_feed.json"
    path.write_text(
        """
        {
          "source_name": "Bad Feed",
          "profiles": [{"id": "known", "name": "Known", "source_names": ["Bad Feed"]}],
          "projects": [
            {
              "id": "known-project",
              "developer_id": "known",
              "name": "Known",
              "city": "Wrocław"
            }
          ],
          "partner_inspections": [
            {
              "developer_id": "known",
              "project_id": "missing-project",
              "title": "Inspection",
              "summary": "Bad project reference."
            }
          ]
        }
        """,
        encoding="utf-8",
    )

    with pytest.raises(DeveloperFeedError, match="Unknown project_id"):
        read_developer_feed(path)


def test_developer_reputation_builder_scores_source_backed_profile() -> None:
    records = read_developer_feed("data/samples/developer_feed_wroclaw.json")
    profile = next(item for item in records.profiles if item.id == "demo-development")
    projects = [item for item in records.projects if item.developer_id == profile.id]
    signals = [item for item in records.quality_signals if item.developer_id == profile.id]
    aliases = [item for item in records.aliases if item.developer_id == profile.id]

    reputation = build_developer_reputation(profile, projects, signals, aliases)

    assert reputation.developer.id == "demo-development"
    assert reputation.reputation_score >= 60
    assert reputation.confidence_score >= 60
    assert any(alias.alias_type == "spv" for alias in reputation.aliases)
    assert reputation.source_citations


def test_developer_reputation_migration_declares_core_tables() -> None:
    migration = Path("alembic/versions/0026_developer_reputation_tables.py").read_text()
    alias_migration = Path("alembic/versions/0028_developer_aliases.py").read_text()

    assert "developer_profiles" in migration
    assert "developer_projects" in migration
    assert "developer_quality_signals" in migration
    assert "developer_reputation_snapshots" in migration
    assert "developer_aliases" in alias_migration
