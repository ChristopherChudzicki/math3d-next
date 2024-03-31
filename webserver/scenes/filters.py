from django_filters import FilterSet, CharFilter
from scenes.models import Scene


class SceneFilterSet(FilterSet):
    title = CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model = Scene
        fields = ["title", "archived"]
