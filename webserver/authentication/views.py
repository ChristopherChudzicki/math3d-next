from djoser.views import UserViewSet
from drf_spectacular.utils import extend_schema_view, extend_schema
from authentication.serializers import CustomUserSerializer


@extend_schema_view(
    create=extend_schema(responses={(201, "application/json"): CustomUserSerializer})
)
class CustomUserViewSet(UserViewSet):
    """
    A version of Djoser's UserViewSet with some actions removed.
    """

    def set_username():
        pass

    def reset_username():
        pass

    def reset_username_confirm():
        pass
