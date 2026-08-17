"""Backend-gated screenshot rendering (ADR-0002).

The backend is the sole gatekeeper of the legitimate render path: a save
reserves a slot from per-period ledgers (``reserve_render_slot``) before
nudging the render Worker. Reservation is atomic and both-caps: renders never
exceed reservations, reservations never exceed the caps.
"""

from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone

# Raw SQL is deliberate: no ORM idiom expresses insert-or-increment-only-if-
# under-cap in one atomic round-trip (update_or_create is select-then-write;
# bulk_create update_conflicts has no WHERE). Do NOT "simplify" to the ORM.
# Table names are Django's default db_table for scenes.RenderMonth/RenderDay —
# if either model's Meta.db_table ever changes, update these strings in lockstep.
_MONTH_SQL = """
    INSERT INTO scenes_rendermonth (month, count, modified) VALUES (%(period)s, 1, now())
    ON CONFLICT (month) DO UPDATE SET count = scenes_rendermonth.count + 1, modified = now()
    WHERE scenes_rendermonth.count < %(cap)s
    RETURNING count
"""
_DAY_SQL = """
    INSERT INTO scenes_renderday (day, count, modified) VALUES (%(period)s, 1, now())
    ON CONFLICT (day) DO UPDATE SET count = scenes_renderday.count + 1, modified = now()
    WHERE scenes_renderday.count < %(cap)s
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
