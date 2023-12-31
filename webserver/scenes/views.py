from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from scenes.models import Scene
from scenes.serializers import SceneSerializer, MiniSceneSerializer
from scenes.permissions import ScenePermissions
from scenes.filters import SceneFilterSet
from django_filters import rest_framework as filters


# Create your views here.
class ScenesView(viewsets.ModelViewSet):
    pagination_class = LimitOffsetPagination

    queryset = Scene.objects.all()

    serializer_class = SceneSerializer

    lookup_field = "key"

    permission_classes = [ScenePermissions]
    http_method_names = ["get", "post", "head", "patch", "delete"]

    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = SceneFilterSet

    def get_serializer_class(self):
        LIST_ACTIONS = ["list", "me"]
        if self.action in LIST_ACTIONS:
            return MiniSceneSerializer
        else:
            return self.serializer_class

    @extend_schema(responses=MiniSceneSerializer(many=True))
    @action(methods=["GET"], detail=False, name="My Scenes")
    def me(self, request: Request) -> Response:  # noqa: ARG002
        queryset = self.queryset.filter(author_id=self.request.user.id)
        filtered_queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(filtered_queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
