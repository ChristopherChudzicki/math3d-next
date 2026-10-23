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


def set_defaults(dehydrated: dict):
    folders = dehydrated.get("folders", {})
    symbols = dehydrated.get("mathSymbols", {})

    dehydrated["folders"] = {
        **DEFAULT_FOLDERS,
        **folders,
    }

    dehydrated["sortableTree"] = {
        **SORTABLE_TREE_FIXED_POSITION,
        **dehydrated["sortableTree"],
    }

    dehydrated["mathSymbols"] = symbols
