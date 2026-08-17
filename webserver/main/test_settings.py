from main.settings import *

DATABASES["default"] = {
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": "mydatabase",
}

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
