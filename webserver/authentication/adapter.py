from urllib.parse import urlparse, urlunparse

from allauth.account.adapter import DefaultAccountAdapter
from allauth.headless.adapter import DefaultHeadlessAdapter
from django.conf import settings


class CustomHeadlessAdapter(DefaultHeadlessAdapter):
    def get_frontend_url(self, urlname: str, **kwargs) -> str | None:
        """
        Build email links from the requesting origin when it is CSRF-trusted,
        falling back to the configured HEADLESS_FRONTEND_URLS origin.

        One backend serves multiple trusted frontends locally (git worktrees
        on alternate ports); activation/reset links should point back at the
        frontend that initiated the request. In production
        CSRF_TRUSTED_ORIGINS == [APP_BASE_URL] exactly (see settings_test.py),
        so this can never swap in a non-canonical origin there.
        """
        url = super().get_frontend_url(urlname, **kwargs)
        origin = self.request.headers.get("Origin") if url else None
        if origin and origin in settings.CSRF_TRUSTED_ORIGINS:
            parsed_origin = urlparse(origin)
            url = urlunparse(
                urlparse(url)._replace(
                    scheme=parsed_origin.scheme, netloc=parsed_origin.netloc
                )
            )
        return url


class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return settings.ENABLE_REGISTRATION

    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        user.public_nickname = form.cleaned_data.get("public_nickname", "")
        if commit:
            user.save()
        return user
