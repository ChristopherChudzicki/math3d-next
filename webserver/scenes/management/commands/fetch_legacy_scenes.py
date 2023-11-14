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
            "--filter",
            dest="filter",
            type=str,
            help="Filter the scenes fetched by a SQL WHERE clause",
        )

    def get_cursor(self):
        conn = psycopg2.connect(
            os.environ["LEGACY_DATABASE_URL"], cursor_factory=DictCursor
        )
        return conn.cursor()

    def handle(self, *args, **options):
        limit = options["limit"]
        cursor = self.get_cursor()
        if options["filter"]:
            query = cursor.mogrify(
                """
        SELECT url_key, dehydrated, times_accessed, last_accessed
        FROM graphs WHERE url_key IN (%s)
        """,
                options["filter"].split(","),
            )
        elif limit:
            sql.SQL(
                """
        SELECT url_key, dehydrated, times_accessed, last_accessed
        FROM graphs LIMIT %s;
        """
            )
        else:
            query = sql.SQL("SELECT * FROM graphs;")

        cursor.execute(query)

        for scene in tqdm.tqdm(cursor.fetchall()):
            LegacyScene.objects.update_or_create(
                key=scene["url_key"],
                defaults={
                    "dehydrated": scene["dehydrated"],
                    "times_accessed": scene["times_accessed"],
                    "last_accessed": scene["last_accessed"],
                },
            )
