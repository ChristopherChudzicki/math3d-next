from main.settings import *  # noqa: F403

DATABASES["default"] = {  # noqa: F405
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": "mydatabase",
}
