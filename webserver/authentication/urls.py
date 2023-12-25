from django.urls import include, path
from authentication.views import CustomUserViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("users", CustomUserViewSet)

urlpatterns = [
    *router.urls,
    path("", include("djoser.urls.authtoken")),
]
