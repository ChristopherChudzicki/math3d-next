import http.client
import urllib.error
from unittest import mock

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from scenes.factories import SceneFactory
from scenes.models import LegacyScene
from scenes.screenshots import RenderOutcome

COMMAND = "scenes.management.commands.render_scenes"
RENDERED_AT = "2026-10-02T01:53:40.000Z"


def _headers(**values) -> http.client.HTTPMessage:
    message = http.client.HTTPMessage()
    for name, value in values.items():
        message[name.replace("_", "-")] = value
    return message


def hit(**headers):
    """A 200 from the Worker carrying the given headers."""
    res = mock.MagicMock()
    res.__enter__.return_value.headers = _headers(**headers)
    return res


def http_error(code: int) -> urllib.error.HTTPError:
    return urllib.error.HTTPError("https://s.test", code, "", _headers(), None)


@pytest.fixture(autouse=True)
def configured(settings):
    settings.SCREENSHOTS_ORIGIN = "https://s.test"
    settings.RENDER_SECRET = "shh"  # pragma: allowlist secret


@pytest.fixture(autouse=True)
def sleep():
    with mock.patch(f"{COMMAND}.time.sleep") as sleep:
        yield sleep


@pytest.fixture
def urlopen():
    with mock.patch(f"{COMMAND}.urllib.request.urlopen") as urlopen:
        yield urlopen


@pytest.fixture
def maybe_render():
    with mock.patch(
        f"{COMMAND}.maybe_render", return_value=RenderOutcome.NUDGED
    ) as maybe_render:
        yield maybe_render


def run(*args):
    call_command("render_scenes", *args)


@pytest.mark.django_db
def test_current_render_is_skipped(urlopen, maybe_render, capsys):
    scene = SceneFactory.create()
    urlopen.return_value = hit(
        x_render_version=scene.screenshot_version, x_rendered_at=RENDERED_AT
    )
    run(scene.key)
    maybe_render.assert_not_called()
    assert f"{scene.key}: current" in capsys.readouterr().out


@pytest.mark.django_db
def test_render_of_another_version_is_rerendered(urlopen, maybe_render):
    scene = SceneFactory.create()
    urlopen.return_value = hit(x_render_version="older", x_rendered_at=RENDERED_AT)
    run(scene.key)
    maybe_render.assert_called_once_with(scene.key, scene.screenshot_version)


@pytest.mark.django_db
def test_missing_render_is_rendered(urlopen, maybe_render):
    scene = SceneFactory.create()
    urlopen.side_effect = http_error(404)
    run(scene.key)
    maybe_render.assert_called_once_with(scene.key, scene.screenshot_version)


@pytest.mark.django_db
def test_worker_without_render_headers_is_an_error(urlopen, maybe_render):
    scene = SceneFactory.create()
    urlopen.return_value = hit()
    with pytest.raises(CommandError, match="X-Rendered-At"):
        run(scene.key)
    maybe_render.assert_not_called()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "error",
    [http_error(500), urllib.error.URLError("refused"), http.client.BadStatusLine("")],
    ids=["500", "transport", "bad-response"],
)
def test_failed_probe_skips_the_render(urlopen, maybe_render, capsys, error):
    scene = SceneFactory.create()
    urlopen.side_effect = error
    with pytest.raises(CommandError):
        run(scene.key)
    maybe_render.assert_not_called()
    assert f"{scene.key}: probe failed" in capsys.readouterr().out


@pytest.mark.django_db
def test_force_renders_without_probing(urlopen, maybe_render):
    scene = SceneFactory.create()
    run(scene.key, "--force")
    urlopen.assert_not_called()
    maybe_render.assert_called_once_with(scene.key, scene.screenshot_version)


@pytest.mark.django_db
def test_unknown_key_fails_but_later_keys_still_run(urlopen, maybe_render, capsys):
    scene = SceneFactory.create()
    urlopen.side_effect = http_error(404)
    with pytest.raises(CommandError, match="1 of 2"):
        run("missing", scene.key)
    assert "missing: not found" in capsys.readouterr().out
    maybe_render.assert_called_once_with(scene.key, scene.screenshot_version)


@pytest.mark.django_db
def test_unmigrated_legacy_key_is_reported(maybe_render, capsys):
    legacy = LegacyScene.objects.create(dehydrated={})
    with pytest.raises(CommandError):
        run(legacy.key)
    assert f"{legacy.key}: legacy (not migrated)" in capsys.readouterr().out
    maybe_render.assert_not_called()


@pytest.mark.django_db
def test_over_cap_fails(urlopen, maybe_render, capsys):
    scene = SceneFactory.create()
    urlopen.side_effect = http_error(404)
    maybe_render.return_value = RenderOutcome.OVER_CAP
    with pytest.raises(CommandError):
        run(scene.key)
    assert f"{scene.key}: over cap" in capsys.readouterr().out


@pytest.mark.django_db
def test_duplicate_key_is_rendered_once(urlopen, maybe_render):
    scene = SceneFactory.create()
    urlopen.side_effect = http_error(404)
    run(scene.key, scene.key)
    urlopen.assert_called_once()
    maybe_render.assert_called_once()


@pytest.mark.django_db
def test_sleeps_only_between_a_render_request_and_the_next_key(
    urlopen, maybe_render, sleep
):
    # A failed nudge may still have reached the Worker, so it's paced too.
    failed, nudged, current, last = SceneFactory.create_batch(4)
    probes = {
        failed.key: http_error(404),
        nudged.key: http_error(404),
        current.key: hit(
            x_render_version=current.screenshot_version, x_rendered_at=RENDERED_AT
        ),
        last.key: http_error(404),
    }

    def respond(req, **kwargs):
        response = next(r for key, r in probes.items() if f"/{key}.png" in req.full_url)
        if isinstance(response, Exception):
            raise response
        return response

    urlopen.side_effect = respond
    maybe_render.side_effect = lambda key, version: (
        RenderOutcome.NUDGE_FAILED if key == failed.key else RenderOutcome.NUDGED
    )
    with pytest.raises(CommandError):  # the failed nudge
        run(failed.key, nudged.key, current.key, last.key, "--delay", "7")
    assert sleep.call_args_list == [mock.call(7.0), mock.call(7.0)]


@pytest.mark.django_db
@pytest.mark.parametrize("unset", ["SCREENSHOTS_ORIGIN", "RENDER_SECRET"])
def test_refuses_to_run_when_dark(settings, urlopen, unset):
    setattr(settings, unset, "")
    with pytest.raises(CommandError, match="must both be set"):
        run(SceneFactory.create().key)
    urlopen.assert_not_called()
