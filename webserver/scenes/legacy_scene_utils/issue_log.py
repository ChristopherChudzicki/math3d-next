from dataclasses import dataclass
from enum import Enum


# class syntax
class Severity(Enum):
    INFO = 0
    WARNING = 1
    ERROR = 2


@dataclass
class Issue:
    message: str
    severity: Severity
    # Legacy properties the translator dropped: it doesn't fully understand
    # the scene.
    ignored_properties: bool = False


class IssueLog:
    def __init__(self, prefix=""):
        self.prefix = prefix
        self._issues: list[Issue] = []

    def set_prefix(self, prefix: str):
        self.prefix = prefix

    def _add(self, message, severity, ignored_properties=False):
        self._issues.append(
            Issue(f"{self.prefix}: {message}", severity, ignored_properties)
        )

    def info(self, message):
        self._add(message, Severity.INFO)

    def warning(self, message):
        self._add(message, Severity.WARNING)

    def ignored_properties(self, message):
        self._add(message, Severity.WARNING, ignored_properties=True)

    def error(self, message):
        self._add(message, Severity.ERROR)

    def issues(self):
        return [issue for issue in self._issues]
