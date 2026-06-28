from django.db import migrations


class Migration(migrations.Migration):
    """Drop the orphaned authtoken_token table.

    `rest_framework.authtoken` was removed from INSTALLED_APPS along with the
    rest of DRF (#1152). The app owned the `authtoken_token` table via its own
    migrations, so removing the app leaves the (always-empty, unused) table
    behind. Drop it explicitly. IF EXISTS keeps this a no-op on databases that
    never installed authtoken (e.g. a fresh test DB).
    """

    dependencies = [
        ("authentication", "0005_set_site_name"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS authtoken_token;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
