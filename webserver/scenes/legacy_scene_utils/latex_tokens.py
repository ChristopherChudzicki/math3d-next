"""Regular expressions shared by the translator's LaTeX rewrites."""

import re

# `other` consumes escapes such as `\{` and `\,` whole, so they don't count as
# brackets or commas.
TOKEN = re.compile(
    r"""
    (?P<open>\\left(?![A-Za-z])(?:\\[A-Za-z]+|\\.|.)|[(\[{])
    | (?P<close>\\right(?![A-Za-z])(?:\\[A-Za-z]+|\\.|.)|[)\]}])
    | (?P<comma>,)
    | (?P<other>\\[A-Za-z]+|\\.|.)
    """,
    re.VERBOSE | re.DOTALL,
)

NAME = re.compile(r"(?:[A-Za-z][A-Za-z0-9]*|\\[A-Za-z]+)(?:_\{\w+\}|_\w+)?")

# Leading or trailing spaces.
SPACE = re.compile(r"^(?:\s|\\ )+|(?:\s|\\ )+$")
