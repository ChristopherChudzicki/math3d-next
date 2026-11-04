"""math3d-react's color expressions take ``X, Y, Z``, the point's coordinates
normalized to [0, 1] over the axis ranges. math3d-next's take the coordinates
``x, y, z`` and normalize with ``rescale_x`` etc. The rule for the parameters
matches ``colorExprParams`` in ``@math3d/mathitem-configs``."""

import re
from typing import Literal

from scenes.legacy_scene_utils.symbols import depends_on
from scenes.schemas.math_items import FunctionAssignmentObj

SurfaceKind = Literal["explicit", "parametric", "polar"]

# A capital X, Y or Z the parser reads as a whole identifier; a preceding
# digit is implicit multiplication (``5Z``), and ``\X`` is a command.
_NORMALIZED = re.compile(r"(?<![A-Za-z_\\])[XYZ](?![A-Za-z0-9_])")


def _stand_in(coordinate: str) -> str:
    return rf"\${coordinate}"


def color_params(kind: SurfaceKind, surface_params: list[str], body: str) -> list[str]:
    """The surface's own parameters verbatim, and a slot per coordinate. A slot
    is ``$c`` when a surface parameter is named ``c``, or when the legacy body
    uses ``c`` other than as a surface parameter: a global, which the
    coordinate would otherwise hide."""
    taken = {p.strip() for p in surface_params}
    coordinates = ["z"] if kind == "explicit" else ["x", "y", "z"]
    slots = [
        _stand_in(c) if c in taken or depends_on(body, c) else c for c in coordinates
    ]
    if kind == "explicit":
        return [*surface_params, *slots]
    return [*slots, *surface_params]


def rewrite_color_body(body: str, slots: tuple[str, str, str]) -> str:
    """Replaces ``X`` with ``{rescale_x(<x slot>)}``, and likewise ``Y``, ``Z``.
    The braces keep the call one term, e.g. in ``Y^Z``."""
    by_capital = dict(zip("XYZ", slots, strict=True))

    def replace(match: re.Match[str]) -> str:
        capital = match[0]
        return rf"{{\operatorname{{rescale}}_{capital.lower()}\left({by_capital[capital]}\right)}}"

    return _NORMALIZED.sub(replace, body)


def translate_color_expr(
    legacy: FunctionAssignmentObj, kind: SurfaceKind, surface_params: list[str]
) -> FunctionAssignmentObj:
    params = color_params(kind, surface_params, legacy.rhs)
    # An explicit surface has no x or y slot: its own params are x and y.
    x_slot, y_slot = ("x", "y") if kind == "explicit" else (params[0], params[1])
    return FunctionAssignmentObj(
        type="function-assignment",
        name=legacy.name,
        params=params,
        rhs=rewrite_color_body(legacy.rhs, (x_slot, y_slot, params[2])),
    )
