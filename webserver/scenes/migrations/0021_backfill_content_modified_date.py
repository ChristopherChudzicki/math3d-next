from django.db import migrations, transaction
from django.db.models import F

BATCH_SIZE = 5000


def backfill(apps, schema_editor):
    # The last content edit is unknown; modified_date is the closest bound. Each
    # batch is its own transaction (atomic = False), so no long-held locks.
    Scene = apps.get_model("scenes", "Scene")
    last_pk = 0
    while True:
        pks = list(
            Scene.objects.filter(pk__gt=last_pk)
            .order_by("pk")
            .values_list("pk", flat=True)[:BATCH_SIZE]
        )
        if not pks:
            return
        with transaction.atomic():
            Scene.objects.filter(pk__in=pks).update(
                content_modified_date=F("modified_date")
            )
        last_pk = pks[-1]


class Migration(migrations.Migration):
    # Separate from 0020 so its ALTER TABLE lock is released before the
    # full-table update.
    atomic = False

    dependencies = [
        ("scenes", "0020_scene_content_modified_date"),
    ]

    operations = [
        migrations.RunPython(backfill, migrations.RunPython.noop),
    ]
