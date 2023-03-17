from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination

from scenes.models import Scene
from scenes.serializers import SceneSerializer


# Create your views here.
class ScenesView(viewsets.ReadOnlyModelViewSet):
    pagination_class = LimitOffsetPagination

    queryset = Scene.objects.all()

    serializer_class = SceneSerializer

    lookup_field = "key"
