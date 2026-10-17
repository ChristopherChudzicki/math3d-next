from django.db import migrations

EXAMPLE_KEYS = [
    "sliders_intro",
    "sliders_plotrange",
    "color_and_visibility",
    "vectors",
    "labels",
    "functions",
    "derivatives",
    "calculated_visibility",
    "z_bias",
    "tnb",
    "animate_camera",
    "motion",
    "ruled_hyperboloid",
    "horizontal_revolution_washer",
    "vertical_revolution_shell_method",
    "sphere_colormap",
    "osculating_circle",
]


def seed(apps, schema_editor):
    # Keys with no Scene row (e.g. a LegacyScene not yet opened, which migrates
    # it) are skipped; add those in the admin once they exist.
    Scene = apps.get_model("scenes", "Scene")
    ExampleScene = apps.get_model("scenes", "ExampleScene")
    scenes = Scene.objects.in_bulk(EXAMPLE_KEYS, field_name="key")
    ExampleScene.objects.bulk_create(
        # Gaps of 10 leave room to insert an example in the admin.
        ExampleScene(scene=scenes[key], position=10 * (i + 1))
        for i, key in enumerate(EXAMPLE_KEYS)
        if key in scenes
    )


def unseed(apps, schema_editor):
    ExampleScene = apps.get_model("scenes", "ExampleScene")
    ExampleScene.objects.filter(scene__key__in=EXAMPLE_KEYS).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("scenes", "0025_example_scene"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
