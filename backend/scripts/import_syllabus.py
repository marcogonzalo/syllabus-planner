#!/usr/bin/env python3
"""Import a syllabus CSV into the syllabus planner database."""

import argparse
import sys
from pathlib import Path

from sqlmodel import Session

from app.database import engine, init_db
from app.services.import_csv import import_syllabus_from_csv


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import syllabus CSV into the database.")
    parser.add_argument("csv_path", type=Path,
                        help="Path to the syllabus CSV file")
    parser.add_argument(
        "--title",
        help="Root syllabus title (defaults to CSV filename stem)",
    )
    parser.add_argument(
        "--keep-existing",
        action="store_true",
        help="Do not replace an existing syllabus with the same title",
    )
    args = parser.parse_args()

    if not args.csv_path.exists():
        print(f"CSV not found: {args.csv_path}", file=sys.stderr)
        return 1

    init_db()
    with Session(engine) as session:
        syllabus = import_syllabus_from_csv(
            session,
            args.csv_path,
            title=args.title,
            replace_existing=not args.keep_existing,
        )

    print(
        f"Imported syllabus id={syllabus.id} title={syllabus.title!r} "
        f"from {args.csv_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
