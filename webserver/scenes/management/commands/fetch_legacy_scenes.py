import os

import psycopg2
import tqdm
from django.core.management.base import BaseCommand
from psycopg2 import sql
from psycopg2.extras import DictCursor

from scenes.models import LegacyScene


class Command(BaseCommand):
    help = """Fetches legacy scenes from the database specified by the
    LEGACY_DATABASE_URL environment variable and saves as LegacyScene
    objects"""

    def add_arguments(self, parser):
        parser.add_argument(
            "-l",
            "--limit",
            dest="limit",
            type=int,
            help="Limit the number of scenes fetched",
        )

        parser.add_argument(
            "-s",
            "--itersize",
            dest="itersize",
            default=1000,
            type=int,
            help="Cursor iteration size",
        )

    def handle(self, *args, **options):
        with psycopg2.connect(
            os.environ["LEGACY_DATABASE_URL"], cursor_factory=DictCursor
        ) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM graphs;")
                total_rows = cursor.fetchone()[0]
                total = (
                    total_rows
                    if not options["limit"]
                    else min(options["limit"], total_rows)
                )

            with conn.cursor(name="legacy_fetcher") as cursor:
                cursor.itersize = options["itersize"]

                if options["limit"]:
                    query = cursor.mogrify(
                        """
                        SELECT * FROM graphs LIMIT %s;
                        """,
                        (options["limit"],),
                    )
                else:
                    query = sql.SQL("SELECT * FROM graphs;")

                cursor.execute(query)

                for scene in tqdm.tqdm(cursor, total=total):
                    LegacyScene.objects.update_or_create(
                        key=scene["url_key"],
                        defaults={
                            "dehydrated": scene["dehydrated"],
                            "times_accessed": scene["times_accessed"],
                            "last_accessed": scene["last_accessed"],
                        },
                    )
