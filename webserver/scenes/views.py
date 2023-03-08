from rest_framework.views import APIView
from django.shortcuts import render
from scenes.models import Scene
from scenes.serializers import SceneSerializer
from rest_framework.response import Response
from rest_framework import status

# Create your views here.
class SceneListView(APIView):

    def get(self, request, *args, **kwargs):
        '''
        List all scenes.
        '''
        todos = Scene.objects.all()
        serializer = SceneSerializer(todos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)