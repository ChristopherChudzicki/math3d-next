"""Shift legacy array indices from 1-based to 0-based.

math3d-react's mathjs counts from 1 in expressions (its ``index`` transform);
math3d-next's custom-mathjs omits that transform, so ``a[1]`` is the second
entry there. ``shift_indices`` rewrites each index so the expression keeps its
legacy meaning.

A bracket is an index where mathjs parses it as one: after a name or a closing
bracket. An index after a LaTeX command (``\\sqrt[3]{x}``, ``\\log[t]``) is
left alone; those are root degrees or broken in both apps.
"""

import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

_TOKEN = re.compile(
    r"""
    (?P<open>\\left(?:\[|\\lbrack|\(|\\\{|\\langle|\.|\|)|\\lbrack|\\\{|[\[({])
    | (?P<close>\\right(?:\]|\\rbrack|\)|\\\}|\\rangle|\.|\|)|\\rbrack|\\\}|[\])}])
    | (?P<space>\\[ ,;:!]|\\q?quad(?![A-Za-z])|~|\s+)
    | (?P<command>\\[A-Za-z]+)
    | (?P<word>\w+)
    | (?P<other>.)
    """,
    re.VERBOSE | re.DOTALL,
)

# Dimension contents that can't take a plain "-1" without parentheses: lower
# precedence than subtraction in mathjs.
_LOW_PRECEDENCE_COMMANDS = {
    "le", "leq", "ge", "geq", "ne", "neq", "lt", "gt",
    "land", "lor", "lnot", "neg", "wedge", "vee", "in", "to",
}  # fmt: skip
_LOW_PRECEDENCE_WORDS = {"and", "or", "xor", "not", "to", "in"}
_LOW_PRECEDENCE_CHARS = set("<>=?:&|!")
_NUMBER = re.compile(r"[-+]?(?:\d+\.?\d*|\.\d+)")


@dataclass
class _Token:
    kind: str
    text: str


def _tokens(latex: str) -> list[_Token]:
    return [_Token(kind=str(m.lastgroup), text=m[0]) for m in _TOKEN.finditer(latex)]


def _is_index_opener(token: _Token) -> bool:
    return token.kind == "open" and token.text in (
        "[",
        "\\lbrack",
        "\\left[",
        "\\left\\lbrack",
    )


def _precedes_index(token: _Token | None) -> bool:
    if token is None:
        return False
    if token.kind == "close":
        return True
    # "2x" is 2 times the name x; "2" alone is a number, which mathjs
    # doesn't index.
    return token.kind == "word" and not token.text.isdigit()


def _text(tokens: list[_Token]) -> str:
    return "".join(t.text for t in tokens)


def _significant(tokens: list[_Token]) -> list[_Token]:
    return [t for t in tokens if t.kind != "space"]


def _split_top_level(tokens: list[_Token], separator: str) -> list[list[_Token]]:
    parts: list[list[_Token]] = [[]]
    depth = 0
    for token in tokens:
        if token.kind == "open":
            depth += 1
        elif token.kind == "close":
            depth -= 1
        if depth == 0 and token.kind == "other" and token.text == separator:
            parts.append([])
        else:
            parts[-1].append(token)
    return parts


def _has_low_precedence(tokens: list[_Token]) -> bool:
    depth = 0
    for token in tokens:
        if token.kind == "open":
            depth += 1
        elif token.kind == "close":
            depth -= 1
        elif depth == 0 and (
            (token.kind == "other" and token.text in _LOW_PRECEDENCE_CHARS)
            or (token.kind == "word" and token.text in _LOW_PRECEDENCE_WORDS)
            or (token.kind == "command" and token.text[1:] in _LOW_PRECEDENCE_COMMANDS)
        ):
            return True
    return False


def _minus_one(tokens: list[_Token]) -> str:
    """``tokens - 1``, as LaTeX, keeping surrounding spaces."""
    first = next(i for i, t in enumerate(tokens) if t.kind != "space")
    last = max(i for i, t in enumerate(tokens) if t.kind != "space")
    return (
        _text(tokens[:first])
        + _core_minus_one(tokens[first : last + 1])
        + _text(tokens[last + 1 :])
    )


