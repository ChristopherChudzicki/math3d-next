from django.urls import path

from authentication.views import AdminActivateView, UserMeView

urlpatterns = [
    path("users/me/", UserMeView.as_view(), name="user-me"),
    path(
        "users/<int:id>/activation/",
        AdminActivateView.as_view(),
        name="admin-activate",
    ),
]
