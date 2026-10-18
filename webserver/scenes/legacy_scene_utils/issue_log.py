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


class IssueLog:
    def __init__(self, prefix=""):
        self.prefix = prefix
        self._issues: list[Issue] = []

    def set_prefix(self, prefix: str):
        self.prefix = prefix

    def _add(self, message, severity):
        self._issues.append(Issue(f"{self.prefix}: {message}", severity))

    def info(self, message):
        self._add(message, Severity.INFO)

    def warning(self, message):
        self._add(message, Severity.WARNING)

    def error(self, message):
        self._add(message, Severity.ERROR)

    def issues(self):
        return [issue for issue in self._issues]
