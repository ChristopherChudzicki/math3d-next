from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "authentication"

    def ready(self):
        from allauth.socialaccount.models import SocialApp
        from django.contrib import admin

        # CustomSocialAccountAdapter serves provider apps from settings alone,
        # so a row added through allauth's form would silently do nothing.
        # Unregistered here rather than in admin.py: autodiscover imports that
        # module before allauth's, which is what registers the model.
        admin.site.unregister(SocialApp)
