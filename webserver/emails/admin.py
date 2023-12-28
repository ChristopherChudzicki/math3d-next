from django.contrib import admin

import emails.models as models

admin.site.register(models.EmailDeliveries)
