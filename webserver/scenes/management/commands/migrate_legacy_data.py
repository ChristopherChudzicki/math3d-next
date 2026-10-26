import tqdm
from django.core.management.base import BaseCommand, CommandError

from scenes.legacy_scene_utils.issue_log import Severity
from scenes.legacy_scene_utils.migrate_scene import migrate_scene
from scenes.models import LegacyScene


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
            help="Only migrate these scene keys (comma-separated)",
        )

        parser.add_argument(
            "--max-failures",
            type=int,
            default=0,
            help=(
                "Abort after more than this many problem scenes: a translation "
                "error, an ERROR issue, or properties the translator ignored. "
                "Every scene that translates is saved, problems or not."
            ),
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        legacy_scenes = LegacyScene.objects.order_by("id")
        if options["filter"]:
            legacy_scenes = legacy_scenes.filter(key__in=options["filter"].split(","))
        elif limit:
            legacy_scenes = legacy_scenes[:limit]

        problems: list[tuple[str, str]] = []
        for legacy_scene in tqdm.tqdm(
            legacy_scenes.iterator(chunk_size=500), total=legacy_scenes.count()
        ):
            try:
                translated = migrate_scene(legacy_scene)
            except Exception as e:  # noqa: BLE001 — reported and counted below
                problems.append((legacy_scene.key, f"{type(e).__name__}: {e}"))
            else:
                serious = [
                    issue.message
                    for issue in (translated.issues if translated else [])
                    if issue.severity is Severity.ERROR or issue.ignored_properties
                ]
                if serious:
                    problems.append((legacy_scene.key, "; ".join(serious)))
            if len(problems) > options["max_failures"]:
                raise CommandError(self._summary(problems))

        if problems:
            self.stdout.write(self._summary(problems))

    def _summary(self, problems: list[tuple[str, str]]) -> str:
        lines = [f"{len(problems)} scenes had problems:"]
        lines += [f"  {key}: {problem}" for key, problem in problems[:20]]
        return "\n".join(lines)
