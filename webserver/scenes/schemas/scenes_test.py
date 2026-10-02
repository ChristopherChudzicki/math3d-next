import datetime

from django.utils import timezone

from scenes.schemas.scenes import scene_image_url


def test_scene_image_url_is_none_when_origin_unset(settings):
    settings.SCREENSHOTS_ORIGIN = ""
    assert scene_image_url("abc", timezone.now()) is None


def test_scene_image_url_changes_with_modified_date(settings):
    # v is the cache-buster: an edit must yield a new URL, even within a second.
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    t = datetime.datetime(2026, 10, 2, 1, 53, 32, 123456, tzinfo=datetime.UTC)
    url = scene_image_url("abc", t)
    assert url == (
        "https://s.math3d.org/screenshots/scene/abc.png"
        "?fallback=none&v=2026-10-02T01%3A53%3A32.123456%2B00%3A00"
    )
    later = t + datetime.timedelta(microseconds=1)
    assert scene_image_url("abc", later) != url
