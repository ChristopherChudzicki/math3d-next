import http.client
import time
import urllib.error
import urllib.request

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from main.constants import BACKEND_USER_AGENT
from scenes.models import LegacyScene, Scene
from scenes.screenshots import RenderOutcome, maybe_render, scene_image_url

CURRENT = "current"


def probe(key: str, version: str) -> str | None:
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
    except (OSError, http.client.HTTPException) as e:
        return f"probe failed: {e!r}"
    if headers.get("x-rendered-at") is None:
        # Every render records renderedAt, so only a Worker that predates the
        # headers omits it — and against it every scene would look stale.
        raise CommandError(
            f"The screenshots Worker sent no X-Rendered-At header for {key!r}: it "
            "predates the render headers, or the object wasn't written by a render. "
            "Deploy packages/screenshots, then re-run."
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
                "Seconds to wait between render requests. Workers Free allows one "
                "new browser every 20s, shared with renders from saves."
            ),
        )

    def handle(self, *args, keys, force, delay, **options):
        if not (settings.SCREENSHOTS_ORIGIN and settings.RENDER_SECRET):
            raise CommandError("SCREENSHOTS_ORIGIN and RENDER_SECRET must both be set.")

        # A repeated key would be probed while its first render is in flight,
        # and spend a second slot.
        keys = list(dict.fromkeys(keys))
        failures = []
        nudged = 0
        for i, key in enumerate(keys):
            status = self.render_one(key, force)
            self.stdout.write(f"{key}: {status}")
            if status == RenderOutcome.NUDGED:
                nudged += 1
            elif status != CURRENT:
                failures.append(f"{key} ({status})")
            # A failed nudge may still have reached the Worker (e.g. a timeout
            # after it accepted), so pace it like a successful one.
            requested = status in (RenderOutcome.NUDGED, RenderOutcome.NUDGE_FAILED)
            if requested and i < len(keys) - 1:
                time.sleep(delay)

        if nudged:
            self.stdout.write(
                f"{nudged} render(s) requested, not yet confirmed: re-run in a "
                "minute; a scene whose render landed reports current."
            )
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
