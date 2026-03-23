"""
Data migration to populate allauth's EmailAddress table from existing users.

Existing active users (is_active=True) get verified=True.
Existing inactive users (is_active=False) get verified=False.

This must run BEFORE Djoser is removed so we can use is_active as the
source of truth for email verification status.
"""

from django.db import migrations


def populate_email_addresses(apps, schema_editor):
    CustomUser = apps.get_model("authentication", "CustomUser")
    EmailAddress = apps.get_model("account", "EmailAddress")
    for user in CustomUser.objects.all():
        EmailAddress.objects.get_or_create(
            user=user,
            email=user.email,
            defaults={"verified": user.is_active, "primary": True},
        )


def reverse_populate(apps, schema_editor):
    """Remove EmailAddress rows that were created by this migration."""
    EmailAddress = apps.get_model("account", "EmailAddress")
    EmailAddress.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0003_change_is_active_default_to_true"),
        ("account", "0009_emailaddress_unique_primary_email"),
    ]

    operations = [
        migrations.RunPython(populate_email_addresses, reverse_populate),
    ]
