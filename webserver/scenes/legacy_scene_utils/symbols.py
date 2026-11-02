import re


def _symbol_text(latex: str) -> str:
    """math3d-next's parser drops subscript braces and turns backslashes into
    spaces: ``x_{1}`` is the symbol ``x_1``, ``\\theta`` the symbol ``theta``."""
    return re.sub(r"_\{([^{}]*)\}", r"_\1", latex).replace("\\", " ")


def depends_on(rhs: str, param: str) -> bool:
    """Whether ``rhs`` uses the symbol ``param``."""
    symbols = re.findall(r"[A-Za-z_][A-Za-z0-9_]*", _symbol_text(rhs))
    return _symbol_text(param).strip() in symbols
