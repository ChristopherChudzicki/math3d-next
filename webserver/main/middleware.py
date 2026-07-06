from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponseBase


class ScopedCorsCredentialsMiddleware:
    """
    Restrict credentialed CORS to the origins in CREDENTIALED_CORS_ORIGINS.

    django-cors-headers applies CORS_ALLOW_CREDENTIALS uniformly to every
    allowed origin — it cannot grant credentials to some origins and withhold
    them from others (issue #1184). This middleware strips
    Access-Control-Allow-Credentials from responses to requests whose Origin
    is not in CREDENTIALED_CORS_ORIGINS. Other CORS origins (e.g. the legacy
    frontend) keep anonymous CORS access; browsers refuse to complete
    credentials-mode requests for them.

    Must be listed above corsheaders.middleware.CorsMiddleware: response
    middleware run bottom-up, so this one strips the header only if it runs
    after CorsMiddleware has added it.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponseBase]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponseBase:
        response = self.get_response(request)
        if request.headers.get("Origin") not in settings.CREDENTIALED_CORS_ORIGINS:
            response.headers.pop("Access-Control-Allow-Credentials", None)
        return response
