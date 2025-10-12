from django.core.management.base import BaseCommand
from django.db import connections
from django.conf import settings
import dj_database_url
from tqdm import tqdm
from scenes.models import Scene, LegacyScene


class Command(BaseCommand):
    help = "Pull Scene and LegacyScene data from an external database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--database-url",
            type=str,
            default=getattr(settings, "INGESTION_DATABASE_URL", None),
            help="Database URL for the source database",
        )
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=500,
            help="Number of records to process in each chunk (default: 500)",
        )

    def fetch_scenes(self, source_db, chunk_size):
        """Fetch and process scenes from the external database."""

        # Create temporary model that uses the external database
        class ExternalScene(Scene):
            class Meta:
                proxy = True
                app_label = "scenes"
                db_table = "scenes_scene"
                managed = False

        # Fetch and process scenes
        external_scenes = ExternalScene.objects.using(source_db)

        total_scenes = external_scenes.count()
        self.stdout.write(f"Total scenes to fetch: {total_scenes}")

        # Use iterator() to avoid loading all records into memory at once
        scene_iterator = external_scenes.iterator(chunk_size=chunk_size)

        for external_scene in tqdm(
            scene_iterator, total=total_scenes, desc="Fetching scenes"
        ):
            scene_dict = {
                "key": external_scene.key,
                "items": external_scene.items,
                "item_order": external_scene.item_order,
                "title": external_scene.title,
                "archived": external_scene.archived,
                "times_accessed": external_scene.times_accessed,
            }
            Scene.objects.update_or_create(key=scene_dict["key"], defaults=scene_dict)

    def fetch_legacy_scenes(self, source_db, chunk_size):
        """Fetch and process legacy scenes from the external database."""

        # Create temporary model that uses the external database
        class ExternalLegacyScene(LegacyScene):
            class Meta:
                proxy = True
                app_label = "scenes"
                db_table = "scenes_legacyscene"
                managed = False

        # Fetch and process legacy scenes
        external_legacy_scenes = ExternalLegacyScene.objects.using(source_db)

        total_legacy_scenes = external_legacy_scenes.count()
        self.stdout.write(f"Total legacy scenes to fetch: {total_legacy_scenes}")

        legacy_scene_iterator = external_legacy_scenes.iterator(chunk_size=chunk_size)

        for external_legacy_scene in tqdm(
            legacy_scene_iterator,
            total=total_legacy_scenes,
            desc="Fetching legacy scenes",
        ):
            legacy_scene_dict = {
                "key": external_legacy_scene.key,
                "times_accessed": external_legacy_scene.times_accessed,
                "last_accessed": external_legacy_scene.last_accessed,
                "dehydrated": external_legacy_scene.dehydrated,
                "migration_note": external_legacy_scene.migration_note,
            }
            LegacyScene.objects.update_or_create(
                key=legacy_scene_dict["key"], defaults=legacy_scene_dict
            )

    def handle(self, *args, **kwargs):
        database_url = kwargs.get("database_url")
        chunk_size = kwargs["chunk_size"]

        if not database_url:
            raise ValueError(
                "Database URL must be provided either via --database-url argument or INGESTION_DATABASE_URL setting"
            )

        # Parse the database URL using dj_database_url
        db_config = dj_database_url.parse(database_url)

        # Ensure the config has all required Django database settings
        db_config.setdefault("OPTIONS", {})
        db_config.setdefault("CONN_MAX_AGE", 0)
        db_config.setdefault("CONN_HEALTH_CHECKS", False)
        db_config.setdefault("TIME_ZONE", None)
        db_config.setdefault("ATOMIC_REQUESTS", False)
        db_config.setdefault("AUTOCOMMIT", True)

        # Add the temporary database configuration
        temp_db_alias = "temp_ingestion"
        connections.databases[temp_db_alias] = db_config
        source_db = temp_db_alias

        # Fetch scenes and legacy scenes
        self.fetch_scenes(source_db, chunk_size)
        self.fetch_legacy_scenes(source_db, chunk_size)

        self.stdout.write(self.style.SUCCESS("Successfully fetched all scenes."))
