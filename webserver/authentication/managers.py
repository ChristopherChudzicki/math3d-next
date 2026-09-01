from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """

    # Based on https://testdriven.io/blog/django-custom-user-model/

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a user. `password=None` yields an unusable password,
        matching every account the provider flow creates."""
        if not email:
            raise ValueError(_("The Email must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser. A password given here stays usable and
        logs in at `/admin/`: allauth's `AuthenticationBackend` checks only
        `ACCOUNT_LOGIN_METHODS` and the password hash, never `SOCIALACCOUNT_ONLY`.
        That is the break-glass path into an installation with no Google account.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)
