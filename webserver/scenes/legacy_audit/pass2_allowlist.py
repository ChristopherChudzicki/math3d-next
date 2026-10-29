"""Accepted pass-2 differences.

Each entry matches root `differ` or `regression` pairs and cites the app code
or owner decision that makes the difference acceptable. Matching pairs are
reported apart and don't make a scene unclean; their dependents inherit the
entry by not being roots.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scenes.legacy_audit.evaluation import Pair


@dataclass(frozen=True)
class Entry:
    outcome: str
    # A prefix of the pair's detail: its differ signature, or its error
    # template ("eval: Undefined function X").
    detail: str
    reason: str
    item_type: str | None = None
    next_field: str | None = None

    def matches(self, pair: Pair) -> bool:
        return (
            pair.outcome == self.outcome
            and (pair.detail or "").startswith(self.detail)
            and self.item_type in (None, pair.spec.item_type)
            and self.next_field in (None, pair.spec.next_field)
        )


ALLOWLIST: list[Entry] = []
