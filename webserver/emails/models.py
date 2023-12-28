from django.db import models


# Create your models here.
class EmailDeliveries(models.Model):
    email = models.EmailField(unique=True)
    bounces = models.PositiveIntegerField(default=0)
    complaints = models.PositiveIntegerField(default=0)
    last_bounce = models.DateTimeField(null=True)
