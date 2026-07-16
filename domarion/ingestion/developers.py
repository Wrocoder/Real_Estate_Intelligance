import json
from dataclasses import dataclass
from datetime import date, datetime, time
from pathlib import Path
from typing import Any, cast

from sqlalchemy.orm import Session

from domarion.db.models import (
    DeveloperAliasRow,
    DeveloperProfileRow,
    DeveloperProjectRow,
    DeveloperQualitySignalRow,
)
from domarion.ingestion.partner_csv import slugify
from domarion.schemas import (
    DeveloperAlias,
    DeveloperAliasType,
    DeveloperProfile,
    DeveloperProject,
    DeveloperProjectStatus,
    DeveloperQualitySignal,
    DeveloperSignalSeverity,
    DeveloperSignalType,
)

PROJECT_STATUSES: set[DeveloperProjectStatus] = {"completed", "active", "planned", "unknown"}
SIGNAL_TYPES: set[DeveloperSignalType] = {
    "track_record",
    "delivery",
    "technical_quality",
    "legal",
    "financial",
    "transparency",
    "local_market",
}
SIGNAL_SEVERITIES: set[DeveloperSignalSeverity] = {"positive", "info", "warning", "risk"}
ALIAS_TYPES: set[DeveloperAliasType] = {
    "brand",
    "legal_entity",
    "spv",
    "project_company",
    "parent_company",
    "source_name",
    "other",
}


class DeveloperFeedError(ValueError):
    pass


@dataclass(frozen=True)
class DeveloperFeedRecords:
    profiles: list[DeveloperProfile]
    aliases: list[DeveloperAlias]
    projects: list[DeveloperProject]
    quality_signals: list[DeveloperQualitySignal]


@dataclass(frozen=True)
class DeveloperFeedImportResult:
    rows_seen: int = 0
    profiles_created: int = 0
    profiles_updated: int = 0
    aliases_created: int = 0
    aliases_updated: int = 0
    projects_created: int = 0
    projects_updated: int = 0
    signals_created: int = 0
    signals_updated: int = 0
    dry_run: bool = False
    developer_ids: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "rows_seen": self.rows_seen,
            "profiles_created": self.profiles_created,
            "profiles_updated": self.profiles_updated,
            "aliases_created": self.aliases_created,
            "aliases_updated": self.aliases_updated,
            "projects_created": self.projects_created,
            "projects_updated": self.projects_updated,
            "signals_created": self.signals_created,
            "signals_updated": self.signals_updated,
            "dry_run": self.dry_run,
            "developer_ids": list(self.developer_ids),
        }


def read_developer_feed(
    path: str | Path,
    *,
    default_source_name: str | None = None,
) -> DeveloperFeedRecords:
    source_path = Path(path)
    with source_path.open("r", encoding="utf-8") as file:
        payload = json.load(file)
    if not isinstance(payload, dict):
        raise DeveloperFeedError("Developer feed must be a JSON object.")

    feed_source_name = _optional_str(payload.get("source_name")) or default_source_name
    profile_rows = _required_list(payload, "profiles")
    profiles = [
        _profile_from_row(row, default_source_name=feed_source_name)
        for row in profile_rows
    ]
    profile_ids = {profile.id for profile in profiles}
    aliases = [
        _alias_from_row(
            row,
            known_developer_ids=profile_ids,
            default_source_name=feed_source_name,
        )
        for row in _optional_list(payload, "aliases")
    ]
    aliases.extend(
        alias
        for row in profile_rows
        for alias in _aliases_from_profile_row(
            row,
            known_developer_ids=profile_ids,
            default_source_name=feed_source_name,
        )
    )
    projects = [
        _project_from_row(row, known_developer_ids=profile_ids)
        for row in _optional_list(payload, "projects")
    ]
    project_ids = {project.id for project in projects}
    quality_signals = [
        _quality_signal_from_row(
            row,
            known_developer_ids=profile_ids,
            default_source_name=feed_source_name,
        )
        for row in _optional_list(payload, "quality_signals")
    ]
    quality_signals.extend(
        _registry_check_to_signal(
            row,
            known_developer_ids=profile_ids,
            default_source_name=feed_source_name,
        )
        for row in _optional_list(payload, "registry_checks")
    )
    quality_signals.extend(
        _uokik_event_to_signal(
            row,
            known_developer_ids=profile_ids,
            default_source_name=feed_source_name,
        )
        for row in _optional_list(payload, "uokik_events")
    )
    quality_signals.extend(
        _directory_entry_to_signal(
            row,
            known_developer_ids=profile_ids,
            default_source_name=feed_source_name,
        )
        for row in _optional_list(payload, "directory_entries")
    )
    quality_signals.extend(
        _partner_inspection_to_signal(
            row,
            known_developer_ids=profile_ids,
            known_project_ids=project_ids,
            default_source_name=feed_source_name,
        )
        for row in _optional_list(payload, "partner_inspections")
    )
    return DeveloperFeedRecords(
        profiles=profiles,
        aliases=aliases,
        projects=projects,
        quality_signals=quality_signals,
    )


