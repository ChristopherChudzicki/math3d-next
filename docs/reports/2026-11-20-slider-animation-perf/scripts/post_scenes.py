"""Saves the benchmark scenes as new legacy scenes and prints their keys.

python3 scripts/post_scenes.py https://api.math3d.org > scripts/scene_keys.json

Only needed for a new or changed scene: the keys in scene_keys.json already
work on both math3d.org and next.math3d.org. Add "sphere_colormap", an
existing scene, back by hand.
"""

import json
import sys
import urllib.request

from scenes import SCENES


def post(api: str, scene: dict) -> str:
    request = urllib.request.Request(
        f"{api}/v1/legacy_scenes/",
        data=json.dumps({"dehydrated": scene}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        return json.load(response)["key"]


if __name__ == "__main__":
    api = sys.argv[1].rstrip("/")
    print(
        json.dumps({name: post(api, scene) for name, scene in SCENES.items()}, indent=2)
    )
