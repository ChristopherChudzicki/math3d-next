import pytest
from django.conf import settings
from django.contrib.sites.models import Site


@pytest.mark.django_db
def test_configured_site_uses_brand_name():
    """allauth's transactional emails render `current_site.name`, so it must be
    the brand rather than Django's default "example.com" (regression guard for
    GH-1136). Asserting against a freshly-migrated test DB also guards the
    post_migrate default-site signal from clobbering the migration's value.
    """
    site = Site.objects.get(pk=settings.SITE_ID)
    assert site.name == "Math3d.org"
