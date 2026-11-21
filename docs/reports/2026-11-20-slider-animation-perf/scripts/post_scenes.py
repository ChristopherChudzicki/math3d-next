"""Saves scenes from scenes.py as new legacy scenes and records their keys.

python3 scripts/post_scenes.py https://api.math3d.org [name ...]

Posts the named scenes (default: all) and, once every post has succeeded,
merges their keys into scene_keys.json. Only needed for a new or changed
scene: the keys already there work on math3d.org and next.math3d.org.
"""

import json
import sys
import urllib.request
from pathlib import Path

from scenes import SCENES

KEYS = Path(__file__).with_name("scene_keys.json")


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
    api, names = sys.argv[1].rstrip("/"), sys.argv[2:] or list(SCENES)
    posted = {name: post(api, SCENES[name]) for name in names}
    KEYS.write_text(json.dumps(json.loads(KEYS.read_text()) | posted, indent=2) + "\n")
    print(json.dumps(posted, indent=2))
