from typing import Any

DEFAULT_FOLDERS: dict[str, dict[str, Any]] = {
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

    # Saved built-in folders are diffs against these defaults; merge per property.
    dehydrated["folders"] = {
        **folders,
        **{
            folder_id: {**defaults, **folders.get(folder_id, {})}
            for folder_id, defaults in DEFAULT_FOLDERS.items()
        },
    }

    dehydrated["sortableTree"] = {
        **SORTABLE_TREE_FIXED_POSITION,
        **dehydrated["sortableTree"],
    }

    dehydrated["mathSymbols"] = symbols
