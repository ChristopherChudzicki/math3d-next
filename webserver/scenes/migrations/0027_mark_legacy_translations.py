from django.db import migrations


def mark(apps, schema_editor):
    # Translations written before 0015 added the field, and rows pull_scenes
    # copied without it, carry the default False, which means "taken over".
    Scene = apps.get_model("scenes", "Scene")
    LegacyScene = apps.get_model("scenes", "LegacyScene")
    Scene.objects.filter(
        is_legacy=False, author=None, key__in=LegacyScene.objects.values("key")
    ).update(is_legacy=True)


class Migration(migrations.Migration):
    dependencies = [("scenes", "0026_seed_example_scenes")]
    operations = [migrations.RunPython(mark, migrations.RunPython.noop)]
