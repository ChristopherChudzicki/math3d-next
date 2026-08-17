import datetime
import threading

import pytest
from django.db import connection
from django.utils import timezone

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
