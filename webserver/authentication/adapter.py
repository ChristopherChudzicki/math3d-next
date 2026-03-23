from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return settings.ENABLE_REGISTRATION

    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        user.public_nickname = form.cleaned_data.get("public_nickname", "")
        if commit:
            user.save()
        return user
