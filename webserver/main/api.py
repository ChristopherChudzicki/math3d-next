from django.http import HttpRequest
from ninja import NinjaAPI
from ninja.errors import AuthenticationError, ValidationError

api = NinjaAPI(title="Math3d API", version="1.0.0", urls_namespace="v1")


@api.exception_handler(AuthenticationError)
def on_authentication_error(request: HttpRequest, exc: AuthenticationError):
    # v0 parity: session/cookie auth cannot send a compliant WWW-Authenticate
    # challenge, so we return 403 (not Ninja's default 401), matching DRF.
    return api.create_response(request, {"detail": "Forbidden."}, status=403)


@api.exception_handler(ValidationError)
def on_validation_error(request: HttpRequest, exc: ValidationError):
    # Ninja's default is 422; map to 400 for status-parity with DRF. The body
    # shape ({"detail": [...]}) is NOT v0-matched (like the 405 body, a documented
    # divergence; the FE adapts in #1125). Exercised by the missing-password test
    # in Task 2; no other in-scope route asserts this body.
    return api.create_response(request, {"detail": exc.errors}, status=400)


from authentication.api import router as auth_router  # noqa: E402

api.add_router("/auth", auth_router)
