import tqdm
from django.core.management.base import BaseCommand

from scenes.models import LegacyScene
from scenes.legacy_scene_utils.migrate_scene import migrate_scene


class Command(BaseCommand):
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

    def handle(self, *args, **options):
        limit = options["limit"]
        legacy_scenes = LegacyScene.objects.all()
        if options["filter"]:
            legacy_scenes = legacy_scenes.filter(key__in=options["filter"].split(","))
        elif limit:
            legacy_scenes = legacy_scenes[:limit]

        for legacy_scene in tqdm.tqdm(legacy_scenes):
            migrate_scene(legacy_scene)
