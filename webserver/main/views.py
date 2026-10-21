import sentry_sdk
from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_safe


@require_safe
def health(request: HttpRequest) -> JsonResponse:
    """Unversioned healthcheck for uptime monitors and post-deploy smoke checks.

    Deliberately a plain Django view rather than a ninja route: it is operational
    surface, not product API, so it stays out of openapi.v1.yaml and the generated
    clients, and its URL is stable across API versions.
    """
    return JsonResponse({"status": "ok", "version": settings.APP_VERSION})


def server_error(request: HttpRequest) -> JsonResponse:
    """Django's ``handler500``: JSON the SPA can read, naming the Sentry event.

    Sentry's Django integration has already captured the exception when this
    runs, so the frontend can tag its own event with the backend's.
    """
    return JsonResponse(
        {
            "detail": "Internal server error.",
            "sentry_event_id": sentry_sdk.last_event_id(),
        },
        status=500,
    )
