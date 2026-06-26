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

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter


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


class ExprObj(_Strict):
    type: Literal["expr"]
    expr: str


class AssignmentObj(_Strict):
    type: Literal["assignment"]
    lhs: str
    rhs: str


class FunctionAssignmentObj(_Strict):
    type: Literal["function-assignment"]
    name: str
    params: list[str]
    rhs: str


# Concrete array types (NOT a Pydantic Generic — a generic emits mangled
# parametrized $ref names into the OpenAPI/client).
class FunctionAssignmentArray(_Strict):
    type: Literal["array"]
    items: list[FunctionAssignmentObj]


class ExprArray(_Strict):
    type: Literal["array"]
    items: list[ExprObj]


class StrArray(_Strict):
    type: Literal["array"]
    items: list[str]


# --- *Properties models (one per type; mirror each frontend interface). ---


class AxisProperties(_Strict):
    description: str
    color: str
    visible: bool
    calculatedVisibility: Literal[""]
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
    calculatedVisibility: Literal[""]
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
    calculatedVisibility: Literal[""]
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
    calculatedVisibility: Literal[""]
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
    calculatedVisibility: Literal[""]
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
    calculatedVisibility: Literal[""]
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
    calculatedVisibility: Literal[""]
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


MathItem = Annotated[
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

# No bare `: TypeAdapter` annotation — it trips mypy's var-annotated; the
# inferred type is correct.
MATH_ITEM_LIST_ADAPTER = TypeAdapter(list[MathItem])
