from django.db import migrations


def mark(apps, schema_editor):
    # 0015 added is_legacy with default=False and no backfill, and pull_scenes
    # never copied it, so translations written before either carry False. From
    # now on False means "taken over" (served as is, never re-translated), so
    # every authorless row under a legacy key that nobody took over is True.
    Scene = apps.get_model("scenes", "Scene")
    LegacyScene = apps.get_model("scenes", "LegacyScene")
    Scene.objects.filter(
        is_legacy=False, author=None, key__in=LegacyScene.objects.values("key")
    ).update(is_legacy=True)


class Migration(migrations.Migration):
    dependencies = [("scenes", "0026_seed_example_scenes")]
    operations = [migrations.RunPython(mark, migrations.RunPython.noop)]
