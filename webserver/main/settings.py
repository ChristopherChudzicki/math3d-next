"""
Django settings for main project.

Generated by 'django-admin startproject' using Django 4.1.6.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

import os
from pathlib import Path
import logging

import dj_database_url
import environ


logger = logging.getLogger(__name__)

env = environ.Env(
    CORS_ALLOWED_ORIGINS=(list, []),
    AWS_SES_ACCESS_KEY_ID=(str, ""),
    AWS_SES_SECRET_ACCESS_KEY=(str, ""),
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-g4fiiz=+pm)76t@vm1l0694kpcm5t1yb#5k2lb_l6uyn7fd$dk"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS: list[str] = []

SITE_NAME = "Math3d"

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "authentication",
    "djoser",
    "corsheaders",
    "drf_spectacular",
    ## Custom apps
    "main",
    "scenes",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.TokenAuthentication",
    ),
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")

ROOT_URLCONF = "main.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "main.wsgi.application"

##################################################
# Start auth settings
##################################################
DJOSER = {
    "LOGIN_FIELD": "email",
    # Send notifications / confirmations
    "SEND_ACTIVATION_EMAIL": True,
    "SEND_CONFIRMATION_EMAIL": True,
    "PASSWORD_CHANGED_EMAIL_CONFIRMATION": True,
    "USERNAME_CHANGED_EMAIL_CONFIRMATION": True,
    # Require retyping password
    "USER_CREATE_PASSWORD_RETYPE": True,
    "SET_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_RETYPE": True,
    # Emails
    "EMAIL": {
        "activation": "authentication.email.ActivationEmail",
        "confirmation": "authentication.email.ConfirmationEmail",
        "password_reset": "authentication.email.PasswordResetEmail",
        "password_changed_confirmation": "authentication.email.PasswordChangedConfirmationEmail",
        "username_changed_confirmation": "authentication.email.UsernameChangedConfirmationEmail",
        "username_reset": "authentication.email.UsernameResetEmail",
    },
    # Limit endpoints we don't want to just admin users.
    # Not ideal, but it's the best solution for now.
    # See https://github.com/sunscrapers/djoser/issues/549
    "PERMISSIONS": {
        # 'activation': ['rest_framework.permissions.AllowAny'],
        # 'password_reset': ['rest_framework.permissions.AllowAny'],
        # 'password_reset_confirm': ['rest_framework.permissions.AllowAny'],
        # 'set_password': ['djoser.permissions.CurrentUserOrAdmin'],
        "username_reset": ["rest_framework.permissions.IsAdminUser"],
        "username_reset_confirm": ["rest_framework.permissions.IsAdminUser"],
        "set_username": ["rest_framework.permissions.IsAdminUser"],
        # 'user_create': ['rest_framework.permissions.AllowAny'],
        # 'user_delete': ['djoser.permissions.CurrentUserOrAdmin'],
        # 'user': ['djoser.permissions.CurrentUserOrAdmin'],
        "user_list": ["rest_framework.permissions.IsAdminUser"],
        # 'token_create': ['rest_framework.permissions.AllowAny'],
        # 'token_destroy': ['rest_framework.permissions.IsAuthenticated'],
    },
    "SERIALIZERS": {
        "user": "authentication.serializers.CustomUserSerializer",
        "current_user": "authentication.serializers.CustomUserSerializer",
    },
    "_CUSTOM": {
        "ACTIVATION_URL": "http://localhost:3000/auth/activate-account?uid={uid}&token={token}",
        "PASSWORD_RESET_CONFIRM_URL": "http://localhost:3000/auth/reset-password/confirm/?uid={uid}&token={token}",  # pragma: allowlist secret
    },
}

##################################################
# End auth settings
##################################################

# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get(
            "DATABASE_URL",
            f"sqlite:///{os.path.join(BASE_DIR, 'db.sqlite3')}",
        )
    )
}


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 9,
        },
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTH_USER_MODEL = "authentication.CustomUser"

AWS_SES_ACCESS_KEY_ID = env("AWS_SES_ACCESS_KEY_ID")
AWS_SES_SECRET_ACCESS_KEY = env("AWS_SES_SECRET_ACCESS_KEY")
if AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY:
    EMAIL_BACKEND = "django_ses.SESBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    logger.warning(f"Email backend: {EMAIL_BACKEND}")


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SPECTACULAR_SETTINGS = {
    "TITLE": "Math3d API",
    "DESCRIPTION": "Math3d API",
    "VERSION": "0.0.1",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_URLCONF": "main.urls",
    "ENUM_GENERATE_CHOICE_DESCRIPTION": True,
    "COMPONENT_SPLIT_REQUEST": True,
}

# Configure Django App for Heroku.
if os.environ.get("IS_HEROKU"):
    import django_heroku  # type: ignore

    django_heroku.settings(locals())
