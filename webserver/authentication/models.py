from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy

from authentication.managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    public_nickname = models.CharField(max_length=64)
    email = models.EmailField(gettext_lazy("email address"), unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: CustomUserManager = CustomUserManager()

    def __str__(self):
        return self.email
