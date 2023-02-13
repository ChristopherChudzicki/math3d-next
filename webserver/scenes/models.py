from django.db import models

class LegacyScene(models.Model):
    """
    A scene that was created in the legacy system.
    """

    key = models.CharField(max_length=80, unique=True)
    times_accessed = models.IntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    dehydrated = models.JSONField()