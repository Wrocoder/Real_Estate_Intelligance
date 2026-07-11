import argparse
import json
import sys
from contextlib import contextmanager

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.ingestion.db_writer import (
    import_partner_csv,
    rebuild_price_history_metrics_in_session,
)
from domarion.ingestion.partner_csv import read_partner_csv
from domarion.ingestion.planned_investments import import_planned_investments
from domarion.repositories.factory import get_repository
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.scripts.seed_demo import seed_demo_data
from domarion.services.area_snapshots import run_area_market_snapshot_job
from domarion.services.backtesting import run_scoring_backtest
from domarion.services.report_generation import write_object_report_html


def main() -> None:
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
            result = import_partner_csv(args.path, args.source_name, args.source_type).as_dict()
        _print_json(json.dumps(result, ensure_ascii=False, indent=2))
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
    elif args.command == "generate-report-html":
        repository = InMemoryRealEstateRepository()
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


def _print_json(payload: str) -> None:
    try:
        print(payload)
    except UnicodeEncodeError:
        sys.stdout.buffer.write(payload.encode("utf-8"))
        sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    main()
