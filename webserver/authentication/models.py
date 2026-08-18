from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy

from authentication.managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    public_nickname = models.CharField(max_length=64)
    email = models.EmailField(gettext_lazy("email address"), unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["public_nickname"]

    objects: CustomUserManager = CustomUserManager()

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "User"


# Read off the field so the API schema and the signup form cannot drift from
# the column: an over-length value that reaches the DB raises DataError (a 500)
# rather than a validation error.
NICKNAME_MAX_LENGTH = CustomUser._meta.get_field("public_nickname").max_length
