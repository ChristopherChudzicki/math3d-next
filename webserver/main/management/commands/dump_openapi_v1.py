import json
from pathlib import Path

import yaml
from django.conf import settings
from django.core.management.base import BaseCommand

from main.api import api

DEFAULT_OUTPUT = Path(settings.BASE_DIR) / "openapi.v1.yaml"


class Command(BaseCommand):
    help = "Dump the Ninja v1 OpenAPI schema to YAML (raw 3.1, deterministic)."

    def add_arguments(self, parser):
        parser.add_argument("--output", default=None)

    def handle(self, *args, output=None, **options):
        # Round-trip through JSON to normalize Pydantic/Ninja model objects to
        # plain Python dicts/lists before YAML serialization.
        schema = json.loads(json.dumps(api.get_openapi_schema()))
        text = yaml.safe_dump(
            schema,
            sort_keys=True,
            allow_unicode=True,
            default_flow_style=False,
            width=float("inf"),
        )
        target = Path(output) if output else DEFAULT_OUTPUT
        target.write_text(text)
        self.stdout.write(self.style.SUCCESS(f"Wrote {target}"))
