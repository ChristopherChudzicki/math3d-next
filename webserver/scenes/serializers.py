from rest_framework import serializers

from scenes.models import Scene


class SceneSerializer(serializers.ModelSerializer):
    itemOrder = serializers.JSONField(source="item_order")

    class Meta:
        model = Scene
        fields = ["items", "itemOrder", "title", "key"]
