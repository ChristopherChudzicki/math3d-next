"""Shift legacy array indices from 1-based to 0-based.

math3d-react's mathjs counts from 1 in expressions (its ``index`` transform);
math3d-next's custom-mathjs omits that transform, so ``a[1]`` is the second
entry there. ``shift_indices`` rewrites each index so the expression keeps its
legacy meaning.

A bracket is an index where math3d-next's parser reads one: after a name
(LaTeX commands like ``\\alpha`` included), a closing bracket, or a postfix
``!`` / ``'``. ``\\sqrt[3]{x}`` is a root degree, not an index, and is left
alone.
"""

import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

_TOKEN = re.compile(
    r"""
    (?P<open>\\left(?:\[|\\lbrack|\(|\\\{|\\langle|\.|\|)|\\lbrack|\\\{|[\[({])
    | (?P<close>\\right(?:\]|\\rbrack|\)|\\\}|\\rangle|\.|\|)|\\rbrack|\\\}|[\])}])
    | (?P<space>\\\ |\\q?quad(?![A-Za-z])|~|\s+)
    | (?P<command>\\[A-Za-z]+)
    | (?P<word>\w+)
    | (?P<other>\\[,;:!]|.)
    """,
    re.VERBOSE | re.DOTALL,
)

# Deeper nesting is left unshifted: it doesn't occur in real scenes, and
# shifting costs time proportional to length times depth.
MAX_DEPTH = 50

# Dimension contents that can't take a plain "-1" without parentheses: lower
# precedence than subtraction in mathjs.
_LOW_PRECEDENCE_COMMANDS = {
    "le", "leq", "ge", "geq", "ne", "neq", "lt", "gt",
    "land", "lor", "lnot", "neg", "wedge", "vee", "in", "to",
}  # fmt: skip
_OPERATOR_WORDS = {"and", "or", "xor", "not", "mod", "to", "in"}
_LOW_PRECEDENCE_CHARS = set("<>=?:&|!")
_NUMBER = re.compile(r"[-+]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)")
# Words mathjs reads as a number: "12", "1e5". "2e" is 2 times e.
_NUMBER_WORD = re.compile(r"[0-9]+(?:[eE][0-9]+)?")
_EXPONENT_STEM = re.compile(r"[0-9]+[eE]")


@dataclass
class _Token:
    kind: str
    text: str

    @property
    def char(self) -> str:
        """An ``other`` token's character. math3d-next's parser turns ``\\,``
        into ``,`` (likewise ``\\;``, ``\\:``, ``\\!``)."""
        return self.text[-1]


def _tokens(latex: str) -> list[_Token]:
    return [_Token(kind=str(m.lastgroup), text=m[0]) for m in _TOKEN.finditer(latex)]


def _is_index_opener(token: _Token) -> bool:
    return token.kind == "open" and token.text in (
        "[",
        "\\lbrack",
        "\\left[",
        "\\left\\lbrack",
    )


def _name(token: _Token) -> str:
    return token.text.lstrip("\\")


def _is_operand(token: _Token | None) -> bool:
    if token is None:
        return False
    if token.kind == "close":
        return True
    if token.kind == "other":
        return token.char in "!'"
    if token.kind == "command" and token.text == "\\cdot":
        return False
    return token.kind in ("word", "command") and _name(token) not in _OPERATOR_WORDS


def _precedes_index(token: _Token | None, before: _Token | None) -> bool:
    """Whether a bracket after ``token`` (itself after ``before``) is an index."""
    if token is None:
        return False
    if token.kind in ("word", "command") and _name(token) in _OPERATOR_WORDS:
        # mathjs reads "or", "in", etc. as operators only after an operand;
        # elsewhere they are names.
        return not _is_operand(before)
    if token.kind == "word" and _NUMBER_WORD.fullmatch(token.text):
        return False
    # \sqrt[n] is a root degree.
    return _is_operand(token) and token.text != "\\sqrt"


def _text(tokens: list[_Token]) -> str:
    return "".join(t.text for t in tokens)


def _significant(tokens: list[_Token]) -> list[_Token]:
    return [t for t in tokens if t.kind != "space"]


def _top_level(tokens: list[_Token]):
    """Yield (index, token) for tokens outside any brackets."""
    depth = 0
    for i, token in enumerate(tokens):
        if token.kind == "open":
            depth += 1
        elif token.kind == "close":
            depth -= 1
        elif depth == 0:
            yield i, token


def _split_top_level(
    tokens: list[_Token], separator: str
) -> tuple[list[list[_Token]], list[str]]:
    """The parts between top-level separators, and each separator's text."""
    cuts = [
        i for i, t in _top_level(tokens) if t.kind == "other" and t.char == separator
    ]
    bounds = zip([-1, *cuts], [*cuts, len(tokens)], strict=True)
    parts = [tokens[start + 1 : end] for start, end in bounds]
    return parts, [tokens[i].text for i in cuts]


def _join(parts: list[str], separators: list[str]) -> str:
    return parts[0] + "".join(s + p for s, p in zip(separators, parts[1:], strict=True))


def _has_low_precedence(tokens: list[_Token]) -> bool:
    return any(
        (token.kind == "other" and token.char in _LOW_PRECEDENCE_CHARS)
        or (token.kind == "word" and token.text in _OPERATOR_WORDS)
        or (token.kind == "command" and token.text[1:] in _LOW_PRECEDENCE_COMMANDS)
        for _i, token in _top_level(tokens)
    )


