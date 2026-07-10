import argparse
import json
from contextlib import contextmanager

from domarion.ingestion.db_writer import import_partner_csv
from domarion.ingestion.partner_csv import read_partner_csv
from domarion.ingestion.planned_investments import import_planned_investments
from domarion.repositories.factory import get_repository
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.scripts.seed_demo import seed_demo_data
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

    args = parser.parse_args()

    if args.command == "seed-demo":
        result = seed_demo_data()
        print(json.dumps(result, ensure_ascii=False, indent=2))
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
        print(json.dumps(result, ensure_ascii=False, indent=2))
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
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "generate-report-html":
        repository = InMemoryRealEstateRepository()
        path = write_object_report_html(
            repository,
            args.listing_id,
            args.output_path,
            args.audience,
        )
        print(json.dumps({"output_path": str(path), "listing_id": args.listing_id}, indent=2))


if __name__ == "__main__":
    main()
