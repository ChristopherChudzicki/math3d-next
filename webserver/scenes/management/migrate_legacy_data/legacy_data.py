from dataclasses import dataclass, field
from typing import Union


@dataclass
class FolderProperties:
    isCollapsed: bool = False
    isDropDisabled: bool = False
    isDragDisabled: bool = False
    description: str = "Folder"


@dataclass
class VariableProperties:
    name: str = "f(x)"
    value: str = "e^x"
    description: str = "Variable or Function"


@dataclass
class VariableSlider:
    name: str = "T"
    value: Union[None, float] = None
    min: str = "-5"
    max: str = "5"
    description: str = "Variable Slider"
    isAnimating: bool = False
    speedMultiplier: float = 1


@dataclass
class BooleanVariable:
    name: str = "switch"
    value: bool = True
    description: str = "Toggle Switch"


@dataclass
class CameraProperties:
    description: str = "Camera"
    useCalculatedVisibility: bool = False
    isOrthographic: bool = False
    isPanEnabled: bool = False
    isZoomEnabled: bool = True
    isRotateEnabled: bool = True
    relativePosition: list[float] = field(default_factory=lambda: [0.5, -2, 0.5])
    relativeLookAt: list[float] = field(default_factory=lambda: [0, 0, 0])
    computedPosition: str = "\\left[-6, -4, 2\\right]"
    computedLookAt: str = "\\left[0, 0, 0\\right]"
    useComputed: bool = False


@dataclass
class AxisProperties:
    description: str = "Axis"
    useCalculatedVisibility: bool = False
    color: str = "#808080"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    label: str = ""
    labelVisible: bool = True
    min: str = "-5"
    max: str = "+5"
    axis: str = "x"
    scale: str = "1"
    ticksVisible: bool = True
    size: str = "2"
    width: str = "1"


@dataclass
class GridProperties:
    description: str = "Grid"
    axes: str = "xy"
    useCalculatedVisibility: bool = False
    color: str = "#808080"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    width: str = "1/2"
    divisions: str = "\\left[10,\\ 10\\right]"
    snap: bool = False


@dataclass
class PointProperties:
    description: str = "Point"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    label: str = ""
    labelVisible: bool = False
    coords: str = "\\left[0,0,0\\right]"
    size: str = "16"


@dataclass
class LineProperties:
    description: str = "Line"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    label: str = ""
    labelVisible: bool = False
    size: str = "6"
    width: str = "4"
    start: bool = False
    end: bool = False
    coords: str = "\\left[\\left[1,1,1\\right], \\left[-1,1,-1\\right]\\right]"


@dataclass
class VectorProperties:
    description: str = "Vector"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    label: str = ""
    labelVisible: bool = False
    size: str = "6"
    width: str = "4"
    start: bool = False
    end: bool = True
    components: str = "\\left[3,2,1\\right]"
    tail: str = "\\left[0,0,0\\right]"


@dataclass
class ParametricCurveProperties:
    description: str = "Parametric Curve"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    size: str = "6"
    width: str = "4"
    start: bool = False
    end: bool = False
    expr: str = (
        "_f(t)=\\left[\\cos\\left(t\\right),\\ \\sin\\left(t\\right),\\ t\\right]"
    )
    range: str = "\\left[-2\\pi,\\ 2\\pi\\right]"
    samples: str = "128"


@dataclass
class ParametricSurfaceProperties:
    description: str = "Parametric Surface"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "0.75"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    shaded: bool = True
    expr: str = "_f(u,v)=\\left[v\\cdot\\cos\\left(u\\right),v\\cdot\\sin\\left(u\\right),v\\right]"
    rangeU: str = "\\left[-\\pi,\\ \\pi\\right]"
    rangeV: str = "\\left[-3, 3\\right]"
    colorExpr: str = "_f(X, Y, Z, u, v)=mod(Z, 1)"
    gridOpacity: str = "0.5"
    gridWidth: str = "2"
    uSamples: str = "64"
    vSamples: str = "64"
    gridU: str = "8"
    gridV: str = "8"


@dataclass
class ExplicitSurfaceProperties:
    description: str = "Explicit Surface"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "0.75"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    shaded: bool = True
    expr: str = "_f(x,y)=x^2-y^2"
    rangeU: str = "\\left[-2,\\ 2\\right]"
    rangeV: str = "\\left[-2,\\ 2\\right]"
    colorExpr: str = "_f(X, Y, Z, x, y)=mod(Z, 1)"
    gridOpacity: str = "0.5"
    gridWidth: str = "2"
    uSamples: str = "64"
    vSamples: str = "64"
    gridU: str = "8"
    gridV: str = "8"


@dataclass
class ExplicitSurfacePolarProperties:
    description: str = "Explicit Surface (Polar)"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "0.75"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    shaded: bool = True
    expr: str = "_f(r,\\theta)=\\frac{1}{4}r^2\\cdot\\cos\\left(3\\theta\\right)"
    rangeU: str = "\\left[0,\\ 3\\right]"
    rangeV: str = "\\left[-\\pi,\\ \\pi\\right]"
    colorExpr: str = "_f(X, Y, Z, r, \\theta)=mod(Z, 1)"
    gridOpacity: str = "0.5"
    gridWidth: str = "2"
    uSamples: str = "64"
    vSamples: str = "64"
    gridU: str = "8"
    gridV: str = "8"


@dataclass
class ImplicitSurfaceProperties:
    description: str = "Implicit Surface"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    shaded: bool = True
    rangeX: str = "\\left[-5,\\ 5\\right]"
    rangeY: str = "\\left[-5,\\ 5\\right]"
    rangeZ: str = "\\left[-5,\\ 5\\right]"
    lhs: str = "_f(x,y,z)=x^2+y^2"
    rhs: str = "_f(x,y,z)=z^2+1"
    samples: str = "20"


@dataclass
class VectorFieldProperties:
    description: str = "Vector Field"
    useCalculatedVisibility: bool = False
    color: str = "#3090FF"
    visible: bool = True
    opacity: str = "1"
    zIndex: str = "0"
    zBias: str = "0"
    calculatedVisibility: str = ""
    size: str = "6"
    width: str = "2"
    start: bool = False
    end: bool = True
    rangeX: str = "\\left[-5,\\ 5\\right]"
    rangeY: str = "\\left[-5,\\ 5\\right]"
    rangeZ: str = "\\left[-5,\\ 5\\right]"
    expr: str = "_f(x,y,z)=\\frac{[y,\\ -x,\\ 0]}{\\sqrt{x^2+y^2}}"
    samples: str = "[10, 10, 5]"
    scale: str = "1"
