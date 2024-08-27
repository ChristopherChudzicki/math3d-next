from djoser.views import UserViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema
from authentication.serializers import CustomUserSerializer
from authentication.models import CustomUser
from authentication.email import PasswordResetInactiveEmail
from rest_framework.decorators import action
from djoser.compat import get_user_email
from rest_framework.response import Response
from rest_framework import status, permissions
from django_filters import rest_framework as filters
from authentication.filters import CustomUserFilterSet
import logging

logger = logging.getLogger(__name__)


@extend_schema_view(
    create=extend_schema(responses={(201, "application/json"): CustomUserSerializer})
)
class CustomUserViewSet(UserViewSet):
    """
    A version of Djoser's UserViewSet with some actions removed.
    """

    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = CustomUserFilterSet

    def set_username(self):
        pass

    def reset_username(self):
        pass

    def reset_username_confirm(self):
        pass

    @action(["post"], detail=False)
    def reset_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user(is_active=False)
        if user and not user.is_active:
            context = {"user": user}
            to = [get_user_email(user)]
            PasswordResetInactiveEmail(self.request, context).send(to)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().reset_password(request, *args, **kwargs)

    @extend_schema(
        responses={(204, "application/json"): None},
        request=None,
        operation_id="activate_other",
    )
    @action(
        ["post"],
        detail=True,
        url_path="activation",
        permission_classes=[permissions.IsAdminUser],
    )
    def activate_other(self, request, *args, **kwargs):
        """
        Activate a user. Intended for admin use only, primarily in the e2e tests.
        """
        target = CustomUser.objects.get(pk=kwargs["id"])
        target.is_active = True
        target.is_admin = True
        target.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