def import_developer_feed(
    path: str | Path,
    session: Session,
    *,
    default_source_name: str | None = None,
    dry_run: bool = False,
) -> DeveloperFeedImportResult:
    records = read_developer_feed(path, default_source_name=default_source_name)
    if dry_run:
        return DeveloperFeedImportResult(
            rows_seen=_rows_seen(records),
            dry_run=True,
            developer_ids=tuple(sorted(profile.id for profile in records.profiles)),
        )
    return import_developer_records_in_session(session, records)


def import_developer_records_in_session(
    session: Session,
    records: DeveloperFeedRecords,
) -> DeveloperFeedImportResult:
    profiles_created = profiles_updated = 0
    aliases_created = aliases_updated = 0
    projects_created = projects_updated = 0
    signals_created = signals_updated = 0

    for profile in records.profiles:
        created = _upsert_profile(session, profile)
        profiles_created += int(created)
        profiles_updated += int(not created)
    for alias in records.aliases:
        created = _upsert_alias(session, alias)
        aliases_created += int(created)
        aliases_updated += int(not created)
    for project in records.projects:
        created = _upsert_project(session, project)
        projects_created += int(created)
        projects_updated += int(not created)
    for signal in records.quality_signals:
        created = _upsert_signal(session, signal)
        signals_created += int(created)
        signals_updated += int(not created)
    session.flush()

    return DeveloperFeedImportResult(
        rows_seen=_rows_seen(records),
        profiles_created=profiles_created,
        profiles_updated=profiles_updated,
        aliases_created=aliases_created,
        aliases_updated=aliases_updated,
        projects_created=projects_created,
        projects_updated=projects_updated,
        signals_created=signals_created,
        signals_updated=signals_updated,
        dry_run=False,
        developer_ids=tuple(sorted(profile.id for profile in records.profiles)),
    )


def _profile_from_row(
    row: Any,
    *,
    default_source_name: str | None,
) -> DeveloperProfile:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer profile row must be an object.")
    name = _required_str(row, "name")
    developer_id = _optional_str(row.get("id")) or slugify(name)
    source_names = _string_list(row.get("source_names"))
    if default_source_name and default_source_name not in source_names:
        source_names.append(default_source_name)
    if not source_names:
        raise DeveloperFeedError(f"Developer profile {developer_id} requires source_names.")
    return DeveloperProfile(
        id=developer_id,
        name=name,
        legal_name=_optional_str(row.get("legal_name")),
        brand_names=_string_list(row.get("brand_names")),
        krs=_optional_str(row.get("krs")),
        nip=_optional_str(row.get("nip")),
        regon=_optional_str(row.get("regon")),
        website_url=_optional_str(row.get("website_url")),
        headquarters_city=_optional_str(row.get("headquarters_city")),
        founded_year=_optional_int(row.get("founded_year")),
        source_names=source_names,
        updated_at=_optional_date(row.get("updated_at")) or date.today(),
    )


