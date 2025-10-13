from main.settings import *  # noqa: F403

DATABASES["default"] = {  # noqa: F405
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": "mydatabase",
}

SECRET_KEY = "not-so-secret-in-tests"  # pragma: allowlist secret
