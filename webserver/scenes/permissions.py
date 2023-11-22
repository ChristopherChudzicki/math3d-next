from rest_framework import permissions


class ScenePermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action in ["list", "retrieve", "create"]:
            return True
        elif view.action in ["update", "partial_update", "destroy", "me"]:
            return request.user.is_authenticated
        else:
            return False

    def has_object_permission(self, request, view, obj):
        if view.action == "retrieve":
            return True

        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        return obj.author == request.user