def _aliases_from_profile_row(
    row: Any,
    *,
    known_developer_ids: set[str],
    default_source_name: str | None,
) -> list[DeveloperAlias]:
    if not isinstance(row, dict):
        return []
    name = _required_str(row, "name")
    developer_id = _optional_str(row.get("id")) or slugify(name)
    aliases = []
    for alias_row in _optional_list(row, "aliases"):
        if not isinstance(alias_row, dict):
            raise DeveloperFeedError("Developer alias row must be an object.")
        enriched_row = {"developer_id": developer_id, **alias_row}
        aliases.append(
            _alias_from_row(
                enriched_row,
                known_developer_ids=known_developer_ids,
                default_source_name=default_source_name,
            )
        )
    return aliases


def _alias_from_row(
    row: Any,
    *,
    known_developer_ids: set[str],
    default_source_name: str | None,
) -> DeveloperAlias:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer alias row must be an object.")
    developer_id = _required_str(row, "developer_id")
    if developer_id not in known_developer_ids:
        raise DeveloperFeedError(f"Unknown developer_id for alias: {developer_id}.")
    alias = _required_str(row, "alias")
    alias_type = _optional_str(row.get("alias_type")) or "other"
    if alias_type not in ALIAS_TYPES:
        raise DeveloperFeedError(f"Invalid developer alias_type: {alias_type}.")
    typed_alias_type = cast(DeveloperAliasType, alias_type)
    source_name = _optional_str(row.get("source_name")) or default_source_name
    if not source_name:
        raise DeveloperFeedError(f"Developer alias {alias} requires source_name.")
    alias_id = _optional_str(row.get("id")) or slugify(f"{developer_id}-{alias_type}-{alias}")
    return DeveloperAlias(
        id=alias_id,
        developer_id=developer_id,
        alias=alias,
        alias_type=typed_alias_type,
        source_name=source_name,
        source_url=_optional_str(row.get("source_url")),
        confidence_score=_optional_int(row.get("confidence_score")) or 50,
        active=_optional_bool(row.get("active"), default=True),
    )


def _project_from_row(
    row: Any,
    *,
    known_developer_ids: set[str],
) -> DeveloperProject:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer project row must be an object.")
    developer_id = _required_str(row, "developer_id")
    if developer_id not in known_developer_ids:
        raise DeveloperFeedError(f"Unknown developer_id for project: {developer_id}.")
    name = _required_str(row, "name")
    status = _optional_str(row.get("status")) or "unknown"
    if status not in PROJECT_STATUSES:
        raise DeveloperFeedError(f"Invalid developer project status: {status}.")
    project_status = cast(DeveloperProjectStatus, status)
    return DeveloperProject(
        id=_optional_str(row.get("id")) or slugify(f"{developer_id}-{name}"),
        developer_id=developer_id,
        name=name,
        city=_required_str(row, "city"),
        district=_optional_str(row.get("district")),
        status=project_status,
        units_count=_optional_int(row.get("units_count")),
        completed_year=_optional_int(row.get("completed_year")),
        source_url=_optional_str(row.get("source_url")),
    )


def _quality_signal_from_row(
    row: Any,
    *,
    known_developer_ids: set[str],
    default_source_name: str | None,
) -> DeveloperQualitySignal:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer quality signal row must be an object.")
    developer_id = _required_str(row, "developer_id")
    if developer_id not in known_developer_ids:
        raise DeveloperFeedError(f"Unknown developer_id for signal: {developer_id}.")
    signal_type = _required_str(row, "signal_type")
    if signal_type not in SIGNAL_TYPES:
        raise DeveloperFeedError(f"Invalid developer signal_type: {signal_type}.")
    severity = _required_str(row, "severity")
    if severity not in SIGNAL_SEVERITIES:
        raise DeveloperFeedError(f"Invalid developer signal severity: {severity}.")
    typed_signal_type = cast(DeveloperSignalType, signal_type)
    typed_severity = cast(DeveloperSignalSeverity, severity)
    title = _required_str(row, "title")
    source_name = _optional_str(row.get("source_name")) or default_source_name
    if not source_name:
        raise DeveloperFeedError(f"Developer quality signal {title} requires source_name.")
    signal_id = _optional_str(row.get("id")) or slugify(f"{developer_id}-{signal_type}-{title}")
    return DeveloperQualitySignal(
        id=signal_id,
        developer_id=developer_id,
        signal_type=typed_signal_type,
        severity=typed_severity,
        title=title,
        summary=_required_str(row, "summary"),
        source_name=source_name,
        source_url=_optional_str(row.get("source_url")),
        observed_at=_optional_date(row.get("observed_at")),
        confidence_score=_optional_int(row.get("confidence_score")) or 50,
    )


