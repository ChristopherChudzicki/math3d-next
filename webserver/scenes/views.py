from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from scenes.models import Scene
from scenes.serializers import SceneSerializer
from scenes.permissions import ScenePermissions


# Create your views here.
class ScenesView(viewsets.ModelViewSet):
    pagination_class = LimitOffsetPagination

    queryset = Scene.objects.all()

    serializer_class = SceneSerializer

    lookup_field = "key"

    authentication_classes = []
    permission_classes = [ScenePermissions]
    http_method_names = ["get", "post", "head"]

    @extend_schema(responses=SceneSerializer(many=True))
    @action(methods=["GET"], detail=False, name="My Scenes")
    def me(self, request: Request) -> Response:  # noqa: ARG002
        my_queryset = self.queryset.filter(author_id=self.request.user.id)
        page = self.paginate_queryset(my_queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
