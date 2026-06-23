from typing import Optional

from django.http import HttpRequest
from ninja.security import SessionAuth

from authentication.models import CustomUser


class StaffSessionAuth(SessionAuth):
    """Session auth that additionally requires is_staff (matches DRF IsAdminUser)."""

    def authenticate(
        self, request: HttpRequest, key: Optional[str]
    ) -> Optional[CustomUser]:
        user = request.user
        if user.is_authenticated and user.is_staff:
            return user  # type: ignore[return-value]
        return None


session_auth = SessionAuth()
staff_auth = StaffSessionAuth()