def _registry_check_to_signal(
    row: Any,
    *,
    known_developer_ids: set[str],
    default_source_name: str | None,
) -> DeveloperQualitySignal:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer registry check row must be an object.")
    developer_id = _known_developer_id(row, known_developer_ids, context="registry check")
    registry = _required_str(row, "registry").casefold()
    identifier = _optional_str(row.get("identifier")) or _profile_identifier_label(row)
    status = _optional_str(row.get("status")) or "unknown"
    severity = _typed_severity(
        _optional_str(row.get("severity")) or _registry_status_severity(status)
    )
    source_name = _source_name(row, default_source_name, context="registry check")
    title = _optional_str(row.get("title")) or f"{registry.upper()} registry status: {status}"
    summary = _optional_str(row.get("summary")) or _registry_summary(
        registry=registry,
        identifier=identifier,
        status=status,
    )
    return DeveloperQualitySignal(
        id=_optional_str(row.get("id"))
        or slugify(f"{developer_id}-registry-{registry}-{identifier or status}"),
        developer_id=developer_id,
        signal_type="legal",
        severity=severity,
        title=title,
        summary=summary,
        source_name=source_name,
        source_url=_optional_str(row.get("source_url")),
        observed_at=_optional_date(row.get("observed_at")),
        confidence_score=_optional_int(row.get("confidence_score")) or 70,
    )


def _uokik_event_to_signal(
    row: Any,
    *,
    known_developer_ids: set[str],
    default_source_name: str | None,
) -> DeveloperQualitySignal:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer UOKiK event row must be an object.")
    developer_id = _known_developer_id(row, known_developer_ids, context="UOKiK event")
    source_name = _source_name(row, default_source_name, context="UOKiK event")
    event_type = _optional_str(row.get("event_type")) or "uokik_event"
    title = _required_str(row, "title")
    severity = _typed_severity(_optional_str(row.get("severity")) or "warning")
    return DeveloperQualitySignal(
        id=_optional_str(row.get("id")) or slugify(f"{developer_id}-uokik-{event_type}-{title}"),
        developer_id=developer_id,
        signal_type="legal",
        severity=severity,
        title=title,
        summary=_required_str(row, "summary"),
        source_name=source_name,
        source_url=_optional_str(row.get("source_url")),
        observed_at=_optional_date(row.get("observed_at")),
        confidence_score=_optional_int(row.get("confidence_score")) or 65,
    )


def _directory_entry_to_signal(
    row: Any,
    *,
    known_developer_ids: set[str],
    default_source_name: str | None,
) -> DeveloperQualitySignal:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer directory entry row must be an object.")
    developer_id = _known_developer_id(row, known_developer_ids, context="directory entry")
    directory_name = _required_str(row, "directory_name")
    source_name = _source_name(row, default_source_name, context="directory entry")
    signal_type = _typed_signal_type(_optional_str(row.get("signal_type")) or "transparency")
    severity = _typed_severity(_optional_str(row.get("severity")) or "info")
    title = _optional_str(row.get("title")) or f"{directory_name} developer directory entry"
    summary = _optional_str(row.get("summary")) or _directory_summary(row, directory_name)
    return DeveloperQualitySignal(
        id=_optional_str(row.get("id")) or slugify(f"{developer_id}-directory-{directory_name}"),
        developer_id=developer_id,
        signal_type=signal_type,
        severity=severity,
        title=title,
        summary=summary,
        source_name=source_name,
        source_url=_optional_str(row.get("source_url")) or _optional_str(row.get("profile_url")),
        observed_at=_optional_date(row.get("observed_at")),
        confidence_score=_optional_int(row.get("confidence_score")) or 58,
    )


