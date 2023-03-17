from rest_framework import serializers

from scenes.models import Scene


class SceneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scene
        fields = ["items", "item_order", "title", "key"]
