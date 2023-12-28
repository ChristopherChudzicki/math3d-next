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
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

import authentication.urls
import scenes.urls
import emails.urls

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v0/", include(scenes.urls)),
    path("v0/auth/", include(authentication.urls)),
    path("v0/", include(emails.urls)),
    path("", lambda request: HttpResponseRedirect("/v0/schema/swagger")),
    path("v0/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "v0/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
