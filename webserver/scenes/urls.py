from django.urls import path
from scenes.views import SceneListView

urlpatterns = [
    path('api', SceneListView.as_view()),
]