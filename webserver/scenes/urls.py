from django.urls import include, path
from rest_framework.routers import DefaultRouter

from scenes.views import LegacyScenesView, ScenesView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r"scenes", ScenesView, basename="scenes")
router.register(r"legacy_scenes", LegacyScenesView, basename="legacy_scenes")

urlpatterns = [
    path("", include(router.urls)),
]
