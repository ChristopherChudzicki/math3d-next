"""main URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from allauth.socialaccount.providers.google.provider import GoogleProvider
from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns
from django.conf import settings
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import include, path

from main.api import api
from main.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", health),
    path("v1/", api.urls),
    path("_allauth/", include("allauth.headless.urls")),
    # Google's login and callback views only: allauth.urls and google.urls also
    # mount the CSRF-exempt google/login/token/. Takes allauth's class, whose
    # package holds the views (ADR-0004).
    path("_allauth/", include(default_urlpatterns(GoogleProvider))),
]

if "allauth.socialaccount.providers.dummy" in settings.INSTALLED_APPS:
    urlpatterns.append(
        path("_allauth/", include("allauth.socialaccount.providers.dummy.urls"))
    )

urlpatterns.append(path("", lambda request: HttpResponseRedirect("/v1/docs")))
