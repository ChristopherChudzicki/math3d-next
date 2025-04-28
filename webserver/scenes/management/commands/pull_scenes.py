import psycopg2
from django.core.management.base import BaseCommand
from django.conf import settings
from tqdm import tqdm
from scenes.models import Scene, LegacyScene


class Command(BaseCommand):
    help = "Pull Scene and LegacyScene data from an external database."

    def handle(self, *args, **kwargs):
        ingestion_db_url = settings.INGESTION_DATABASE_URL

        # Connect to the external database
        conn = psycopg2.connect(ingestion_db_url)

        try:
            with conn.cursor() as cursor:
                # Fetch total count of scenes
                cursor.execute("SELECT COUNT(*) FROM scenes_scene;")
                total_scenes = cursor.fetchone()[0]

                self.stdout.write(f"Total scenes to fetch: {total_scenes}")

            with conn.cursor(name="scene_fetcher") as cursor:
                cursor.itersize = 500
                cursor.execute(
                    "SELECT key, items, item_order, title, archived, times_accessed FROM scenes_scene;"
                )

                for scene_data in tqdm(
                    cursor, total=total_scenes, desc="Fetching scenes"
                ):
                    scene_dict = {
                        "key": scene_data[0],
                        "items": scene_data[1],
                        "item_order": scene_data[2],
                        "title": scene_data[3],
                        "archived": scene_data[4],
                        "times_accessed": scene_data[5],
                    }
                    Scene.objects.update_or_create(
                        key=scene_dict["key"], defaults=scene_dict
                    )

            with conn.cursor(name="legacy_scene_fetcher") as cursor:
                cursor.itersize = 500
                cursor.execute(
                    "SELECT key, times_accessed, last_accessed, dehydrated, migration_note FROM scenes_legacyscene;"
                )

                for legacy_scene_data in tqdm(cursor, desc="Fetching legacy scenes"):
                    legacy_scene_dict = {
                        "key": legacy_scene_data[0],
                        "times_accessed": legacy_scene_data[1],
                        "last_accessed": legacy_scene_data[2],
                        "dehydrated": legacy_scene_data[3],
                        "migration_note": legacy_scene_data[4],
                    }
                    LegacyScene.objects.update_or_create(
                        key=legacy_scene_dict["key"], defaults=legacy_scene_dict
                    )

        finally:
            conn.close()

        self.stdout.write(self.style.SUCCESS("Successfully fetched all scenes."))
