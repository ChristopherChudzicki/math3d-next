from django.contrib import admin

import scenes.models as models

admin.site.register(models.LegacyScene)
admin.site.register(models.RenderDay)
admin.site.register(models.RenderMonth)


@admin.register(models.Scene)
class SceneAdmin(admin.ModelAdmin):
    search_fields = ["key", "title"]


@admin.register(models.ExampleScene)
class ExampleSceneAdmin(admin.ModelAdmin):
    list_display = ["position", "scene_key", "scene_title"]
    list_select_related = ["scene"]
    # Searches by key or title; a plain select would load every scene.
    autocomplete_fields = ["scene"]

    @admin.display(description="Key", ordering="scene__key")
    def scene_key(self, obj):
        return obj.scene.key

    @admin.display(description="Title", ordering="scene__title")
    def scene_title(self, obj):
        return obj.scene.title
