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
