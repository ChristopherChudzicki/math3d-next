# Generated by Django 4.2.11 on 2024-03-31 17:18

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("scenes", "0007_created_and_modified_dates"),
    ]

    operations = [
        migrations.AddField(
            model_name="scene",
            name="archived",
            field=models.BooleanField(default=False),
        ),
    ]