def _minus(tokens: list[_Token], k: int) -> str:
    """``tokens - k``, as LaTeX, keeping surrounding spaces."""
    first = next(i for i, t in enumerate(tokens) if t.kind != "space")
    last = max(i for i, t in enumerate(tokens) if t.kind != "space")
    return (
        _text(tokens[:first])
        + _core_minus(tokens[first : last + 1], k)
        + _text(tokens[last + 1 :])
    )


def _core_minus(tokens: list[_Token], k: int) -> str:
    text = _text(tokens)
    if _NUMBER.fullmatch(text):
        try:
            return str(Decimal(text) - k)
        except InvalidOperation:
            pass
    if _has_low_precedence(tokens):
        return f"\\left({text}\\right)-{k}"
    significant = _significant(tokens)
    # i+1 -> i, i+2 -> i+1, i-1 -> i-2; not 2e+1 (the number 20)
    if (
        len(significant) >= 3
        and significant[-1].kind == "word"
        and re.fullmatch(r"[0-9]+", significant[-1].text)
        and significant[-2].kind == "other"
        and significant[-2].char in "+-"
        and significant[-3].kind in ("word", "close")
        and not _EXPONENT_STEM.fullmatch(significant[-3].text)
    ):
        sign = 1 if significant[-2].char == "+" else -1
        offset = sign * int(significant[-1].text) - k
        head_end = max(i for i, t in enumerate(tokens) if t is significant[-3])
        head = _text(tokens[: head_end + 1])
        if offset == 0:
            return head
        return f"{head}{'+' if offset > 0 else '-'}{abs(offset)}"
    return f"{text}-{k}"


class _Shifter:
    def __init__(self) -> None:
        self.problems: list[str] = []

    def dimension(self, tokens: list[_Token]) -> str:
        tokens = _tokens(self.shift(_text(tokens)))
        if not _significant(tokens):
            self.problems.append("an empty index")
            return _text(tokens)
        if any(t.kind == "other" and t.char == "?" for _i, t in _top_level(tokens)):
            # a ? b : c is a conditional, not a range.
            return _minus(tokens, 1)
        parts, colons = _split_top_level(tokens, ":")
        if len(parts) == 1:
            return _minus(tokens, 1)
        if len(parts) > 3:
            self.problems.append("a malformed range index")
            return _text(tokens)
        # mathjs's index transform: a 1-based inclusive range a:b is the
        # 0-based exclusive range (a-1):b, and a:s:b with a negative step s
        # ends at b-2 (mathjs/lib/esm/expression/transform/index.transform.js).
        # mathjs fills an open start with 1 in both apps, so it becomes 0.
        start = _minus(parts[0], 1) if _significant(parts[0]) else "0"
        rest = [_text(p) for p in parts[1:]]
        if len(parts) == 3:
            step = _text(parts[1]).strip()
            if not _NUMBER.fullmatch(step):
                self.problems.append("a range with a non-numeric step")
            elif Decimal(step) < 0 and _significant(parts[2]):
                rest[1] = _minus(parts[2], 2)
        return _join([start, *rest], colons)

    def shift(self, latex: str) -> str:
        tokens = _tokens(latex)
        closes = _matching_closes(tokens)
        out: list[str] = []
        i = 0
        previous: _Token | None = None
        before: _Token | None = None
        while i < len(tokens):
            token = tokens[i]
            close = closes.get(i)
            if close is None:
                out.append(token.text)
            elif _is_index_opener(token) and _precedes_index(previous, before):
                dims, commas = _split_top_level(tokens[i + 1 : close], ",")
                out.append(token.text)
                out.append(_join([self.dimension(d) for d in dims], commas))
                out.append(tokens[close].text)
                i = close
            else:
                inner = tokens[i + 1 : close]
                out.append(token.text)
                out.append(self.shift(_text(inner)))
                out.append(tokens[close].text)
                if token.text == "{" and previous is not None and _unwraps(previous):
                    # math3d-next drops these braces, so what precedes a
                    # following bracket is the group's last token.
                    last = (_significant(inner) or [previous])[-1]
                    if last.kind == "word" and previous.kind == "word":
                        # x_{12} is the name x_12, not the number 12.
                        last = _Token("word", previous.text + last.text)
                    previous = last
                    i = close + 1
                    continue
                i = close
            if tokens[i].kind != "space":
                before, previous = previous, tokens[i]
            i += 1
        return "".join(out)


def _unwraps(token: _Token) -> bool:
    """Whether a brace group after ``token`` loses its braces in math3d-next's
    parser: subscripts and \\operatorname / \\mathrm."""
    # "_" is a word character, so "x_" is one token.
    return (token.kind == "word" and token.text.endswith("_")) or (
        token.kind == "command" and token.text in ("\\operatorname", "\\mathrm")
    )


def _matching_closes(tokens: list[_Token]) -> dict[int, int]:
    """Map each matched opener's index to its closer's."""
    closes: dict[int, int] = {}
    stack: list[int] = []
    for i, token in enumerate(tokens):
        if token.kind == "open":
            stack.append(i)
        elif token.kind == "close" and stack:
            closes[stack.pop()] = i
    return closes


def _depth(latex: str) -> int:
    depth = deepest = 0
    for token in _tokens(latex):
        if token.kind == "open":
            depth += 1
            deepest = max(deepest, depth)
        elif token.kind == "close":
            depth = max(depth - 1, 0)
    return deepest


def shift_indices(latex: str) -> tuple[str, list[str]]:
    """Return ``latex`` with each array index shifted to 0-based, and a
    description of each index left unshifted."""
    if _depth(latex) > MAX_DEPTH:
        return latex, [f"brackets nested more than {MAX_DEPTH} deep"]
    shifter = _Shifter()
    return shifter.shift(latex), shifter.problems
