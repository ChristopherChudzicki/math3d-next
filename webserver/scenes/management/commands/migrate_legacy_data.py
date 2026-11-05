import tqdm
from django.core.management.base import BaseCommand, CommandError

from scenes.legacy_scene_utils.issue_log import Severity
from scenes.legacy_scene_utils.migrate_scene import migrate_scene
from scenes.models import LegacyScene, Scene


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

        parser.add_argument(
            "--force",
            type=int,
            metavar="N",
            help=(
                "Also re-translate scenes that were taken over (is_legacy=False: "
                "a seed file or a verified translation owns their content). N "
                "must equal the number of such scenes in the selection; the "
                "command prints it when it refuses."
            ),
        )

    def handle(self, *args, **options):
        batch = LegacyScene.objects.order_by("id")
        if options["filter"]:
            batch = batch.filter(key__in=options["filter"].split(","))
        elif options["limit"]:
            batch = batch[: options["limit"]]
        taken_over = Scene.objects.filter(is_legacy=False, key__in=batch.values("key"))
        n_taken_over = taken_over.count()
        legacy_scenes = LegacyScene.objects.filter(pk__in=batch.values("pk"))
        if options["force"] is None:
            legacy_scenes = legacy_scenes.exclude(key__in=taken_over.values("key"))
            if n_taken_over:
                self.stdout.write(
                    f"Skipping {n_taken_over} taken-over scenes (--force "
                    f"{n_taken_over} re-translates them)."
                )
        elif options["force"] != n_taken_over:
            raise CommandError(
                f"--force {options['force']} does not match: {n_taken_over} "
                "taken-over scenes would be overwritten. Pass --force "
                f"{n_taken_over} to confirm."
            )
        legacy_scenes = legacy_scenes.order_by("id")

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
