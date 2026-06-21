import logging

from allauth.account.models import EmailAddress
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import CustomUser
from authentication.serializers import CustomUserSerializer

logger = logging.getLogger(__name__)


class DeleteAccountSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class UserMeView(APIView):
    """GET and PATCH the current user's profile."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=CustomUserSerializer)
    def get(self, request: Request) -> Response:
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(request=CustomUserSerializer, responses=CustomUserSerializer)
    def patch(self, request: Request) -> Response:
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class DeleteAccountView(APIView):
    """Delete the current user's account (requires the current password).

    Modeled as a POST action rather than DELETE-with-body: drf-spectacular only
    emits request bodies for PUT/PATCH/POST, and per HTTP semantics a DELETE
    payload "has no defined semantics" (RFC 9110). A POST keeps the password
    requirement fully described by the OpenAPI spec and generated client.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=DeleteAccountSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(
            serializer.validated_data["current_password"]
        ):
            return Response(
                {"current_password": ["Invalid password."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.delete()
        request.session.flush()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminActivateView(APIView):
    """Admin-only endpoint to activate a user and mark their email as verified."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAdminUser]

    class ActivateSerializer(serializers.Serializer):
        email = serializers.EmailField(required=True)

    @extend_schema(request=ActivateSerializer, responses={204: None, 404: None})
    def post(self, request: Request) -> Response:
        serializer = self.ActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            target = CustomUser.objects.get(email=serializer.validated_data["email"])
        except CustomUser.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        target.is_active = True
        target.save()

        # Mark email as verified in allauth's EmailAddress table. Keyed on
        # (user, email); this assumes email is immutable (there is no
        # email-change flow). If one is ever added, key on user alone to avoid
        # leaving a stale primary EmailAddress row.
        EmailAddress.objects.update_or_create(
            user=target,
            email=target.email,
            defaults={"verified": True, "primary": True},
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
