from django.urls import include, path
from rest_framework.routers import DefaultRouter

from scenes.views import ScenesView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r"scenes", ScenesView, basename="")

urlpatterns = [
    path("", include(router.urls)),
]
