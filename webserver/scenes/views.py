from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import AllowAny

from scenes.models import Scene
from scenes.serializers import SceneSerializer


# Create your views here.
class ScenesView(viewsets.ModelViewSet):
    pagination_class = LimitOffsetPagination

    queryset = Scene.objects.all()

    serializer_class = SceneSerializer

    lookup_field = "key"

    authentication_classes = []
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'head']