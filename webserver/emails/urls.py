from django_ses.views import SESEventWebhookView
from django.urls import path

urlpatterns = [
    path("ses/event-webhook/", SESEventWebhookView.as_view(), name="ses-event-webhook"),
]