def _partner_inspection_to_signal(
    row: Any,
    *,
    known_developer_ids: set[str],
    known_project_ids: set[str],
    default_source_name: str | None,
) -> DeveloperQualitySignal:
    if not isinstance(row, dict):
        raise DeveloperFeedError("Developer partner inspection row must be an object.")
    developer_id = _known_developer_id(row, known_developer_ids, context="partner inspection")
    project_id = _optional_str(row.get("project_id"))
    if project_id is not None and project_id not in known_project_ids:
        raise DeveloperFeedError(f"Unknown project_id for partner inspection: {project_id}.")
    source_name = _source_name(row, default_source_name, context="partner inspection")
    title = _required_str(row, "title")
    summary = _required_str(row, "summary")
    if project_id:
        summary = f"Project {project_id}: {summary}"
    return DeveloperQualitySignal(
        id=_optional_str(row.get("id"))
        or slugify(f"{developer_id}-inspection-{project_id or title}"),
        developer_id=developer_id,
        signal_type=_typed_signal_type(
            _optional_str(row.get("signal_type")) or "technical_quality"
        ),
        severity=_typed_severity(_optional_str(row.get("severity")) or "warning"),
        title=title,
        summary=summary,
        source_name=source_name,
        source_url=_optional_str(row.get("source_url")),
        observed_at=_optional_date(row.get("observed_at")),
        confidence_score=_optional_int(row.get("confidence_score")) or 60,
    )


def _upsert_profile(session: Session, profile: DeveloperProfile) -> bool:
    row = session.get(DeveloperProfileRow, profile.id)
    created = row is None
    if row is None:
        row = DeveloperProfileRow(id=profile.id)
        session.add(row)
    row.name = profile.name
    row.legal_name = profile.legal_name
    row.brand_names_json = profile.brand_names
    row.krs = profile.krs
    row.nip = profile.nip
    row.regon = profile.regon
    row.website_url = profile.website_url
    row.headquarters_city = profile.headquarters_city
    row.founded_year = profile.founded_year
    row.source_names_json = profile.source_names
    row.updated_at = _date_to_datetime(profile.updated_at)
    return created


def _upsert_project(session: Session, project: DeveloperProject) -> bool:
    row = session.get(DeveloperProjectRow, project.id)
    created = row is None
    if row is None:
        row = DeveloperProjectRow(id=project.id)
        session.add(row)
    row.developer_id = project.developer_id
    row.name = project.name
    row.city = project.city
    row.district = project.district
    row.status = project.status
    row.units_count = project.units_count
    row.completed_year = project.completed_year
    row.source_url = project.source_url
    return created


def _upsert_alias(session: Session, alias: DeveloperAlias) -> bool:
    row = session.get(DeveloperAliasRow, alias.id)
    created = row is None
    if row is None:
        row = DeveloperAliasRow(id=alias.id)
        session.add(row)
    row.developer_id = alias.developer_id
    row.alias = alias.alias
    row.alias_type = alias.alias_type
    row.source_name = alias.source_name
    row.source_url = alias.source_url
    row.confidence_score = alias.confidence_score
    row.active = alias.active
    return created


def _upsert_signal(session: Session, signal: DeveloperQualitySignal) -> bool:
    row = session.get(DeveloperQualitySignalRow, signal.id)
    created = row is None
    if row is None:
        row = DeveloperQualitySignalRow(id=signal.id)
        session.add(row)
    row.developer_id = signal.developer_id
    row.signal_type = signal.signal_type
    row.severity = signal.severity
    row.title = signal.title
    row.summary = signal.summary
    row.source_name = signal.source_name
    row.source_url = signal.source_url
    row.observed_at = _date_to_datetime(signal.observed_at) if signal.observed_at else None
    row.confidence_score = signal.confidence_score
    return created


