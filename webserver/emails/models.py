from django.db import models


# Create your models here.
class EmailDeliveries(models.Model):
    email = models.EmailField(unique=True)
    bounces = models.PositiveIntegerField()
    complaints = models.PositiveIntegerField()
