from django.conf import settings
from ninja.security import SessionAuth

# django-ninja's cookie auth runs its own CSRF check, instantiating
# CsrfViewMiddleware directly (ninja/security/apikey.py) rather than reading
# MIDDLEWARE, so settings.py dropping the middleware never reaches these views.
session_auth = SessionAuth(csrf=not settings.DISABLE_CSRF)
