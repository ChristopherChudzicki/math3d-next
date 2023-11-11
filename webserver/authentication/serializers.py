from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers

from authentication.models import CustomUser


@extend_schema_serializer(component_name="User")
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("id", "email", "public_nickname")
        read_only_fields = ("id", "email")
