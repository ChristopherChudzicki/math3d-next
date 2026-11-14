"""Rewrites a color expression's outer ``mod`` as the Wrap setting draws it,
where that draws the same:

- ``mod(f, 1)`` becomes ``f``, wrapping;
- ``\\frac{mod(f, c)}{c}`` becomes ``\\frac{f}{c}``, wrapping, since mathjs's
  ``mod(f, c)/c`` is ``mod(f/c, 1)`` for any ``c``;
- ``mod(f, 0)``, which mathjs evaluates as ``f``, becomes ``f``.

Wrapping draws ``f`` as ``mod(f, 1)`` does except for ``f`` in [-1e-4, 0) or
[1, 1 + 1e-4], which ``f`` clamps to the near end of the map and ``mod`` wraps
to the far one. On three.js ``f`` wraps per pixel, which avoids the teeth that
``mod`` draws per vertex.

The match is conservative: a miss leaves the expression as it was, which
still draws as it did. Only the spellings the frontend parser reads as a call
to ``mod`` count (``\\operatorname`` and ``\\mathrm`` are decorative to it)."""

import re
from typing import NamedTuple

from scenes.legacy_scene_utils.latex_tokens import TOKEN

_HEAD = re.compile(r"\s*(?:\\operatorname\{mod\}|\\mathrm\{mod\}|mod)\s*")

_FRAC = re.compile(r"\s*\\frac\s*")

# The call's brackets: the parser reads `mod[...]` as indexing, not a call.
_CALL = {"(": ")", r"\left(": r"\right)"}

# Whitespace and LaTeX spacing commands, which change nothing a parser reads.
_SPACING = re.compile(r"\\[ ,;:!]|\s")

_NUMBER = re.compile(r"\d+\.?\d*|\.\d+")


class ModRewrite(NamedTuple):
    rhs: str
    # True when the rewrite draws the same only wrapping; false when it draws
    # the same either way.
    wraps: bool


def _bare(text: str) -> str:
    return _SPACING.sub("", text)


def _number(text: str) -> float | None:
    bare = _bare(text)
    return float(bare) if _NUMBER.fullmatch(bare) else None


def _bracketed(text: str, opener: dict[str, str]) -> tuple[str, int] | None:
    """The contents and end of the bracket that ``text`` starts with, whose
    opener is a key of ``opener`` and whose closer is its value."""
    tokens = TOKEN.finditer(text)
    first = next(tokens, None)
    if first is None or first[0] not in opener:
        return None
    depth = 1
    for token in tokens:
        if token.lastgroup == "open":
            depth += 1
        elif token.lastgroup == "close":
            depth -= 1
            if depth == 0:
                if token[0] != opener[first[0]]:
                    return None
                return text[first.end() : token.start()], token.end()
    return None


def _mod_call(text: str) -> tuple[str, str] | None:
    """``(f, c)`` when ``text`` is wholly ``mod(f, c)``."""
    head = _HEAD.match(text)
    if not head:
        return None
    call = _bracketed(text[head.end() :], _CALL)
    if call is None or _bare(text[head.end() + call[1] :]):
        return None
    args, depth = call[0], 0
    commas = []
    for token in TOKEN.finditer(args):
        if token.lastgroup == "open":
            depth += 1
        elif token.lastgroup == "close":
            depth -= 1
        elif token.lastgroup == "comma" and depth == 0:
            commas.append(token.start())
    if len(commas) != 1:
        return None
    f, c = args[: commas[0]].strip(), args[commas[0] + 1 :]
    return (f, c) if _bare(f) and _bare(c) else None


def _fraction(text: str) -> tuple[str, str] | None:
    """``(numerator, denominator)`` when ``text`` is wholly ``\\frac{…}{…}``."""
    head = _FRAC.match(text)
    if not head:
        return None
    rest = text[head.end() :]
    numerator = _bracketed(rest, {"{": "}"})
    if numerator is None:
        return None
    rest = rest[numerator[1] :].lstrip()
    denominator = _bracketed(rest, {"{": "}"})
    if denominator is None or _bare(rest[denominator[1] :]):
        return None
    return numerator[0], denominator[0]


def rewrite_color_mod(rhs: str) -> ModRewrite | None:
    """The rewrite of ``rhs``'s outer ``mod``, if it has one that draws the same."""
    call = _mod_call(rhs)
    if call is not None:
        f, c = call
        period = _number(c)
        if period == 1:
            return ModRewrite(f, wraps=True)
        if period == 0:
            return ModRewrite(f, wraps=False)
        return None
    fraction = _fraction(rhs)
    if fraction is None:
        return None
    numerator, denominator = fraction
    call = _mod_call(numerator)
    if call is None or _bare(call[1]) != _bare(denominator):
        return None
    return ModRewrite(rf"\frac{{{call[0]}}}{{{denominator}}}", wraps=True)
