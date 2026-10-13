import time
import urllib.error
import urllib.request
from typing import Optional

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from main.constants import BACKEND_USER_AGENT
from scenes.models import LegacyScene, Scene
from scenes.screenshots import RenderOutcome, maybe_render, scene_image_url

CURRENT = "current"


def probe(key: str, version: str) -> Optional[str]:
    """Ask the screenshots Worker which render it holds for ``key``.

    Returns ``CURRENT``, ``"probe failed: …"``, or None when the scene needs a
    render (no render cached, or one of another version).
    """
    url = scene_image_url(key, version)
    assert url is not None  # handle() refuses to run with SCREENSHOTS_ORIGIN unset
    req = urllib.request.Request(url, headers={"user-agent": BACKEND_USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10.0) as res:
            headers = res.headers
    # HTTPError subclasses OSError (via URLError), so it must be caught first.
    except urllib.error.HTTPError as e:
        return None if e.code == 404 else f"probe failed: HTTP {e.code}"
    except OSError as e:
        return f"probe failed: {e}"
    if headers.get("x-rendered-at") is None:
        # Every render records renderedAt, so only a Worker that predates the
        # headers omits it — and against it every scene would look stale.
        raise CommandError(
            "The screenshots Worker sent no X-Rendered-At header, so it predates "
            "the render headers. Deploy packages/screenshots, then re-run."
        )
    return CURRENT if headers.get("x-render-version") == version else None


class Command(BaseCommand):
    help = (
        "Render screenshots for the given scene keys through the spend-capped "
        "render path, skipping scenes whose current render is already cached."
    )

    def add_arguments(self, parser):
        parser.add_argument("keys", nargs="+", metavar="KEY")
        parser.add_argument(
            "--force",
            action="store_true",
            help="Render without first checking for a current render.",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=30.0,
            help=(
                "Seconds to wait after each requested render. Workers Free allows "
                "one new browser every 20s, shared with renders from saves."
            ),
        )

    def handle(self, *args, keys, force, delay, **options):
        if not (settings.SCREENSHOTS_ORIGIN and settings.RENDER_SECRET):
            raise CommandError("SCREENSHOTS_ORIGIN and RENDER_SECRET must both be set.")

        # A repeated key would be probed while its first render is in flight,
        # and spend a second slot.
        keys = list(dict.fromkeys(keys))
        failures = []
        for i, key in enumerate(keys):
            status = self.render_one(key, force)
            self.stdout.write(f"{key}: {status}")
            if status == RenderOutcome.NUDGED:
                if i < len(keys) - 1:
                    time.sleep(delay)
            elif status != CURRENT:
                failures.append(f"{key} ({status})")

        if failures:
            raise CommandError(
                f"{len(failures)} of {len(keys)} key(s) failed: {', '.join(failures)}"
            )

    def render_one(self, key: str, force: bool) -> str:
        scene = Scene.objects.filter(key=key).first()
        if scene is None:
            if LegacyScene.objects.filter(key=key).exists():
                return "legacy (not migrated)"
            return "not found"
        version = scene.screenshot_version
        if not force:
            probed = probe(key, version)
            if probed is not None:
                return probed
        return maybe_render(key, version)
