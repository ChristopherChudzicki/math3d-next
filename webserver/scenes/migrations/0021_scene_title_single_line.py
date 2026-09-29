from django.db import migrations, models


class Migration(migrations.Migration):
    # Separate from 0020: a row its UPDATEs touch twice leaves deferred FK
    # trigger events pending, and ALTER TABLE refuses to run until they fire.
    dependencies = [
        ("scenes", "0020_normalize_scene_titles"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="scene",
            constraint=models.CheckConstraint(
                condition=models.Q(("title__regex", "[\\r\\n]"), _negated=True),
                name="scene_title_single_line",
            ),
        ),
    ]
