from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return settings.ENABLE_REGISTRATION


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def list_apps(self, request, provider=None, client_id=None):
        """Serve provider apps from settings only.

        A SocialApp row — which allauth lets any staff user add through the
        admin — makes get_app raise MultipleObjectsReturned and 500s every
        sign-in. Settings-backed apps are unsaved, so `pk is None` selects them.
        """
        apps = super().list_apps(request, provider=provider, client_id=client_id)
        return [app for app in apps if app.pk is None]
