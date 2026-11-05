"""math3d-react's color expressions take ``X, Y, Z``, the point's coordinates
normalized to [0, 1] over the axis ranges. math3d-next's take the coordinates
``x, y, z`` and normalize with ``rescale_x`` etc. The parameter layout and the
clash rule match ``colorExprParams`` in ``@math3d/mathitem-configs``."""

import re
from typing import Literal

from scenes.legacy_scene_utils.symbols import depends_on
from scenes.schemas.math_items import FunctionAssignmentObj

SurfaceKind = Literal["explicit", "parametric", "polar"]

# A capital X, Y or Z the parser reads as a whole identifier: a preceding
# digit is implicit multiplication (``5Z``), while ``\X`` is a command and
# ``x_{Z}`` a subscript.
_NORMALIZED = re.compile(r"(?<![A-Za-z_\\])(?<!_\{)[XYZ](?![A-Za-z0-9_])")


def _stand_in(coordinate: str) -> str:
    return rf"\${coordinate}"


def _slots(kind: SurfaceKind, surface_params: list[str], body: str) -> dict[str, str]:
    """The name each coordinate takes. It is ``$c`` when a surface parameter is
    named ``c``, or when the legacy body uses ``c`` other than as a surface
    parameter: a global, which the coordinate would otherwise hide. An explicit
    surface's own parameters are its x and y."""
    taken = {p.strip() for p in surface_params}
    slots = {
        c: _stand_in(c) if c in taken or depends_on(body, c) else c
        for c in (["z"] if kind == "explicit" else ["x", "y", "z"])
    }
    if kind == "explicit" and len(surface_params) == 2:
        slots["x"], slots["y"] = (p.strip() for p in surface_params)
    return {"x": "x", "y": "y", **slots}


def color_params(kind: SurfaceKind, surface_params: list[str], body: str) -> list[str]:
    """The surface's own parameters verbatim, and a slot per coordinate."""
    slots = _slots(kind, surface_params, body)
    if kind == "explicit":
        return [*surface_params, slots["z"]]
    return [slots["x"], slots["y"], slots["z"], *surface_params]


def rewrite_color_body(body: str, slots: tuple[str, str, str]) -> str:
    """Replaces ``X`` with ``rescale_x(<x slot>)``, and likewise ``Y``, ``Z``.
    An exponent gets braces, so ``Y^Z`` displays as ``Y^{rescale_z(z)}``."""
    by_capital = dict(zip("XYZ", slots, strict=True))

    def replace(match: re.Match[str]) -> str:
        capital = match[0]
        call = rf"\operatorname{{rescale}}_{capital.lower()}\left({by_capital[capital]}\right)"
        is_exponent = match.start() > 0 and body[match.start() - 1] == "^"
        return f"{{{call}}}" if is_exponent else call

    return _NORMALIZED.sub(replace, body)


def translate_color_expr(
    legacy: FunctionAssignmentObj, kind: SurfaceKind, surface_params: list[str]
) -> FunctionAssignmentObj:
    slots = _slots(kind, surface_params, legacy.rhs)
    return FunctionAssignmentObj(
        type="function-assignment",
        name=legacy.name,
        params=color_params(kind, surface_params, legacy.rhs),
        rhs=rewrite_color_body(legacy.rhs, (slots["x"], slots["y"], slots["z"])),
    )
