from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from scenes.models import Scene, LegacyScene

RESERVED = Q(key="app") | Q(key__length__lt=2)


class Command(BaseCommand):
    help = "Scan for scene keys that collide with the reserved namespace (`app`, sub-2-char)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--database",
            default="default",
            help="DB alias to scan (e.g. an external pull source).",
        )

    def handle(self, *args, **options):
        db = options["database"]
        scenes = list(
            Scene.objects.using(db).filter(RESERVED).values_list("key", flat=True)
        )
        legacy = list(
            LegacyScene.objects.using(db).filter(RESERVED).values_list("key", flat=True)
        )
        if scenes or legacy:
            raise CommandError(
                f"Reserved keys found on '{db}' — Scene: {scenes!r}, LegacyScene: {legacy!r}. "
                "Re-key or drop them before enforcing the constraint."
            )
        self.stdout.write(self.style.SUCCESS(f"No reserved keys found on '{db}'."))
