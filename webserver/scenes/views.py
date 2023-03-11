from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from scenes.models import Scene
from scenes.serializers import SceneSerializer


# Create your views here.
class SceneListView(APIView):
    def get(self, request, *args, **kwargs):
        """
        List all scenes.
        """
        todos = Scene.objects.all()
        serializer = SceneSerializer(todos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
