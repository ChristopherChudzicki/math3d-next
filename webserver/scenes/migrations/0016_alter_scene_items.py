from django.db import migrations, models

import scenes.validators


class Migration(migrations.Migration):
    dependencies = [
        ("scenes", "0015_scene_is_legacy"),
    ]

    operations = [
        migrations.AlterField(
            model_name="scene",
            name="items",
            field=models.JSONField(validators=[scenes.validators.validate_math_items]),
        ),
    ]
