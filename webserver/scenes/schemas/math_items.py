"""Pydantic models mirroring the *serialized* frontend math-item types.

MODULE-LOAD INVARIANT: do NOT import from scenes.models or touch Django
settings / the app registry here. scenes.validators builds
MATH_ITEM_LIST_ADAPTER from these models at import time, and scenes.models
imports validate_math_items at the top, so this module is constructed while
the scenes models module is still loading. Pure Pydantic construction is safe;
a `from scenes.models import ...` here would raise AppRegistryNotReady.
"""

from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    RootModel,
    TypeAdapter,
    WithJsonSchema,
)


class MathItemType(str, Enum):
    Axis = "AXIS"
    BooleanVariable = "BOOLEAN_VARIABLE"
    Camera = "CAMERA"
    ExplicitSurface = "EXPLICIT_SURFACE"
    ExplicitSurfacePolar = "EXPLICIT_SURFACE_POLAR"
    Folder = "FOLDER"
    Grid = "GRID"
    ImplicitSurface = "IMPLICIT_SURFACE"
    Line = "LINE"
    Point = "POINT"
    ParametricCurve = "PARAMETRIC_CURVE"
    ParametricSurface = "PARAMETRIC_SURFACE"
    Variable = "VARIABLE"
    VariableSlider = "VARIABLE_SLIDER"
    Vector = "VECTOR"
    VectorField = "VECTOR_FIELD"


class _Strict(BaseModel):
    """Shared config: reject unknown keys, mirror the JTD no-extra contract."""

    model_config = ConfigDict(extra="forbid")


# --- Value models (mirror ParseableObjs in packages/parser/src/interfaces.ts;
# the optional non-serializable `validate` function field is omitted). ---


# Single-value `Literal` fields emit as JSON-schema `{const: X}`, which
# openapi-generator-cli v7.2.0 (typescript-axios) collapses to a bare `string`
# in the client — discarding the literal value the FE sync check needs. Emitting
# them as `{enum: [X], type: string}` via WithJsonSchema makes the generator
# produce a usable string-literal type instead. WithJsonSchema *replaces* the
# field schema, so `type: string` is included explicitly. (The 16 item-level
# `type` discriminants are left as bare `Literal` — the union's
# `discriminator.mapping` already intersects the literal back in, e.g.
# `({ type: "AXIS" } & AxisItem)`, so they stay usable without annotation.)


class ExprObj(_Strict):
    type: Annotated[
        Literal["expr"], WithJsonSchema({"enum": ["expr"], "type": "string"})
    ]
    expr: str


class AssignmentObj(_Strict):
    type: Annotated[
        Literal["assignment"],
        WithJsonSchema({"enum": ["assignment"], "type": "string"}),
    ]
    lhs: str
    rhs: str


class FunctionAssignmentObj(_Strict):
    type: Annotated[
        Literal["function-assignment"],
        WithJsonSchema({"enum": ["function-assignment"], "type": "string"}),
    ]
    name: str
    params: list[str]
    rhs: str


# Concrete array types (NOT a Pydantic Generic — a generic emits mangled
# parametrized $ref names into the OpenAPI/client).
class FunctionAssignmentArray(_Strict):
    type: Annotated[
        Literal["array"], WithJsonSchema({"enum": ["array"], "type": "string"})
    ]
    items: list[FunctionAssignmentObj]


class ExprArray(_Strict):
    type: Annotated[
        Literal["array"], WithJsonSchema({"enum": ["array"], "type": "string"})
    ]
    items: list[ExprObj]


class StrArray(_Strict):
    type: Annotated[
        Literal["array"], WithJsonSchema({"enum": ["array"], "type": "string"})
    ]
    items: list[str]


# --- *Properties models (one per type; mirror each frontend interface). ---


class AxisProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    label: str
    labelVisible: str
    min: str
    max: str
    axis: Literal["x", "y", "z"]
    scale: str
    ticksVisible: str
    size: str
    width: str
    start: str
    end: str
    divisions: str


class BooleanVariableProperties(_Strict):
    value: AssignmentObj
    description: str


class CameraProperties(_Strict):
    description: str
    isOrthographic: str
    isPanEnabled: str
    isZoomEnabled: str
    isRotateEnabled: str
    position: str
    target: str
    updateOnDrag: str
    useRelative: str


class ExplicitSurfaceProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    shaded: str
    expr: FunctionAssignmentObj
    domain: FunctionAssignmentArray
    colorExpr: FunctionAssignmentObj
    gridOpacity: str
    gridWidth: str
    samples1: str
    samples2: str
    grid1: str
    grid2: str


class ExplicitSurfacePolarProperties(_Strict):
    # Structurally identical to ExplicitSurfaceProperties today; kept as its own
    # model (1:1 file-mirror invariant) so a future divergence in either is caught
    # by the assignability check. Do NOT alias to ExplicitSurfaceProperties.
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    shaded: str
    expr: FunctionAssignmentObj
    domain: FunctionAssignmentArray
    colorExpr: FunctionAssignmentObj
    gridOpacity: str
    gridWidth: str
    samples1: str
    samples2: str
    grid1: str
    grid2: str


class FolderProperties(_Strict):
    description: str
    isCollapsed: str


class GridProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    width: str
    divisions: str
    snap: str
    axes: Literal["xy", "yz", "zx"]


class ImplicitSurfaceProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    shaded: str
    domain: ExprArray
    lhs: FunctionAssignmentObj
    rhs: FunctionAssignmentObj
    samples: str


class LineProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    label: str
    labelVisible: str
    size: str
    width: str
    start: str
    end: str
    coords: str


class ParametricCurveProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Annotated[
        Literal[""], WithJsonSchema({"enum": [""], "type": "string"})
    ]
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    size: str
    width: str
    start: str
    end: str
    expr: FunctionAssignmentObj
    domain: ExprArray
    samples1: str


class ParametricSurfaceProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: str  # NOTE: str here, not Literal[""].
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    shaded: str
    expr: FunctionAssignmentObj
    domain: FunctionAssignmentArray
    colorExpr: FunctionAssignmentObj
    gridOpacity: str
    gridWidth: str
    samples1: str
    samples2: str
    grid1: str
    grid2: str


class PointProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: str  # str, not Literal[""].
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    label: str
    labelVisible: str
    coords: str
    size: str


class VariableProperties(_Strict):
    value: AssignmentObj
    description: str


class VariableSliderProperties(_Strict):
    value: AssignmentObj
    fps: str
    range: StrArray  # bare strings, not ExprObj.
    duration: str
    description: str
    isAnimating: str
    speedMultiplier: str


class VectorProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: str  # str, not Literal[""].
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    label: str
    labelVisible: str
    size: str
    width: str
    start: str
    end: str
    components: str
    tail: str


class VectorFieldProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: str  # str, not Literal[""].
    useCalculatedVisibility: bool
    opacity: str
    zIndex: str
    zBias: str
    zOrder: str
    size: str
    width: str
    start: str
    end: str
    domain: ExprArray
    expr: FunctionAssignmentObj
    samples1: str
    samples2: str
    samples3: str
    scale: str


# --- Item models (one per type: {id, type discriminant, properties}). ---


class AxisItem(_Strict):
    id: str
    type: Literal["AXIS"]
    properties: AxisProperties


class BooleanVariableItem(_Strict):
    id: str
    type: Literal["BOOLEAN_VARIABLE"]
    properties: BooleanVariableProperties


class CameraItem(_Strict):
    id: str
    type: Literal["CAMERA"]
    properties: CameraProperties


class ExplicitSurfaceItem(_Strict):
    id: str
    type: Literal["EXPLICIT_SURFACE"]
    properties: ExplicitSurfaceProperties


class ExplicitSurfacePolarItem(_Strict):
    id: str
    type: Literal["EXPLICIT_SURFACE_POLAR"]
    properties: ExplicitSurfacePolarProperties


class FolderItem(_Strict):
    id: str
    type: Literal["FOLDER"]
    properties: FolderProperties


class GridItem(_Strict):
    id: str
    type: Literal["GRID"]
    properties: GridProperties


class ImplicitSurfaceItem(_Strict):
    id: str
    type: Literal["IMPLICIT_SURFACE"]
    properties: ImplicitSurfaceProperties


class LineItem(_Strict):
    id: str
    type: Literal["LINE"]
    properties: LineProperties


class ParametricCurveItem(_Strict):
    id: str
    type: Literal["PARAMETRIC_CURVE"]
    properties: ParametricCurveProperties


class ParametricSurfaceItem(_Strict):
    id: str
    type: Literal["PARAMETRIC_SURFACE"]
    properties: ParametricSurfaceProperties


class PointItem(_Strict):
    id: str
    type: Literal["POINT"]
    properties: PointProperties


class VariableItem(_Strict):
    id: str
    type: Literal["VARIABLE"]
    properties: VariableProperties


class VariableSliderItem(_Strict):
    id: str
    type: Literal["VARIABLE_SLIDER"]
    properties: VariableSliderProperties


class VectorItem(_Strict):
    id: str
    type: Literal["VECTOR"]
    properties: VectorProperties


class VectorFieldItem(_Strict):
    id: str
    type: Literal["VECTOR_FIELD"]
    properties: VectorFieldProperties


_MathItemUnion = Annotated[
    Union[
        AxisItem,
        BooleanVariableItem,
        CameraItem,
        ExplicitSurfaceItem,
        ExplicitSurfacePolarItem,
        FolderItem,
        GridItem,
        ImplicitSurfaceItem,
        LineItem,
        ParametricCurveItem,
        ParametricSurfaceItem,
        PointItem,
        VariableItem,
        VariableSliderItem,
        VectorItem,
        VectorFieldItem,
    ],
    Field(discriminator="type"),
]


# Names the discriminated union as a single OpenAPI component (`MathItem`).
# Without this wrapper the union is inlined under the first schema that
# references it, so openapi-generator-cli names it `SceneCreateSchemaItemsInner`
# and reuses that misleading name for the GET/PATCH item type too. The RootModel
# gives it a stable `#/components/schemas/MathItem` component, which the client
# emits as `export type MathItem = ...` and references from every scene schema's
# `items` array.
# NB: this is a `#` comment, not a docstring — a docstring becomes the schema
# `description` and would propagate this backend-only rationale into the
# generated client's JSDoc.
class MathItem(RootModel[_MathItemUnion]):
    root: _MathItemUnion


# Built from the raw union, NOT the RootModel: `list[_MathItemUnion]` validates
# to the concrete *Item models the handlers dump via `model_dump(mode="json")`;
# `list[MathItem]` would wrap each element in a RootModel instance instead.
# No bare `: TypeAdapter` annotation — it trips mypy's var-annotated; the
# inferred type is correct.
MATH_ITEM_LIST_ADAPTER = TypeAdapter(list[_MathItemUnion])
