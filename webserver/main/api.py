from django.http import HttpRequest
from ninja import NinjaAPI
from ninja.errors import AuthenticationError, ValidationError

api = NinjaAPI(
    title="Math3d API",
    version="1.0.0",
    urls_namespace="v1",
    # Top-level tag metadata. django-ninja only emits tag *names* on operations
    # (via add_router(tags=...) below); the descriptions/grouping order come from
    # this list. The allauth link is a markdown link in the description because
    # Swagger UI (this API's /v1/docs) renders markdown in tag descriptions
    # reliably, whereas its support for tag-level `externalDocs` is spotty.
    openapi_extra={
        "tags": [
            {
                "name": "Scenes",
                "description": "Saved 3D scenes: create, read, update, and delete.",
            },
            {
                "name": "Auth",
                "description": (
                    "Current-user profile and account management. Authentication "
                    "*flows* — login, signup, email verification, and password "
                    "reset — are served by the separate allauth headless API; see "
                    "its [interactive API docs](/_allauth/openapi.html)."
                ),
            },
            {
                "name": "Legacy Scenes",
                "description": (
                    "Legacy v0-format scenes (`dehydrated` blobs), retained for "
                    "backward compatibility. Prefer **Scenes** for new work."
                ),
            },
        ]
    },
)


@api.exception_handler(AuthenticationError)
def on_authentication_error(request: HttpRequest, exc: AuthenticationError):
    # v0 parity: session/cookie auth cannot send a compliant WWW-Authenticate
    # challenge, so we return 403 (not Ninja's default 401), matching DRF.
    return api.create_response(request, {"detail": "Forbidden."}, status=403)


@api.exception_handler(ValidationError)
def on_validation_error(request: HttpRequest, exc: ValidationError):
    # Ninja's default is 422; map to 400 for status-parity with DRF. The body
    # shape ({"detail": [...]}) is NOT v0-matched (like the 405 body, a documented
    # divergence; the FE adapts in #1125). The body shape is pinned by
    # test_validation_error_maps_to_400_detail_body in main/api_test.py.
    return api.create_response(request, {"detail": exc.errors}, status=400)


from authentication.api import router as auth_router  # noqa: E402
from scenes.api import legacy_router, scenes_router  # noqa: E402

api.add_router("/auth", auth_router, tags=["Auth"])
api.add_router("/scenes", scenes_router, tags=["Scenes"])
api.add_router("/legacy_scenes", legacy_router, tags=["Legacy Scenes"])
