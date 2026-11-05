from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from scenes.seed_scenes import (
    SeedSceneError,
    load_seed_scenes,
    read_seed_scene,
    seed_scene_paths,
)


class Command(BaseCommand):
    help = (
        "Load committed seed scenes (scenes/seed_scenes/) into the database, "
        "upserting by key. Idempotent; never deletes a scene."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "files",
            nargs="*",
            type=Path,
            help="Seed files to load (default: every file in seed_scenes/qa/ "
            "and seed_scenes/examples/).",
        )

    def handle(self, *args, files: list[Path], **options):
        paths = files or seed_scene_paths()
        # Parse every file first so a bad one is reported by name.
        try:
            seeds = [read_seed_scene(path) for path in paths]
        except SeedSceneError as error:
            raise CommandError(str(error)) from error
        try:
            loaded = load_seed_scenes(seeds)
        except ValidationError as error:
            raise CommandError("; ".join(error.messages)) from error
        for seed, (_, status) in zip(seeds, loaded):
            self.stdout.write(f"{status} {seed.key}")
