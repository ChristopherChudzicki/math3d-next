from scenes.models import LegacyScene

DEFAULT_FOLDERS = {
    "cameraFolder": {
        "isCollapsed": True,
        "isDropDisabled": True,
        "isDragDisabled": True,
        "description": "Camera Controls",
    },
    "axes": {
        "isCollapsed": False,
        "isDropDisabled": True,
        "isDragDisabled": True,
        "description": "Axes and Grids",
    },
    "mainFolder": {"description": "A Folder"},
}

SORTABLE_TREE_FIXED_POSITION = {
    "setup": ["cameraFolder", "axes"],
    "cameraFolder": ["camera"],
    "axes": ["axis-x", "axis-y", "axis-z", "grid-xy", "grid-yz", "grid-zx"],
}


def set_defaults(scene: LegacyScene):
    folders = scene.dehydrated.get("folders", {})
    symbols = scene.dehydrated.get("mathSymbols", {})

    scene.dehydrated["folders"] = {
        **DEFAULT_FOLDERS,
        **folders,
    }

    scene.dehydrated["sortableTree"] = {
        **SORTABLE_TREE_FIXED_POSITION,
        **scene.dehydrated["sortableTree"],
    }

    scene.dehydrated["mathSymbols"] = symbols
