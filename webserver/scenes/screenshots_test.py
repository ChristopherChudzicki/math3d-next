import datetime
import logging
import threading
from unittest import mock

import pytest
from django.db import connection
from django.utils import timezone
from main.constants import BACKEND_USER_AGENT

from scenes import screenshots
from scenes.models import RenderDay, RenderMonth
from scenes.screenshots import reserve_render_slot


def _today():
    return timezone.now().date()


@pytest.mark.django_db
def test_grants_and_creates_fresh_rows_under_cap():
    assert reserve_render_slot() is True
    today = _today()
    assert RenderDay.objects.get(pk=today).count == 1
    assert RenderMonth.objects.get(pk=today.replace(day=1)).count == 1


@pytest.mark.django_db
def test_new_period_keeps_prior_month_row_as_history():
    # The ledger is append-only history, not a singleton: reserving in the
    # current month must not touch a prior month's row (spec §1 "kept
    # indefinitely"). Uses a fixed far-past month so it's current-date-agnostic.
    prior = datetime.date(2000, 1, 1)
    RenderMonth.objects.create(month=prior, count=5)
    assert reserve_render_slot() is True
    assert RenderMonth.objects.get(pk=prior).count == 5  # untouched


@pytest.mark.django_db
def test_monthly_cap_boundary_pins_strict_less_than(settings):
    settings.RENDER_MONTHLY_CAP = 5  # daily cap stays at its default (non-binding here)
    today = _today()
    RenderMonth.objects.create(month=today.replace(day=1), count=4)  # cap-1
    assert reserve_render_slot() is True  # 4 -> 5 (== cap)
    assert RenderMonth.objects.get(pk=today.replace(day=1)).count == 5
    assert reserve_render_slot() is False  # 5 !< 5
    assert RenderMonth.objects.get(pk=today.replace(day=1)).count == 5  # unchanged


@pytest.mark.django_db
def test_daily_cap_boundary_pins_strict_less_than(settings):
    settings.RENDER_DAILY_CAP = 5  # monthly cap stays at its default (non-binding here)
    today = _today()
    RenderDay.objects.create(day=today, count=4)  # cap-1
    assert reserve_render_slot() is True  # 4 -> 5 (== cap)
    assert RenderDay.objects.get(pk=today).count == 5
    assert reserve_render_slot() is False  # 5 !< 5
    assert RenderDay.objects.get(pk=today).count == 5  # unchanged


@pytest.mark.django_db
def test_day_over_cap_rolls_back_month_bump(settings):
    # Month has room, day is saturated → decline AND leave the month untouched
    # (both-or-neither). Pins transaction.set_rollback on the day-fail branch.
    settings.RENDER_MONTHLY_CAP = 1000
    settings.RENDER_DAILY_CAP = 3
    today = _today()
    RenderDay.objects.create(day=today, count=3)  # at cap
    month_before = RenderMonth.objects.filter(pk=today.replace(day=1)).first()
    assert reserve_render_slot() is False
    # No month row was created, or if one pre-existed its count is unchanged.
    assert RenderMonth.objects.filter(pk=today.replace(day=1)).first() == month_before


@pytest.mark.django_db(transaction=True)
def test_no_over_grant_under_concurrency(settings):
    # The load-bearing invariant: N threads hammering a cap-1 boundary yield
    # exactly `cap` grants, never `cap+1`.
    settings.RENDER_MONTHLY_CAP = 100
    settings.RENDER_DAILY_CAP = 55  # the binding cap; seed to cap-1
    today = _today()
    RenderDay.objects.create(day=today, count=54)
    RenderMonth.objects.create(month=today.replace(day=1), count=54)

    results = []
    lock = threading.Lock()

    def worker():
        try:
            granted = reserve_render_slot()
        finally:
            connection.close()  # each thread gets its own connection
        with lock:
            results.append(granted)

    threads = [threading.Thread(target=worker) for _ in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert sum(results) == 1  # exactly one grant reaches the 55 cap
    assert RenderDay.objects.get(pk=today).count == 55


# These four mock reserve_render_slot, so they never touch the DB — no
# django_db marker (it would add pointless per-test DB setup).
def test_maybe_render_dark_when_origin_unset(settings):
    settings.SCREENSHOTS_ORIGIN = ""
    with mock.patch.object(screenshots, "reserve_render_slot") as reserve:
        screenshots.maybe_render("abc")
    reserve.assert_not_called()


def test_maybe_render_dark_when_secret_unset(settings):
    # Origin set but secret empty is still dark: otherwise a save would reserve a
    # slot and then 403 at the Worker, burning cap with nothing to show for it.
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    settings.RENDER_SECRET = ""
    with mock.patch.object(screenshots, "reserve_render_slot") as reserve:
        screenshots.maybe_render("abc")
    reserve.assert_not_called()


def test_maybe_render_declines_over_cap_without_nudging(settings):
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    settings.RENDER_SECRET = "shh"  # pragma: allowlist secret
    with (
        mock.patch.object(screenshots, "reserve_render_slot", return_value=False),
        mock.patch.object(screenshots, "nudge_render") as nudge,
    ):
        screenshots.maybe_render("abc")
    nudge.assert_not_called()


def test_maybe_render_nudges_when_granted(settings):
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    settings.RENDER_SECRET = "shh"  # pragma: allowlist secret
    with (
        mock.patch.object(screenshots, "reserve_render_slot", return_value=True),
        mock.patch.object(screenshots, "nudge_render") as nudge,
    ):
        screenshots.maybe_render("abc")
    nudge.assert_called_once_with("abc")


@pytest.fixture
def scenes_caplog(caplog):
    """`scenes` has propagate=False, so caplog's root handler never sees it."""
    logger = logging.getLogger("scenes")
    logger.addHandler(caplog.handler)
    try:
        yield caplog
    finally:
        logger.removeHandler(caplog.handler)


def test_maybe_render_swallows_reserve_exception(settings, scenes_caplog):
    # The isolation invariant: a failure inside maybe_render must not propagate
    # (it runs inline in the save's request cycle — an escape would 500 the save).
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    settings.RENDER_SECRET = "shh"  # pragma: allowlist secret
    with mock.patch.object(
        screenshots, "reserve_render_slot", side_effect=RuntimeError("db down")
    ):
        screenshots.maybe_render("abc")  # must not raise
    (record,) = [r for r in scenes_caplog.records if r.levelno == logging.ERROR]
    assert record.name == "scenes.screenshots"
    assert record.getMessage() == "maybe_render failed for key=abc"


def test_nudge_render_sends_named_user_agent(settings):
    # A named UA avoids Cloudflare's Browser Integrity Check, which 1010-blocks
    # the default `Python-urllib` UA at the edge before the Worker runs.
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    settings.RENDER_SECRET = "shh"  # pragma: allowlist secret
    with mock.patch("scenes.screenshots.urllib.request.urlopen") as urlopen:
        screenshots.nudge_render("abc")
    req = urlopen.call_args.args[0]
    assert req.get_header("User-agent") == BACKEND_USER_AGENT


def test_nudge_render_swallows_transport_error(settings, scenes_caplog):
    settings.SCREENSHOTS_ORIGIN = "https://s.math3d.org"
    settings.RENDER_SECRET = "shh"  # pragma: allowlist secret
    with mock.patch(
        "scenes.screenshots.urllib.request.urlopen", side_effect=OSError("refused")
    ):
        screenshots.nudge_render("abc")  # must not raise
    (record,) = [r for r in scenes_caplog.records if r.levelno == logging.ERROR]
    assert record.name == "scenes.screenshots"
    assert record.getMessage() == "nudge_render failed for key=abc"
