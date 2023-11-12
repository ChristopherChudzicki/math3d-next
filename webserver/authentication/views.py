from django.shortcuts import render
from django.urls import include, path

# Create your views here.

urlpatterns = [
    path("", include("djoser.urls")),
]
