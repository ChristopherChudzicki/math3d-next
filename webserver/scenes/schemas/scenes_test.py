import datetime
from urllib.parse import urlsplit

from scenes.schemas.scenes import scene_image_url

T = datetime.datetime(2026, 10, 2, 1, 53, 32, 123456, tzinfo=datetime.UTC)


def test_scene_image_url_changes_within_a_second(settings):
    # v is the cache-buster: two edits a microsecond apart need distinct URLs.
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    later = T + datetime.timedelta(microseconds=1)
    assert scene_image_url("abc", later) != scene_image_url("abc", T)


def test_scene_image_url_escapes_the_key(settings):
    # A key can't break out of the path and drop fallback=none.
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    raw = scene_image_url("a?b#c/d", T)
    assert raw is not None
    url = urlsplit(raw)
    assert url.path == "/screenshots/scene/a%3Fb%23c%2Fd.png"
    assert url.query.startswith("fallback=none&")
