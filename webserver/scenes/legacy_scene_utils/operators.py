"""Rewrite math3d-react's vector operators, which math3d-next doesn't have.

math3d-react reads ``a|b`` as ``dot(a, b)`` and ``a\\&b`` as ``cross(a, b)``
(MathQuill stores ``&`` escaped). Like mathjs's bitwise operators, they bind
looser than arithmetic and relational operators, and ``\\&`` binds tighter
than ``|``, so an operand runs to the enclosing bracket, comma, semicolon or
assignment.

``|`` becomes ``\\cdot``, since math3d-next multiplies two vectors to their dot
product, and ``\\&`` becomes ``\\operatorname{cross}``. Expressions whose
reading is unclear are kept: an empty operand (as in ``|z|<1``), ``\\&\\&``,
logical or conditional operators, which bind looser still, and unbalanced
brackets. ``\\left|…\\right|`` is a bracket, not an operator.
"""

import re
from dataclasses import dataclass
from functools import reduce

from scenes.legacy_scene_utils.latex_tokens import NAME, SPACE, TOKEN

_DOT, _CROSS = "|", "\\&"

# react's preprocessing turns `\operatorname{and}` and `\land` into symbols,
# so only bare words reach mathjs as logical operators.
_UNCLEAR = re.compile(
    r"\\&(?:\s|\\\ )*\\&|\?|(?<![A-Za-z_\\])(?:and|or|xor)(?![A-Za-z0-9_])"
)
_NUMBER = re.compile(r"[0-9]*\.?[0-9]+")
_CALLEE = re.compile(rf"\\operatorname\{{[A-Za-z]+\}}|{NAME.pattern}")
_CALL_OPEN = frozenset({"\\left(", "\\left[", "(", "["})


@dataclass(frozen=True)
class _Group:
    open: str
    # Already rewritten, brackets included.
    text: str


type _Node = _Group | str


def _text(nodes: list[_Node]) -> str:
    return "".join(n if isinstance(n, str) else n.text for n in nodes)


def _split(nodes: list[_Node], operator: str) -> list[list[_Node]]:
    pieces: list[list[_Node]] = [[]]
    for node in nodes:
        if node == operator:
            pieces.append([])
        else:
            pieces[-1].append(node)
    return pieces


def _trim(nodes: list[_Node]) -> list[_Node]:
    start, end = 0, len(nodes)
    while start < end and not SPACE.sub("", _text(nodes[start : start + 1])):
        start += 1
    while end > start and not SPACE.sub("", _text(nodes[end - 1 : end])):
        end -= 1
    return nodes[start:end]


def _is_atom(nodes: list[_Node]) -> bool:
    """Whether ``\\cdot`` can take the operand unparenthesized: a name, number,
    bracketed group, or call."""
    text = _text(nodes)
    if NAME.fullmatch(text) or _NUMBER.fullmatch(text):
        return True
    last = nodes[-1]
    if not (isinstance(last, _Group) and last.open in _CALL_OPEN):
        return False
    callee = _text(nodes[:-1])
    return not callee or bool(_CALLEE.fullmatch(callee))


def _segment(nodes: list[_Node], kept: list[str]) -> str:
    text = _text(nodes)
    if _DOT not in nodes and _CROSS not in nodes:
        return text
    if _UNCLEAR.search("".join(n for n in nodes if isinstance(n, str))):
        kept.append(text)
        return text

    factors: list[str] = []
    for piece in _split(nodes, _DOT):
        piece = _trim(piece)
        operands = [_text(_trim(operand)) for operand in _split(piece, _CROSS)]
        if not all(operands):
            kept.append(text)
            return text
        if len(operands) > 1:
            factors.append(
                reduce(
                    lambda a, b: f"\\operatorname{{cross}}\\left({a},{b}\\right)",
                    operands,
                )
            )
        elif _is_atom(piece):
            factors.append(operands[0])
        else:
            factors.append(f"\\left({operands[0]}\\right)")
    return reduce(lambda a, b: f"{a}\\cdot{' ' if b[0].isalnum() else ''}{b}", factors)


def _is_separator(nodes: list[_Node], i: int) -> bool:
    """Whether ``nodes[i]`` ends an operand: a comma, semicolon or
    assignment."""
    if nodes[i] in (",", ";"):
        return True
    if nodes[i] != "=":
        return False
    before = nodes[i - 1] if i > 0 else None
    after = nodes[i + 1] if i + 1 < len(nodes) else None
    return before not in ("<", ">", "!", "=") and after != "="


def _render(nodes: list[_Node], kept: list[str]) -> str:
    out: list[str] = []
    start = 0
    for i in range(len(nodes)):
        if _is_separator(nodes, i):
            out += [_segment(nodes[start:i], kept), _text(nodes[i : i + 1])]
            start = i + 1
    out.append(_segment(nodes[start:], kept))
    return "".join(out)


def rewrite(latex: str) -> tuple[str, list[str]]:
    """``latex`` with ``|`` and ``\\&`` rewritten, and the expressions it
    kept."""
    if _DOT not in latex and _CROSS not in latex:
        return latex, []
    kept: list[str] = []
    # Groups are rewritten as they close, innermost first.
    levels: list[list[_Node]] = [[]]
    opens: list[str] = []
    for match in TOKEN.finditer(latex):
        if match.lastgroup == "open":
            opens.append(match.group())
            levels.append([])
        elif match.lastgroup == "close" and opens:
            body = _render(levels.pop(), kept)
            group = _Group(opens[-1], f"{opens.pop()}{body}{match.group()}")
            levels[-1].append(group)
        elif match.lastgroup == "close":
            break
        else:
            levels[-1].append(match.group())
    else:
        if not opens:
            return _render(levels[0], kept), kept
    bare = any(
        m.lastgroup == "other" and m.group() in (_DOT, _CROSS)
        for m in TOKEN.finditer(latex)
    )
    return latex, [latex] if bare else []
