# MathItems Dataclasses

This module is auto-generated via [`jtd-codgen`](https://jsontypedef.com/docs/python-codegen/). 

Prerequisites (MacOS):
- Install [`jtd-codgen`](https://jsontypedef.com/docs/jtd-codegen/#installing-jtd-codegen)
- Install `yq` via `brew install yq`

Then manually generate the dataclass file:
```sh
yq -o=json eval packages/mathitem-configs/src/schema.jtd.yaml |  jtd-codegen - --root-name MathItems --python-out webserver/scenes/math_items
```

**Note:** Dependency installation is not currently managed (e.g., by Docker). This is not ideal, but these dataclasses should be irrelevant after the legacy data migration.