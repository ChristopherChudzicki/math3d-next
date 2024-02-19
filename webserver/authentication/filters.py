from authentication.models import CustomUser
from django_filters import CharFilter, FilterSet


class CustomUserFilterSet(FilterSet):
    email = CharFilter(field_name="email")

    class Meta:
        model = CustomUser
        fields = ["email"]
