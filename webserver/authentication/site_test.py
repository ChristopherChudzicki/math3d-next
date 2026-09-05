import pytest
from django.conf import settings
from django.contrib.sites.models import Site


@pytest.mark.django_db
def test_configured_site_uses_brand_name():
    """django.contrib.sites' post_migrate signal creates an "example.com" Site
    when the table is empty, so 0005_set_site_name creates the row itself to
    make that signal skip. A freshly-migrated test DB is what exercises the
    interaction (regression guard for GH-1136).
    """
    site = Site.objects.get(pk=settings.SITE_ID)
    assert site.name == "Math3d.org"
