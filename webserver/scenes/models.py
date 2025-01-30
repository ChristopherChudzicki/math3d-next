import os
import random
from pathlib import Path

import jtd  # type: ignore
import yaml
from django.db import models
from django.contrib.postgres.indexes import GinIndex
from django.utils import timezone

from scenes.validators import JtdValidator
from authentication.models import CustomUser


items_schema = jtd.Schema.from_dict(
    yaml.safe_load(
        Path(
            os.path.join(
                os.path.dirname(__file__),
                "./math_items/schema.jtd.yaml",
            )
        ).read_text()
    )
)


KEY_ALPHABET = "123456789" + "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNPQRSTUVWXYZ"


def _random_key(length):
    return "".join(random.choices(KEY_ALPHABET, k=length))


def random_key(length=10, depth=0):
    key = _random_key(length)
    if (
        Scene.objects.filter(key=key).exists()
        or LegacyScene.objects.filter(key=key).exists()
    ):
        return random_key(length, depth + 1)
    return key


class LegacyScene(models.Model):
    """
    A scene that was created in the legacy system.
    """

    key = models.CharField(max_length=80, unique=True, default=random_key)
    times_accessed = models.IntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    dehydrated = models.JSONField()
    migration_note = models.TextField(default="")


class TimestampedModel(models.Model):
    """
    A base model with created_date and modified_date fields.

    Similar behavior can be achieved with DateTimeField using auto_now_add and
    auto_now. However, using auto_now and auto_now_add, on an initial save, the
    created_date and modified_date fields are generated with different timestamp
    function calls, resulting in slightly different times:
    >>> model.save()
    >>> s.modified_date - s.created_date
    datetime.timedelta(microseconds=14)
    """

    created_date = models.DateTimeField(default=timezone.now)
    modified_date = models.DateTimeField(default=timezone.now)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        now = timezone.now()
        if not self.id:
            self.created_date = now
        self.modified_date = now
        return super().save()


class Scene(TimestampedModel):
    """
    A Scene.
    """

    key = models.CharField(max_length=80, unique=True, default=random_key)
    items = models.JSONField(validators=[JtdValidator(limit_value=items_schema)])
    item_order = models.JSONField()

    title = models.TextField(blank=True, default="Untitled")
    author = models.ForeignKey(
        CustomUser, blank=True, null=True, on_delete=models.CASCADE
    )

    archived = models.BooleanField(default=False)

    times_accessed = models.IntegerField(default=0)

    class Meta:
        indexes = [
            GinIndex(
                name="title_gin_trgm_index",
                fields=["title"],
                opclasses=["gin_trgm_ops"],
            )
        ]

        ordering = ["id"]

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
