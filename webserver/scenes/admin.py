from django.contrib import admin

import scenes.models as models

admin.site.register(models.LegacyScene)
admin.site.register(models.Scene)
admin.site.register(models.RenderDay)
admin.site.register(models.RenderMonth)


@admin.register(models.ExampleScene)
class ExampleSceneAdmin(admin.ModelAdmin):
    list_display = ["position", "scene_key", "scene_title"]
    # A select would load every scene into the form.
    raw_id_fields = ["scene"]

    @admin.display(description="Key", ordering="scene__key")
    def scene_key(self, obj):
        return obj.scene.key

    @admin.display(description="Title", ordering="scene__title")
    def scene_title(self, obj):
        return obj.scene.title
