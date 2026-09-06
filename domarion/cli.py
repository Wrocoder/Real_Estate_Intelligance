import argparse
import json
import os
import sys
import time
from contextlib import contextmanager

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.ingestion.authorized_feed import AuthorizedFeedError, import_authorized_feed
from domarion.ingestion.db_writer import (
    import_partner_csv,
    rebuild_price_history_metrics_in_session,
)
from domarion.ingestion.developers import import_developer_feed
from domarion.ingestion.district_boundaries import (
    DistrictBoundaryError,
    assign_transaction_districts,
    import_district_boundaries,
)
from domarion.ingestion.infrastructure_references import import_infrastructure_references
from domarion.ingestion.partner_csv import read_partner_csv
from domarion.ingestion.planned_investments import import_planned_investments
from domarion.ingestion.rcn_transactions import (
    RcnTransactionError,
    import_rcn_transactions,
    rcn_import_is_due,
)
from domarion.ingestion_admin_store.factory import get_ingestion_admin_store
from domarion.repositories.factory import get_repository
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import AlertDeliveryBatchRequest
from domarion.scripts.seed_demo import seed_demo_data
from domarion.services.alert_delivery import send_telegram_message
from domarion.services.alert_scheduler import run_daily_email_alert_delivery
from domarion.services.area_snapshots import run_area_market_snapshot_job
from domarion.services.backtesting import run_scoring_backtest
from domarion.services.market_metrics import refresh_market_metrics
from domarion.services.production_readiness import build_production_readiness_report
from domarion.services.report_generation import write_object_report_html
from domarion.user_store.factory import get_user_store


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(prog="domarion")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("seed-demo", help="Seed PostgreSQL with demo Wrocław listings.")
    import_parser = subparsers.add_parser(
        "import-partner-csv",
        help="Import a legal partner/manual CSV feed into PostgreSQL.",
    )
    import_parser.add_argument("path", help="Path to UTF-8 CSV file.")
    import_parser.add_argument("--source-name", required=True, help="Canonical source name.")
    import_parser.add_argument("--source-type", default="partner_csv", help="Source type label.")
    import_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate CSV without writing to database.",
    )
    import_parser.add_argument(
        "--mark-missing-removed",
        action="store_true",
        help=(
            "Treat the CSV as a complete source snapshot and mark previously active "
            "source listings missing from it as removed."
        ),
    )
    feed_parser = subparsers.add_parser(
        "import-authorized-feed",
        help="Import a bounded approved JSON/API listing feed into PostgreSQL.",
    )
    feed_parser.add_argument("location", help="Local JSON export or approved feed URL.")
    feed_parser.add_argument("--source-name", required=True, help="Approved source registry name.")
    feed_parser.add_argument("--dry-run", action="store_true", help="Validate without writing.")
    feed_parser.add_argument(
        "--mark-missing-removed",
        action="store_true",
        help="Mark missing listings removed only when every row is valid.",
    )
    feed_parser.add_argument("--max-listings", type=int, default=10_000)
    feed_parser.add_argument("--timeout-seconds", type=float, default=20.0)
    rcn_parser = subparsers.add_parser(
        "import-rcn-transactions",
        help="Import approved RCN/GUGiK apartment transactions into PostgreSQL.",
    )
    rcn_parser.add_argument("location", help="Local GeoJSON/GML file or approved RCN WFS URL.")
    rcn_parser.add_argument(
        "--source-name", required=True, help="Approved RCN source registry name."
    )
    rcn_parser.add_argument("--dry-run", action="store_true", help="Validate without writing.")
    rcn_parser.add_argument("--max-rows", type=int, default=100_000)
    rcn_parser.add_argument("--max-pages", type=int, default=500)
    rcn_parser.add_argument("--timeout-seconds", type=float, default=30.0)
    boundary_parser = subparsers.add_parser(
        "import-district-boundaries",
        help="Import authoritative Wrocław district/osiedle polygons from GeoJSON or SHP/ZIP.",
    )
    boundary_parser.add_argument("location", help="Local GeoJSON, Shapefile or ZIP path.")
    boundary_parser.add_argument(
        "--source-name",
        default="Wrocław Geoportal osiedle boundaries",
        help="Provenance label for the boundary dataset.",
    )
    boundary_parser.add_argument(
        "--source-url",
        default="https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip",
    )
    boundary_parser.add_argument("--source-crs", type=int, default=2177)
    boundary_parser.add_argument("--dry-run", action="store_true")
    subparsers.add_parser(
        "assign-transaction-districts",
        help="Assign existing geocoded RCN observations to imported district polygons.",
    )
    planned_parser = subparsers.add_parser(
        "import-planned-investments",
        help="Import planned infrastructure investments from a legal JSON/CSV open-data file.",
    )
    planned_parser.add_argument("path", help="Path to UTF-8 JSON or CSV file.")
    planned_parser.add_argument(
        "--source-name",
        default=None,
        help="Fallback source name if the file does not define one.",
    )
    planned_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate the file without writing to the repository backend.",
    )
    infrastructure_parser = subparsers.add_parser(
        "import-infrastructure-references",
        help="Import schools, transport, amenities and industrial zones from JSON/CSV.",
    )
    infrastructure_parser.add_argument("path", help="Path to UTF-8 JSON or CSV file.")
    infrastructure_parser.add_argument(
        "--source-name",
        default=None,
        help="Fallback source name if the file does not define one.",
    )
    infrastructure_parser.add_argument(
        "--layer",
        default=None,
        help="Fallback layer for CSV/list files without a layer column.",
    )
    infrastructure_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate the file without writing to PostgreSQL.",
    )
    developer_parser = subparsers.add_parser(
        "import-developer-feed",
        help="Import legal-first developer profiles, projects and quality signals from JSON.",
    )
    developer_parser.add_argument("path", help="Path to UTF-8 developer feed JSON file.")
    developer_parser.add_argument(
        "--source-name",
        default=None,
        help="Fallback source name if the feed does not define one.",
    )
    developer_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate the feed without writing to PostgreSQL.",
    )
    report_parser = subparsers.add_parser(
        "generate-report-html",
        help="Generate a printable HTML object report from local demo data.",
    )
    report_parser.add_argument("listing_id", help="Listing ID to render.")
    report_parser.add_argument("output_path", help="Where to write the HTML report.")
    report_parser.add_argument(
        "--audience",
        choices=["buyer", "realtor", "investor"],
        default="buyer",
        help="Report audience variant.",
    )
    backtest_parser = subparsers.add_parser(
        "scoring-backtest",
        help="Run fair-price scoring backtest on repository price history.",
    )
    backtest_parser.add_argument("--city", default=None, help="Optional city filter.")
    backtest_parser.add_argument("--district", default=None, help="Optional district filter.")
    backtest_parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximum number of example backtest rows to print.",
    )
    snapshot_parser = subparsers.add_parser(
        "snapshot-area-markets",
        help="Persist current area statistics as historical market snapshots.",
    )
    snapshot_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build snapshots without writing to PostgreSQL.",
    )
    subparsers.add_parser(
        "rebuild-price-history",
        help="Recalculate listing first/last seen and price move metrics from snapshots.",
    )
    metrics_parser = subparsers.add_parser(
        "refresh-market-metrics",
        help="Rebuild Wrocław area metrics from live listing snapshots.",
    )
    metrics_parser.add_argument("--city", default="Wrocław")
    metrics_parser.add_argument("--minimum-quality", type=int, default=60)
    daily_alert_parser = subparsers.add_parser(
        "deliver-daily-email-alerts",
        help="Run due daily email alerts. Dry-run by default; pass --send for live attempts.",
    )
    daily_alert_parser.add_argument(
        "--send",
        action="store_true",
        help="Persist delivery jobs and use configured email transport.",
    )
    daily_alert_parser.add_argument(
        "--force",
        action="store_true",
        help="Ignore the 24-hour cooldown window.",
    )
    daily_alert_parser.add_argument(
        "--max-matches",
        type=int,
        default=10,
        help="Maximum matches included in each alert delivery.",
    )
    daily_alert_parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="Maximum active daily email alerts to scan.",
    )
    worker_parser = subparsers.add_parser(
        "worker",
        help="Run background worker tasks in a loop for deployment environments.",
    )
    worker_parser.add_argument(
        "--task",
        action="append",
        choices=[
            "daily-email-alerts",
            "area-market-snapshots",
            "price-history-rebuild",
            "authorized-market-feed",
            "rcn-transactions",
        ],
        default=None,
        help="Task to run. Can be repeated. Defaults to WORKER_TASKS or daily-email-alerts.",
    )
    worker_parser.add_argument(
        "--run-once",
        action="store_true",
        default=_env_bool("WORKER_RUN_ONCE", False),
        help="Run configured tasks once and exit.",
    )
    worker_parser.add_argument(
        "--interval-seconds",
        type=float,
        default=float(os.getenv("WORKER_INTERVAL_SECONDS", "3600")),
        help="Delay between worker loops.",
    )
    worker_parser.add_argument(
        "--send",
        action="store_true",
        default=_env_bool("ALERT_WORKER_SEND", False),
        help="Send daily email alerts instead of dry-run.",
    )
    worker_parser.add_argument(
        "--apply",
        action="store_true",
        default=_env_bool("WORKER_APPLY", False),
        help="Persist maintenance task writes instead of dry-run/skip behavior.",
    )
    worker_parser.add_argument(
        "--force",
        action="store_true",
        default=_env_bool("WORKER_FORCE", False),
        help="Ignore daily alert cooldowns for alert tasks.",
    )
    worker_parser.add_argument(
        "--max-matches",
        type=int,
        default=int(os.getenv("ALERT_WORKER_MAX_MATCHES", "10")),
        help="Maximum matches included in each alert delivery.",
    )
    worker_parser.add_argument(
        "--limit",
        type=int,
        default=int(os.getenv("ALERT_WORKER_LIMIT", "500")),
        help="Maximum active daily email alerts to scan.",
    )
    preflight_parser = subparsers.add_parser(
        "production-preflight",
        help="Validate production readiness configuration and print a JSON report.",
    )
    preflight_parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 when warnings are present, not only critical blockers.",
    )

    args = parser.parse_args()

    if args.command == "seed-demo":
        result = seed_demo_data()
        _print_json(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "import-partner-csv":
        if args.dry_run:
            records = read_partner_csv(args.path, args.source_name, args.source_type)
            result = {
                "rows_seen": len(records),
                "listing_ids": [record.source_listing_id for record in records[:10]],
                "dry_run": True,
            }
        else:
            import_result = import_partner_csv(
                args.path,
                args.source_name,
                args.source_type,
                mark_missing_removed=args.mark_missing_removed,
            )
            result = {
                **import_result.as_dict(),
                "removed_marked": import_result.removed_marked,
            }
        _print_json(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "import-authorized-feed":
        settings = get_settings()
        if not args.dry_run and settings.data_repository_backend != "postgres":
            raise SystemExit(
                "import-authorized-feed writes require DATA_REPOSITORY_BACKEND=postgres."
            )
        try:
            with SessionLocal() as session:
                result = import_authorized_feed(
                    session,
                    args.location,
                    source_name=args.source_name,
                    dry_run=args.dry_run,
                    mark_missing_removed=args.mark_missing_removed,
                    max_listings=args.max_listings,
                    timeout_seconds=args.timeout_seconds,
                )
                if not args.dry_run:
                    session.commit()
        except AuthorizedFeedError as exc:
            raise SystemExit(str(exc)) from exc
        _print_json(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    elif args.command == "import-rcn-transactions":
        settings = get_settings()
        if not args.dry_run and settings.data_repository_backend != "postgres":
            raise SystemExit(
                "import-rcn-transactions writes require DATA_REPOSITORY_BACKEND=postgres."
            )
        try:
            with SessionLocal() as session:
                result = import_rcn_transactions(
                    session,
                    args.location,
                    source_name=args.source_name,
                    dry_run=args.dry_run,
                    max_rows=args.max_rows,
                    max_pages=args.max_pages,
                    timeout_seconds=args.timeout_seconds,
                )
                if not args.dry_run:
                    session.commit()
        except RcnTransactionError as exc:
            raise SystemExit(str(exc)) from exc
        _print_json(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    elif args.command == "import-district-boundaries":
        settings = get_settings()
        if not args.dry_run and settings.data_repository_backend != "postgres":
            raise SystemExit(
                "import-district-boundaries writes require DATA_REPOSITORY_BACKEND=postgres."
            )
        try:
            with SessionLocal() as session:
                result = import_district_boundaries(
                    session,
                    args.location,
                    source_name=args.source_name,
                    source_url=args.source_url,
                    source_crs=args.source_crs,
                    dry_run=args.dry_run,
                )
                if not args.dry_run:
                    session.commit()
        except DistrictBoundaryError as exc:
            raise SystemExit(str(exc)) from exc
        _print_json(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    elif args.command == "assign-transaction-districts":
        settings = get_settings()
        if settings.data_repository_backend != "postgres":
            raise SystemExit(
                "assign-transaction-districts requires DATA_REPOSITORY_BACKEND=postgres."
            )
        with SessionLocal() as session:
            result = assign_transaction_districts(session)
            metrics = refresh_market_metrics(session, city="Wrocław")
            session.commit()
        _print_json(
            json.dumps(
                {"district_assignment": result, "market_metrics": metrics},
                ensure_ascii=False,
                indent=2,
            )
        )
    elif args.command == "import-planned-investments":
        if args.dry_run:
            result = import_planned_investments(
                args.path,
                InMemoryRealEstateRepository(),
                default_source_name=args.source_name,
                dry_run=True,
            ).as_dict()
        else:
            with contextmanager(get_repository)() as repository:
                result = import_planned_investments(
                    args.path,
                    repository,
                    default_source_name=args.source_name,
                ).as_dict()
        _print_json(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "import-infrastructure-references":
        if not args.dry_run and get_settings().data_repository_backend != "postgres":
            raise SystemExit(
                "import-infrastructure-references writes require "
                "DATA_REPOSITORY_BACKEND=postgres. Use --dry-run for local validation."
            )
        with SessionLocal() as session:
            result = import_infrastructure_references(
                args.path,
                session,
                default_layer=args.layer,
                default_source_name=args.source_name,
                dry_run=args.dry_run,
            )
            if not args.dry_run:
                session.commit()
        _print_json(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    elif args.command == "import-developer-feed":
        if not args.dry_run and get_settings().data_repository_backend != "postgres":
            raise SystemExit(
                "import-developer-feed writes require DATA_REPOSITORY_BACKEND=postgres. "
                "Use --dry-run for local validation."
            )
        with SessionLocal() as session:
            result = import_developer_feed(
                args.path,
                session,
                default_source_name=args.source_name,
                dry_run=args.dry_run,
            )
            if not args.dry_run:
                session.commit()
        _print_json(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    elif args.command == "generate-report-html":
        settings = get_settings()
        repository = InMemoryRealEstateRepository(
            include_demo_data=settings.demo_mode_enabled
        )
        path = write_object_report_html(
            repository,
            args.listing_id,
            args.output_path,
            args.audience,
        )
        _print_json(json.dumps({"output_path": str(path), "listing_id": args.listing_id}, indent=2))
    elif args.command == "scoring-backtest":
        with contextmanager(get_repository)() as repository:
            result = run_scoring_backtest(
                repository,
                city=args.city,
                district=args.district,
                item_limit=args.limit,
            )
        _print_json(result.model_dump_json(indent=2))
    elif args.command == "snapshot-area-markets":
        with contextmanager(get_repository)() as repository:
            if args.dry_run:
                result = run_area_market_snapshot_job(repository, dry_run=True)
            else:
                settings = get_settings()
                if settings.data_repository_backend != "postgres":
                    raise SystemExit(
                        "snapshot-area-markets writes require DATA_REPOSITORY_BACKEND=postgres. "
                        "Use --dry-run for local memory mode."
                    )
                with SessionLocal() as session:
                    result = run_area_market_snapshot_job(
                        repository,
                        session=session,
                        dry_run=False,
                    )
                    session.commit()
        _print_json(result.model_dump_json(indent=2))
    elif args.command == "rebuild-price-history":
        settings = get_settings()
        if settings.data_repository_backend != "postgres":
            raise SystemExit(
                "rebuild-price-history requires DATA_REPOSITORY_BACKEND=postgres."
            )
        with SessionLocal() as session:
            result = rebuild_price_history_metrics_in_session(session)
            session.commit()
        _print_json(result.model_dump_json(indent=2))
    elif args.command == "refresh-market-metrics":
        settings = get_settings()
        if settings.data_repository_backend != "postgres":
            raise SystemExit("refresh-market-metrics requires DATA_REPOSITORY_BACKEND=postgres.")
        with SessionLocal() as session:
            result = refresh_market_metrics(
                session,
                city=args.city,
                minimum_quality=args.minimum_quality,
            )
            session.commit()
        _print_json(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "deliver-daily-email-alerts":
        with contextmanager(get_repository)() as repository:
            with contextmanager(get_user_store)() as user_store:
                result = run_daily_email_alert_delivery(
                    repository,
                    user_store,
                    AlertDeliveryBatchRequest(
                        dry_run=not args.send,
                        force=args.force,
                        max_matches=args.max_matches,
                        limit=args.limit,
                    ),
                )
        _print_json(result.model_dump_json(indent=2))
    elif args.command == "worker":
        _run_worker(args)
    elif args.command == "production-preflight":
        _run_production_preflight(args)


def _print_json(payload: str) -> None:
    try:
        print(payload)
    except UnicodeEncodeError:
        sys.stdout.buffer.write(payload.encode("utf-8"))
        sys.stdout.buffer.write(b"\n")


def _run_worker(args: argparse.Namespace) -> None:
    tasks = args.task or _env_list("WORKER_TASKS", ["daily-email-alerts"])
    iteration = 0
    while True:
        iteration += 1
        results = [_run_worker_task(task, args) for task in tasks]
        _print_json(
            json.dumps(
                {
                    "worker": "domarion",
                    "iteration": iteration,
                    "tasks": tasks,
                    "results": results,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        if args.run_once:
            return
        time.sleep(max(args.interval_seconds, 1.0))


def _run_worker_task(task: str, args: argparse.Namespace) -> dict:
    if task == "daily-email-alerts":
        with contextmanager(get_repository)() as repository:
            with contextmanager(get_user_store)() as user_store:
                result = run_daily_email_alert_delivery(
                    repository,
                    user_store,
                    AlertDeliveryBatchRequest(
                        dry_run=not args.send,
                        force=args.force,
                        max_matches=args.max_matches,
                        limit=args.limit,
                    ),
                )
        return json.loads(result.model_dump_json())
    if task == "area-market-snapshots":
        with contextmanager(get_repository)() as repository:
            if not args.apply:
                result = run_area_market_snapshot_job(repository, dry_run=True)
            else:
                settings = get_settings()
                if settings.data_repository_backend != "postgres":
                    raise SystemExit(
                        "area-market-snapshots worker writes require "
                        "DATA_REPOSITORY_BACKEND=postgres."
                    )
                with SessionLocal() as session:
                    result = run_area_market_snapshot_job(
                        repository,
                        session=session,
                        dry_run=False,
                    )
                    session.commit()
        return json.loads(result.model_dump_json())
    if task == "price-history-rebuild":
        if not args.apply:
            return {
                "task": task,
                "dry_run": True,
                "skipped": "price-history-rebuild writes only run with --apply.",
            }
        settings = get_settings()
        if settings.data_repository_backend != "postgres":
            raise SystemExit(
                "price-history-rebuild worker writes require DATA_REPOSITORY_BACKEND=postgres."
            )
        with SessionLocal() as session:
            result = rebuild_price_history_metrics_in_session(session)
            session.commit()
        return json.loads(result.model_dump_json())
    if task == "authorized-market-feed":
        settings = get_settings()
        location = os.getenv("MARKET_DATA_FEED_LOCATION")
        source_name = os.getenv("MARKET_DATA_FEED_SOURCE_NAME")
        if not location or not source_name:
            return {
                "task": task,
                "status": "blocked",
                "message": (
                    "Set MARKET_DATA_FEED_LOCATION and MARKET_DATA_FEED_SOURCE_NAME "
                    "before enabling this worker task."
                ),
            }
        if settings.data_repository_backend != "postgres":
            raise SystemExit("authorized-market-feed requires DATA_REPOSITORY_BACKEND=postgres.")
        try:
            with SessionLocal() as session:
                result = import_authorized_feed(
                    session,
                    location,
                    source_name=source_name,
                    dry_run=not args.apply,
                    mark_missing_removed=_env_bool(
                        "MARKET_DATA_FEED_COMPLETE_SNAPSHOT", False
                    ),
                    max_listings=int(os.getenv("MARKET_DATA_FEED_MAX_LISTINGS", "10000")),
                    timeout_seconds=float(os.getenv("MARKET_DATA_FEED_TIMEOUT_SECONDS", "20")),
                )
                if args.apply:
                    session.commit()
            return result.as_dict()
        except AuthorizedFeedError as exc:
            return {"task": task, "status": "blocked", "message": str(exc)}
    if task == "rcn-transactions":
        settings = get_settings()
        location = os.getenv("RCN_TRANSACTIONS_LOCATION")
        source_name = os.getenv("RCN_TRANSACTIONS_SOURCE_NAME")
        if not location or not source_name:
            return {
                "task": task,
                "status": "blocked",
                "message": (
                    "Set RCN_TRANSACTIONS_LOCATION and RCN_TRANSACTIONS_SOURCE_NAME "
                    "before enabling this worker task."
                ),
            }
        if settings.data_repository_backend != "postgres":
            raise SystemExit("rcn-transactions requires DATA_REPOSITORY_BACKEND=postgres.")
        try:
            with SessionLocal() as session:
                if not args.run_once and not rcn_import_is_due(
                    session,
                    source_name=source_name,
                    interval_seconds=int(
                        os.getenv("RCN_TRANSACTIONS_INTERVAL_SECONDS", "86400")
                    ),
                ):
                    return {
                        "task": task,
                        "status": "skipped",
                        "message": "RCN transaction import is not due yet.",
                    }
                boundary_result = None
                boundary_location = os.getenv("RCN_DISTRICT_BOUNDARIES_LOCATION")
                if boundary_location:
                    boundary_result = import_district_boundaries(
                        session,
                        boundary_location,
                        source_name=os.getenv(
                            "RCN_DISTRICT_BOUNDARIES_SOURCE_NAME",
                            "Wrocław Geoportal osiedle boundaries",
                        ),
                        source_url=os.getenv(
                            "RCN_DISTRICT_BOUNDARIES_SOURCE_URL",
                            "https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip",
                        ),
                        source_crs=int(os.getenv("RCN_DISTRICT_BOUNDARIES_SOURCE_CRS", "2177")),
                        dry_run=not args.apply,
                    )
                result = import_rcn_transactions(
                    session,
                    location,
                    source_name=source_name,
                    dry_run=not args.apply,
                    max_rows=int(os.getenv("RCN_TRANSACTIONS_MAX_ROWS", "100000")),
                    max_pages=int(os.getenv("RCN_TRANSACTIONS_MAX_PAGES", "500")),
                    timeout_seconds=float(os.getenv("RCN_TRANSACTIONS_TIMEOUT_SECONDS", "30")),
                )
                if args.apply:
                    session.commit()
            payload = result.as_dict()
            if boundary_result is not None:
                payload["district_boundaries"] = boundary_result.as_dict()
            if args.apply:
                payload["telegram"] = _send_rcn_telegram_report(payload)
            return payload
        except RcnTransactionError as exc:
            return {"task": task, "status": "blocked", "message": str(exc)}
        except DistrictBoundaryError as exc:
            return {"task": task, "status": "blocked", "message": str(exc)}
    raise SystemExit(f"Unknown worker task: {task}")


def _run_production_preflight(args: argparse.Namespace) -> None:
    settings = get_settings()
    with contextmanager(get_ingestion_admin_store)() as store:
        sources = (
            store.list_sources()
            if settings.environment.strip().casefold() == "production"
            else []
        )
    report = build_production_readiness_report(settings, sources=sources)
    _print_json(report.model_dump_json(indent=2))
    if report.status == "blocked" or (args.strict and report.status != "ready"):
        raise SystemExit(1)


def _send_rcn_telegram_report(payload: dict[str, object]) -> dict[str, object]:
    """Keep ingestion successful when an optional operator notification is unavailable."""

    message = "\n".join(
        [
            "WartoMetr: daily Wrocław RCN transaction update",
            f"New transactions: {payload.get('transactions_created', 0)}",
            f"Changed transactions: {payload.get('transactions_changed', 0)}",
            f"Reconfirmed transactions: {payload.get('transactions_reconfirmed', 0)}",
            f"Rejected source rows: {payload.get('rows_rejected', 0)}",
            f"Assigned to districts: {payload.get('districts_assigned', 0)}",
            (
                "Without a district assignment: "
                f"{payload.get('transactions_with_unresolved_district', 0)}"
            ),
        ]
    )
    result = send_telegram_message(
        message,
        target=os.getenv("RCN_TRANSACTIONS_TELEGRAM_CHAT_ID") or None,
    )
    return {
        "provider": result.provider,
        "status": result.status,
        "delivered_count": result.delivered_count,
        "message": result.message,
        "metadata": result.metadata,
    }


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().casefold() in {"1", "true", "yes", "y", "on"}


def _env_list(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)
    if raw is None:
        return default
    items = [item.strip() for item in raw.split(",") if item.strip()]
    return items or default


if __name__ == "__main__":
    main()
