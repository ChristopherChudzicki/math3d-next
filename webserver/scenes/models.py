import os
from pathlib import Path
import random

import jtd  # type: ignore
import yaml
from django.db import models

from scenes.validators import JtdValidator

items_schema = jtd.Schema.from_dict(
    yaml.safe_load(
        Path(
            os.path.join(
                os.path.dirname(__file__),
                "../../packages/mathitem-configs/src/schema.jtd.yaml",
            )
        ).read_text()
    )
)


class LegacyScene(models.Model):
    """
    A scene that was created in the legacy system.
    """

    key = models.CharField(max_length=80, unique=True)
    times_accessed = models.IntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    dehydrated = models.JSONField()
    migration_note = models.TextField(default="")

KEY_ALPHABET = "123456789" + "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNPQRSTUVWXYZ"

def random_key(length=9):
    return ''.join(random.choices(KEY_ALPHABET, k=length))

class Scene(models.Model):
    """
    A Scene.
    """

    key = models.CharField(max_length=80, unique=True, default=random_key)
    items = models.JSONField(validators=[JtdValidator(limit_value=items_schema)])
    item_order = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.TextField(blank=True, default="Untitled")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
