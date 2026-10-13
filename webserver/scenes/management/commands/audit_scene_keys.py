from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from scenes.models import SCENE_KEY_PATTERN, Scene, LegacyScene

INVALID = ~Q(key__regex=SCENE_KEY_PATTERN)


class Command(BaseCommand):
    help = "Scan for scene keys that fail SCENE_KEY_PATTERN (charset, length, `app`)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--database",
            default="default",
            help="DB alias to scan (e.g. an external pull source).",
        )

    def handle(self, *args, **options):
        db = options["database"]
        scenes = list(
            Scene.objects.using(db).filter(INVALID).values_list("key", flat=True)
        )
        legacy = list(
            LegacyScene.objects.using(db).filter(INVALID).values_list("key", flat=True)
        )
        if scenes or legacy:
            raise CommandError(
                f"Invalid keys found on '{db}' — Scene: {scenes!r}, LegacyScene: {legacy!r}. "
                "Re-key or drop them before enforcing the constraint."
            )
        self.stdout.write(self.style.SUCCESS(f"No invalid keys found on '{db}'."))
