from allauth.socialaccount.providers.google.provider import (
    GoogleProvider as AllauthGoogleProvider,
)


class GoogleProvider(AllauthGoogleProvider):
    """Google through the redirect flow only; `provider/token` refuses it (ADR-0004)."""

    supports_token_authentication = False
    # Where allauth finds this provider's views, which stay allauth's own.
    package = "allauth.socialaccount.providers.google"
