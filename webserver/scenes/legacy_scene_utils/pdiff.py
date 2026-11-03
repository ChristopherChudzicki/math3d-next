"""Rewrite math3d-react's ``pdiff``, which math3d-next doesn't have.

``pdiff(f, x_1, …, x_k, n)`` is the derivative of the function ``f`` in its
nth argument (counted from 1) at the point ``(x_1, …, x_k)``. It becomes:

- ``\\frac{\\partial f(x_1, …, x_k)}{\\partial x_n}`` when ``f`` and ``x_n`` are
  names and ``x_n`` appears nowhere else in the call;
- otherwise ``diff(f, x_1, …, x_k)[n]`` (``diff(f, x_1)`` for one point), since
  ``diff`` returns every partial derivative. This one holds only for a scalar
  ``f``: ``diff`` of a vector-valued ``f`` is 2-D, so ``[n]`` is an error.

Both take the same central difference as ``pdiff``. Other calls are kept.
"""

import re

from scenes.legacy_scene_utils.latex_tokens import NAME, SPACE, TOKEN
from scenes.legacy_scene_utils.symbols import depends_on

_CALL = "\\operatorname{pdiff}\\left("

_INTEGER = re.compile(r"[1-9][0-9]*")


def _call_args(text: str, start: int) -> tuple[list[str], int] | None:
    """The top-level arguments of the call whose ``\\left(`` ends at ``start``,
    and the index just past its ``\\right)``; None if it isn't closed."""
    args, depth, arg_start = [], 0, start
    for match in TOKEN.finditer(text, start):
        kind = match.lastgroup
        if kind == "open":
            depth += 1
        elif kind == "close" and depth > 0:
            depth -= 1
        elif kind == "close":
            args.append(text[arg_start : match.start()])
            return args, match.end()
        elif kind == "comma" and depth == 0:
            args.append(text[arg_start : match.start()])
            arg_start = match.end()
    return None


def _equivalent(args: list[str]) -> str | None:
    if len(args) < 3 or not all(args):
        return None
    f, points, n = args[0], args[1:-1], args[-1]
    point_list = ",".join(points)
    if _INTEGER.fullmatch(n) and int(n) <= len(points):
        i = int(n) - 1
        variable = points[i]
        others = [f, *points[:i], *points[i + 1 :]]
        if (
            NAME.fullmatch(f)
            and NAME.fullmatch(variable)
            and not any(depends_on(other, variable) for other in others)
        ):
            return (
                f"\\frac{{\\partial {f}\\left({point_list}\\right)}}"
                f"{{\\partial {variable}}}"
            )
    diff = f"\\operatorname{{diff}}\\left({f},{point_list}\\right)"
    if len(points) == 1:
        # With one point, diff returns the derivative itself, not a list.
        return diff if n == "1" else None
    return f"{diff}\\left[{n}\\right]"


def rewrite(latex: str) -> tuple[str, list[str]]:
    """``latex`` with each ``pdiff`` call rewritten, and the calls it kept."""
    out, kept, position = [], [], 0
    while (found := latex.find(_CALL, position)) != -1:
        parsed = _call_args(latex, found + len(_CALL))
        if parsed is None:
            kept.append(latex[found:])
            break
        raw_args, end = parsed
        args = []
        for raw in raw_args:
            arg, arg_kept = rewrite(raw)
            args.append(SPACE.sub("", arg))
            kept += arg_kept
        call = latex[found:end]
        equivalent = _equivalent(args)
        if equivalent is None:
            kept.append(call)
            equivalent = call
        out.append(latex[position:found] + equivalent)
        position = end
    out.append(latex[position:])
    return "".join(out), kept
