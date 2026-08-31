from typing import cast

from django.http import HttpRequest
from django.middleware.csrf import get_token
from ninja import Router, Schema, Status

from authentication.models import CustomUser
from main.ninja_auth import session_auth

router = Router()


class UserSchema(Schema):
    id: int
    email: str
    public_nickname: str  # snake_case on the wire, intentionally


@router.get("/users/me/", response={200: UserSchema, 403: None}, auth=None)
def get_me(request: HttpRequest):
    # Seed the csrftoken cookie BEFORE the auth gate. The SPA relies on this GET
    # to obtain a CSRF token, and anonymous visitors need it most (to sign in).
    # With auth=session_auth the handler body never runs for anonymous requests,
    # so we seed here and gate manually (403, which the SPA already handles).
    get_token(request)
    if not request.user.is_authenticated:
        return Status(403, None)
    return Status(200, request.user)


@router.post("/users/me/delete/", response={204: None}, auth=session_auth)
def delete_me(request: HttpRequest):
    user = cast(CustomUser, request.user)
    user.delete()
    request.session.flush()
    return Status(204, None)
