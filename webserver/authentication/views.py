from djoser.views import UserViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema
from authentication.serializers import CustomUserSerializer
from authentication.email import PasswordResetInactiveEmail
from rest_framework.decorators import action
from djoser.compat import get_user_email
from rest_framework.response import Response
from rest_framework import status


@extend_schema_view(
    create=extend_schema(responses={(201, "application/json"): CustomUserSerializer})
)
class CustomUserViewSet(UserViewSet):
    """
    A version of Djoser's UserViewSet with some actions removed.
    """

    def set_username():
        pass

    def reset_username():
        pass

    def reset_username_confirm():
        pass

    @action(["post"], detail=False)
    def reset_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.get_user(is_active=False)
        if not user.is_active:
            context = {"user": user}
            to = [get_user_email(user)]
            PasswordResetInactiveEmail(self.request, context).send(to)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return super().reset_password(request, *args, **kwargs)
