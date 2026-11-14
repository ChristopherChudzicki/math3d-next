from django.db import migrations, transaction

# The live matcher: a fresh database has no owned scenes when this runs.
from scenes.legacy_scene_utils.strip_mod import rewrite_color_mod

BATCH_SIZE = 1000

COLOR_MAPPED_SURFACES = {
    "EXPLICIT_SURFACE",
    "EXPLICIT_SURFACE_POLAR",
    "PARAMETRIC_SURFACE",
}


def strip_color_mods(items: list) -> bool:
    """Rewrites each surface's outer color ``mod`` that the Wrap setting draws
    the same (``rewrite_color_mod``)."""
    changed = False
    for item in items:
        props = item.get("properties", {})
        color_expr = props.get("colorExpr")
        if item.get("type") not in COLOR_MAPPED_SURFACES or not color_expr:
            continue
        # An expression for wrapColors is the user's to keep.
        if props.get("wrapColors", "false") not in ("false", "true"):
            continue
        rewrite = rewrite_color_mod(color_expr.get("rhs", ""))
        if rewrite is None:
            continue
        color_expr["rhs"] = rewrite.rhs
        if rewrite.wraps:
            props["wrapColors"] = "true"
        changed = True
    return changed


def forward(apps, schema_editor):
    # Legacy rows are re-translated on read, and the translator strips. Each
    # batch is read under lock in its own transaction (atomic = False), so a
    # save can't land between the read and the write, and locks are brief.
    Scene = apps.get_model("scenes", "Scene")
    last_pk = 0
    while True:
        with transaction.atomic():
            batch = list(
                Scene.objects.select_for_update()
                .filter(pk__gt=last_pk, is_legacy=False)
                .order_by("pk")
                .only("pk", "items")[:BATCH_SIZE]
            )
            if not batch:
                return
            changed = [scene for scene in batch if strip_color_mods(scene.items)]
            Scene.objects.bulk_update(changed, ["items"])
        last_pk = batch[-1].pk


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("scenes", "0027_mark_legacy_translations"),
    ]

    # Reversing leaves the data as is: which spelling of `mod` each expression
    # had is gone.
    operations = [
        migrations.RunPython(forward, migrations.RunPython.noop),
    ]