def _core_minus_one(tokens: list[_Token]) -> str:
    text = _text(tokens)
    compact = "".join(t.text for t in _significant(tokens))
    if _NUMBER.fullmatch(compact):
        try:
            return str(Decimal(compact) - 1)
        except InvalidOperation:
            pass
    if _has_low_precedence(tokens):
        return f"\\left({text}\\right)-1"
    significant = _significant(tokens)
    # i+1 -> i, i+2 -> i+1, i-1 -> i-2
    if (
        len(significant) >= 3
        and significant[-1].kind == "word"
        and significant[-1].text.isdigit()
        and significant[-2].text in "+-"
        and significant[-3].kind in ("word", "close", "command")
    ):
        sign = 1 if significant[-2].text == "+" else -1
        offset = sign * int(significant[-1].text) - 1
        operator = next(
            i for i in reversed(range(len(tokens))) if tokens[i].text in "+-"
        )
        head = _text(tokens[:operator]).rstrip()
        if offset == 0:
            return head
        return f"{head}{'+' if offset > 0 else '-'}{abs(offset)}"
    return f"{text}-1"


class _Shifter:
    def __init__(self) -> None:
        self.problems: list[str] = []

    def dimension(self, tokens: list[_Token]) -> str:
        tokens = _tokens(self.shift(_text(tokens)))
        if not _significant(tokens):
            self.problems.append("an empty index")
            return _text(tokens)
        parts = _split_top_level(tokens, ":")
        if len(parts) == 1:
            return _minus_one(tokens)
        if len(parts) > 3:
            self.problems.append("a malformed range index")
            return _text(tokens)
        # A 1-based inclusive range a:b is the 0-based exclusive range
        # (a-1):b; a:step:b likewise keeps its step and end. mathjs fills an
        # open start with 1 in both apps, so it becomes an explicit 0.
        start = _minus_one(parts[0]) if _significant(parts[0]) else "0"
        return ":".join([start, *(_text(p) for p in parts[1:])])

    def shift(self, latex: str) -> str:
        tokens = _tokens(latex)
        out: list[str] = []
        i = 0
        previous: _Token | None = None
        while i < len(tokens):
            token = tokens[i]
            close = _matching_close(tokens, i) if token.kind == "open" else None
            if close is None:
                out.append(token.text)
            elif _is_index_opener(token) and _precedes_index(previous):
                dims = _split_top_level(tokens[i + 1 : close], ",")
                out.append(token.text)
                out.append(",".join(self.dimension(d) for d in dims))
                out.append(tokens[close].text)
                i = close
            else:
                inner = tokens[i + 1 : close]
                out.append(token.text)
                out.append(self.shift(_text(inner)))
                out.append(tokens[close].text)
                if token.text == "{" and _unwraps(previous):
                    # math3d-next drops these braces, so what precedes a
                    # following bracket is the group's last token.
                    significant = _significant(inner)
                    previous = significant[-1] if significant else previous
                    i = close + 1
                    continue
                i = close
            if tokens[i].kind != "space":
                previous = tokens[i]
            i += 1
        return "".join(out)


def _unwraps(token: _Token | None) -> bool:
    """Whether a brace group after ``token`` loses its braces in math3d-next's
    parser: subscripts and \\operatorname / \\mathrm."""
    return token is not None and (
        # "_" is a word character, so "x_" is one token.
        (token.kind == "word" and token.text.endswith("_"))
        or (token.kind == "command" and token.text in ("\\operatorname", "\\mathrm"))
    )


def _matching_close(tokens: list[_Token], start: int) -> int | None:
    depth = 0
    for j in range(start, len(tokens)):
        if tokens[j].kind == "open":
            depth += 1
        elif tokens[j].kind == "close":
            depth -= 1
            if depth == 0:
                return j
    return None


def shift_indices(latex: str) -> tuple[str, list[str]]:
    """Return ``latex`` with each array index shifted to 0-based, and a
    description of each index left unshifted."""
    shifter = _Shifter()
    return shifter.shift(latex), shifter.problems
