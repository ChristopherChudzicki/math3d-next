from django.urls import path

from authentication.views import AdminActivateView, DeleteAccountView, UserMeView

urlpatterns = [
    path("users/me/", UserMeView.as_view(), name="user-me"),
    path("users/me/delete/", DeleteAccountView.as_view(), name="user-me-delete"),
    path(
        "users/activation/",
        AdminActivateView.as_view(),
        name="admin-activate",
    ),
]
