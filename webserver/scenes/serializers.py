from rest_framework import serializers

from scenes.models import Scene


class CurrentUserDefaultOrNone:
    """
    May be applied as a `default=...` value on a serializer field.
    Returns None if user is anonymous, else user.
    """

    requires_context = True

    def __call__(self, serializer_field):
        user = serializer_field.context["request"].user
        return None if user.is_anonymous else user


class SceneSerializer(serializers.ModelSerializer):
    itemOrder = serializers.JSONField(source="item_order")
    author = serializers.HiddenField(
        default=CurrentUserDefaultOrNone(), allow_null=True, required=False
    )

    class Meta:
        model = Scene
        fields = ["items", "itemOrder", "title", "key", "author"]


class MiniSceneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scene
        fields = ["title", "key"]
