from django.contrib import admin

from scenes import models

admin.site.register(models.LegacyScene)
admin.site.register(models.Scene)
