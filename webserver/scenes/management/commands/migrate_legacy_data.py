import os

import tqdm
from django.core.management.base import BaseCommand

from scenes.management.commands.legacy_migration import IssueLog, ItemMigrator
from scenes.models import LegacyScene, Scene

from .legacy_migration.default_data import set_defaults


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-l",
            "--limit",
            dest="limit",
            type=int,
            help="Limit the number of scenes fetched",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        legacy_scenes = LegacyScene.objects.all()[:limit]

        for legacy_scene in tqdm.tqdm(legacy_scenes):
            set_defaults(legacy_scene)
            migrator = ItemMigrator()

            for item_id, item in legacy_scene.dehydrated["folders"].items():
                item["type"] = "FOLDER"

            old_items = {
                **legacy_scene.dehydrated["folders"],
                **legacy_scene.dehydrated["mathGraphics"],
                **legacy_scene.dehydrated["mathSymbols"],
            }

            items = []
            for item_id, item in old_items.items():
                items.append(migrator.translate_item(item, item_id).to_json_data())

            Scene.objects.update_or_create(
                key=legacy_scene.key,
                defaults={
                    "items": items,
                    "item_order": legacy_scene.dehydrated["sortableTree"],
                    "created_at": legacy_scene.dehydrated["metadata"][
                        "creationDate"
                    ].replace('"', ""),
                    "title": legacy_scene.dehydrated["metadata"].get(
                        "title", "Untitled"
                    ),
                },
            )

            legacy_scene.migration_note = "\n".join(
                (issue.message for issue in migrator.log.issues())
            )
            legacy_scene.save(update_fields=["migration_note"])