def _rows_seen(records: DeveloperFeedRecords) -> int:
    return (
        len(records.profiles)
        + len(records.aliases)
        + len(records.projects)
        + len(records.quality_signals)
    )


def _known_developer_id(
    row: dict,
    known_developer_ids: set[str],
    *,
    context: str,
) -> str:
    developer_id = _required_str(row, "developer_id")
    if developer_id not in known_developer_ids:
        raise DeveloperFeedError(f"Unknown developer_id for {context}: {developer_id}.")
    return developer_id


def _source_name(
    row: dict,
    default_source_name: str | None,
    *,
    context: str,
) -> str:
    source_name = _optional_str(row.get("source_name")) or default_source_name
    if not source_name:
        raise DeveloperFeedError(f"Developer {context} requires source_name.")
    return source_name


def _typed_signal_type(signal_type: str) -> DeveloperSignalType:
    if signal_type not in SIGNAL_TYPES:
        raise DeveloperFeedError(f"Invalid developer signal_type: {signal_type}.")
    return cast(DeveloperSignalType, signal_type)


def _typed_severity(severity: str) -> DeveloperSignalSeverity:
    if severity not in SIGNAL_SEVERITIES:
        raise DeveloperFeedError(f"Invalid developer signal severity: {severity}.")
    return cast(DeveloperSignalSeverity, severity)


def _registry_status_severity(status: str) -> DeveloperSignalSeverity:
    normalized = status.casefold()
    if any(token in normalized for token in ("active", "aktywn", "registered")):
        return "positive"
    if any(token in normalized for token in ("suspended", "blocked", "liquidation", "insolv")):
        return "risk"
    if any(token in normalized for token in ("unknown", "missing", "unconfirmed")):
        return "warning"
    return "info"


def _profile_identifier_label(row: dict) -> str | None:
    for key in ("krs", "nip", "regon"):
        value = _optional_str(row.get(key))
        if value:
            return f"{key.upper()} {value}"
    return None


def _registry_summary(*, registry: str, identifier: str | None, status: str) -> str:
    identifier_text = f" {identifier}" if identifier else ""
    return f"{registry.upper()}{identifier_text} status was imported as {status}."


def _directory_summary(row: dict, directory_name: str) -> str:
    city = _optional_str(row.get("city"))
    active_projects = _optional_int(row.get("active_projects_count"))
    parts = [f"{directory_name} directory profile was imported."]
    if city:
        parts.append(f"Coverage city: {city}.")
    if active_projects is not None:
        parts.append(f"Active projects in directory: {active_projects}.")
    return " ".join(parts)


def _required_list(payload: dict, key: str) -> list:
    items = _optional_list(payload, key)
    if not items:
        raise DeveloperFeedError(f"Developer feed requires non-empty {key}.")
    return items


def _optional_list(payload: dict, key: str) -> list:
    value = payload.get(key, [])
    if value is None:
        return []
    if not isinstance(value, list):
        raise DeveloperFeedError(f"Developer feed field {key} must be a list.")
    return value


def _required_str(row: dict, key: str) -> str:
    value = _optional_str(row.get(key))
    if value is None:
        raise DeveloperFeedError(f"Developer feed row requires {key}.")
    return value


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _optional_int(value: Any) -> int | None:
    normalized = _optional_str(value)
    if normalized is None:
        return None
    return int(normalized)


def _optional_bool(value: Any, *, default: bool) -> bool:
    normalized = _optional_str(value)
    if normalized is None:
        return default
    match normalized.casefold():
        case "1" | "true" | "yes" | "tak" | "y":
            return True
        case "0" | "false" | "no" | "nie" | "n":
            return False
        case _:
            raise DeveloperFeedError(f"Expected boolean value, got {value}.")


def _optional_date(value: Any) -> date | None:
    normalized = _optional_str(value)
    if normalized is None:
        return None
    return date.fromisoformat(normalized)


def _string_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(";") if item.strip()]
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    raise DeveloperFeedError("Expected a string list or semicolon-separated string.")


def _date_to_datetime(value: date) -> datetime:
    return datetime.combine(value, time.min)
