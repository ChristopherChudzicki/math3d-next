"""
Sets the django.contrib.sites Site name to "Math3d.org". Retained history: no
code reads `Site.name` today (settings' own SITE_NAME is unrelated), so this is
inert data, kept because rewriting an applied migration is not worth the churn.

We create the row when missing because on a fresh database the default Site is
created by a post_migrate signal that runs *after* migrations and only creates
a row when none exists; creating it here ensures that signal leaves our name
intact. On an existing database we update only the name and leave domain as-is.
"""

from django.conf import settings
from django.db import migrations

SITE_NAME = "Math3d.org"


def set_site_name(apps, schema_editor):
    Site = apps.get_model("sites", "Site")
    site_id = getattr(settings, "SITE_ID", 1)
    # On a fresh DB no Site row exists yet; create it with Django's default
    # domain so we never leave it blank (we don't otherwise manage domain).
    site, created = Site.objects.get_or_create(
        pk=site_id,
        defaults={"domain": "example.com", "name": SITE_NAME},
    )
    if not created:
        site.name = SITE_NAME
        site.save(update_fields=["name"])


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0004_populate_allauth_emailaddress"),
        ("sites", "0002_alter_domain_unique"),
    ]

    operations = [
        migrations.RunPython(set_site_name, migrations.RunPython.noop),
    ]
