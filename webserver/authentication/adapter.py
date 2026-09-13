from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.internal.flows.manage_email import assess_unique_email
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.providers.base.constants import AuthProcess
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return settings.ENABLE_REGISTRATION


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    error_messages = {
        **DefaultSocialAccountAdapter.error_messages,
        "unverified_email": _(
            "%s did not supply a verified email address, so no account can be created."
        ),
    }

    def list_apps(self, request, provider=None, client_id=None):
        """Serve provider apps from settings only.

        A SocialApp row — which allauth lets any staff user add through the
        admin — makes get_app raise MultipleObjectsReturned and 500s every
        sign-in. Settings-backed apps are unsaved, so `pk is None` selects them.
        """
        apps = super().list_apps(request, provider=provider, client_id=client_id)
        return [app for app in apps if app.pk is None]

    def pre_social_login(self, request, sociallogin):
        """Enforce that an account's email is one the provider vouched for.

        allauth answers a new identity whose address is missing or already taken
        by stashing the login and offering `auth/provider/signup`, whose form
        accepts any unused address without comparing it to the provider's.
        Refusing here — before `process_signup` stashes anything — leaves that
        route nothing to resume.
        """
        if sociallogin.is_existing:
            return
        if sociallogin.state.get("process") == AuthProcess.CONNECT:
            # Linking a second identity to a signed-in account: the address is
            # taken by design, by the account doing the linking. complete_login
            # runs this hook before it branches on the process.
            return

        provider = sociallogin.provider.name
        addresses = sociallogin.email_addresses
        if not addresses or not addresses[0].verified:
            raise self.validation_error("unverified_email", provider)
        # The same predicate that would otherwise route into the signup form;
        # it also matches users who have no EmailAddress row, such as one made
        # by `createsuperuser`.
        if assess_unique_email(addresses[0].email) is not True:
            raise self.validation_error("email_taken", provider)
