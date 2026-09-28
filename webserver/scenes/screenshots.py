"""Backend-gated screenshot rendering (ADR-0002).

The backend is the sole gatekeeper of the legitimate render path: a save
reserves a slot from per-period ledgers (``reserve_render_slot``) before
nudging the render Worker. Reservation is atomic and both-caps: renders never
exceed reservations, reservations never exceed the caps.
"""

import json
import logging
import urllib.request

from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone
from main.constants import BACKEND_USER_AGENT

from scenes.models import RenderDay, RenderMonth

logger = logging.getLogger(__name__)

# Raw SQL is deliberate: no ORM idiom expresses insert-or-increment-only-if-
# under-cap in one atomic round-trip (update_or_create is select-then-write;
# bulk_create update_conflicts has no WHERE). Do NOT "simplify" to the ORM.
# Table names are read from the models so a Meta.db_table change can't desync them.
_MONTH = RenderMonth._meta.db_table
_DAY = RenderDay._meta.db_table
_MONTH_SQL = f"""
    INSERT INTO {_MONTH} (month, count, modified) VALUES (%(period)s, 1, now())
    ON CONFLICT (month) DO UPDATE SET count = {_MONTH}.count + 1, modified = now()
    WHERE {_MONTH}.count < %(cap)s
    RETURNING count
"""
_DAY_SQL = f"""
    INSERT INTO {_DAY} (day, count, modified) VALUES (%(period)s, 1, now())
    ON CONFLICT (day) DO UPDATE SET count = {_DAY}.count + 1, modified = now()
    WHERE {_DAY}.count < %(cap)s
    RETURNING count
"""


def _bump(sql: str, period, cap: int) -> bool:
    with connection.cursor() as cur:
        cur.execute(sql, {"period": period, "cap": cap})
        return cur.fetchone() is not None


def reserve_render_slot() -> bool:
    """Grant iff both the current UTC day and month are under cap; bump both,
    all-or-nothing. A missing period row is created at 1 (implicit rollover)."""
    today = timezone.now().date()  # UTC (USE_TZ, TIME_ZONE=UTC)
    month = today.replace(day=1)
    with transaction.atomic():
        if not _bump(_MONTH_SQL, month, settings.RENDER_MONTHLY_CAP):
            return False  # over monthly cap (nothing changed)
        if not _bump(_DAY_SQL, today, settings.RENDER_DAILY_CAP):
            transaction.set_rollback(True)  # undo the monthly bump
            return False
        return True


def nudge_render(key: str) -> None:
    """Best-effort fire at the Worker's POST /render (secret-gated → 202).
    ~2s timeout, no retry. Swallows transport errors — the render is a
    best-effort side effect of the save."""
    req = urllib.request.Request(
        f"{settings.SCREENSHOTS_ORIGIN}/render",
        data=json.dumps({"key": key}).encode(),
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {settings.RENDER_SECRET}",
            "user-agent": BACKEND_USER_AGENT,
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=2.0).close()
    except Exception:
        # Log-attribution only (a distinct line from a reserve failure), NOT the
        # isolation guard — maybe_render's outer try is what protects the save.
        logger.error("nudge_render failed for key=%s", key, exc_info=True)


def maybe_render(key: str) -> None:
    """Reserve a slot and nudge the render Worker. Fully isolated — runs inline
    via on_commit in autocommit views (scenes/api.py), so it must never
    propagate: a failure here must still let the save return 2xx."""
    try:
        # Both must be set, or the feature is dark: an origin without a secret
        # would reserve a slot then 403 at the Worker, burning cap for nothing.
        if not (settings.SCREENSHOTS_ORIGIN and settings.RENDER_SECRET):
            return
        if not reserve_render_slot():  # over cap → decline (coverage, not spend)
            return
        nudge_render(key)
    except Exception:
        logger.error("maybe_render failed for key=%s", key, exc_info=True)


def schedule_render(key: str) -> None:
    """Fire maybe_render after the surrounding DB work commits.

    create/update are autocommit views, so this on_commit hook runs inline
    before the response. Wrapping them in a transaction would defer the nudge to
    request-commit and demote reserve_render_slot's atomic() to a savepoint.
    """
    transaction.on_commit(lambda: maybe_render(key))
