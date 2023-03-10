from pathlib import Path

import jtd
import yaml
from django.db import models

from scenes.validators import JtdValidator

items_schema = jtd.Schema.from_dict(
    yaml.safe_load(
        Path("/src/packages/mathitem-configs/src/schema.jtd.yaml").read_text()
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


class Scene(models.Model):
    """
    A Scene.
    """

    key = models.CharField(max_length=80, unique=True)
    items = models.JSONField(validators=[JtdValidator(limit_value=items_schema)])
    item_order = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.TextField()

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
