
from authentication.models import CustomUser
from django.conf import settings
from django.http import HttpRequest
from ninja.security import SessionAuth


class StaffSessionAuth(SessionAuth):
    """Session auth that additionally requires is_staff (matches DRF IsAdminUser)."""

    def authenticate(
        self, request: HttpRequest, key: str | None
    ) -> CustomUser | None:
        user = request.user
        if user.is_authenticated and user.is_staff:
            return user  # type: ignore[return-value]
        return None


# django-ninja's cookie auth runs its own CSRF check, instantiating
# CsrfViewMiddleware directly (ninja/security/apikey.py) rather than reading
# MIDDLEWARE, so settings.py dropping the middleware never reaches these views.
session_auth = SessionAuth(csrf=not settings.DISABLE_CSRF)
staff_auth = StaffSessionAuth(csrf=not settings.DISABLE_CSRF)
