from django.db import migrations
from django.core.paginator import Paginator


def set_item_z_order(item):
    props = item.get("properties", {})
    if "zIndex" in props:
        props["zOrder"] = ""


def unset_item_z_order(item):
    props = item.get("properties", {})
    if "zOrder" in props:
        del props["zOrder"]


def set_z_order(apps, schema_editor):
    Scene = apps.get_model("scenes", "Scene")
    pages = Paginator(Scene.objects.all(), 100)
    for page in pages:
        for scene in page:
            items = scene.items
            for item in items:
                set_item_z_order(item)
            scene.save()


def unset_z_order(apps, schema_editor):
    Scene = apps.get_model("scenes", "Scene")
    pages = Paginator(Scene.objects.all(), 100)
    for page in pages:
        for scene in page:
            items = scene.items
            for item in items:
                unset_item_z_order(item)
            scene.save()


class Migration(migrations.Migration):
    dependencies = [
        ("scenes", "0013_alter_scene_items"),
    ]

    operations = [
        migrations.RunPython(set_z_order, unset_z_order),
    ]
