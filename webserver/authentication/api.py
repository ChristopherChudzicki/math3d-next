from typing import cast

from allauth.account.models import EmailAddress
from django.http import HttpRequest
from django.middleware.csrf import get_token
from ninja import Router, Schema, Status

from authentication.models import CustomUser
from main.ninja_auth import session_auth, staff_auth

router = Router()


class UserSchema(Schema):
    id: int
    email: str
    public_nickname: str  # snake_case on the wire, intentionally


class UserUpdateSchema(Schema):
    # public_nickname is the only writable field (v0: id/email read-only).
    public_nickname: str


class DeleteAccountSchema(Schema):
    current_password: str


class DeleteAccountError(Schema):
    current_password: list[str]


class ActivationSchema(Schema):
    # Deliberately a plain str, not EmailStr: avoids adding the email-validator
    # dependency for this admin-only endpoint. Malformed input falls through to
    # the 404 path (a documented relaxation of v0's EmailField 400).
    email: str


@router.get("/users/me/", response={200: UserSchema, 403: None}, auth=None)
def get_me(request: HttpRequest):
    # Seed the csrftoken cookie BEFORE the auth gate. The SPA relies on this GET
    # to obtain a CSRF token, and anonymous users need it most (to log in / sign
    # up / reset). Mirrors v0's @ensure_csrf_cookie, which set the cookie even on
    # the anonymous 403. With auth=session_auth the handler body never runs for
    # anonymous requests, so we seed here and gate manually (403, matching the
    # prior SessionAuth-rejection status the SPA already handles).
    get_token(request)
    if not request.user.is_authenticated:
        return Status(403, None)
    return Status(200, request.user)


@router.patch("/users/me/", response=UserSchema, auth=session_auth)
def patch_me(request: HttpRequest, payload: UserUpdateSchema):
    # Narrow for mypy: django-stubs types request.user as AbstractBaseUser |
    # AnonymousUser, neither of which has .public_nickname. Auth guarantees a
    # real authenticated CustomUser here.
    user = cast(CustomUser, request.user)
    user.public_nickname = payload.public_nickname
    user.save()
    return user


@router.post(
    "/users/me/delete/",
    response={204: None, 400: DeleteAccountError},
    auth=session_auth,
)
def delete_me(request: HttpRequest, payload: DeleteAccountSchema):
    user = cast(CustomUser, request.user)
    if not user.check_password(payload.current_password):
        return Status(400, {"current_password": ["Invalid password."]})
    user.delete()
    request.session.flush()
    return Status(204, None)


@router.post("/users/activation/", response={204: None, 404: None}, auth=staff_auth)
def activate(request: HttpRequest, payload: ActivationSchema):
    try:
        target = CustomUser.objects.get(email=payload.email)
    except CustomUser.DoesNotExist:
        return Status(404, None)  # empty body, matches v0

    target.is_active = True
    target.save()
    EmailAddress.objects.update_or_create(
        user=target,
        email=target.email,
        defaults={"verified": True, "primary": True},
    )
    return Status(204, None)
