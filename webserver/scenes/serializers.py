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
    author: int | None = serializers.SlugRelatedField(  # type: ignore[assignment]
        slug_field="id", read_only=True, allow_null=True
    )
    createdDate = serializers.DateTimeField(source="created_date", read_only=True)
    modifiedDate = serializers.DateTimeField(source="modified_date", read_only=True)

    class Meta:
        model = Scene
        fields = [
            "items",
            "itemOrder",
            "title",
            "key",
            "author",
            "createdDate",
            "modifiedDate",
            "archived",
        ]

        read_only_fields = ["key"]


class SceneCreateSerializer(SceneSerializer):
    author = serializers.HiddenField(  # type: ignore[assignment]
        default=CurrentUserDefaultOrNone(), allow_null=True, required=False
    )


class MiniSceneSerializer(serializers.ModelSerializer):
    createdDate = serializers.DateTimeField(source="created_date", read_only=True)
    modifiedDate = serializers.DateTimeField(source="modified_date", read_only=True)

    class Meta:
        model = Scene
        fields = ["title", "key", "author", "createdDate", "modifiedDate", "archived"]
