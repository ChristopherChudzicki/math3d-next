/* eslint-disable @typescript-eslint/no-explicit-any */
const mathObjectDefaults: any = {
  FOLDER: {
    isCollapsed: false,
    isDropDisabled: false,
    isDragDisabled: false,
    description: "Folder",
  },
  VARIABLE: {
    type: "VARIABLE",
    name: "f(x)",
    value: "e^x",
    description: "Variable or Function",
  },
  VARIABLE_SLIDER: {
    type: "VARIABLE_SLIDER",
    name: "T",
    value: null,
    min: "-5",
    max: "5",
    description: "Variable Slider",
    isAnimating: false,
    speedMultiplier: 1,
  },
  BOOLEAN_VARIABLE: {
    type: "BOOLEAN_VARIABLE",
    name: "switch",
    value: true,
    description: "Toggle Switch",
  },
  CAMERA: {
    type: "CAMERA",
    description: "Camera",
    useCalculatedVisibility: false,
    isOrthographic: false,
    isPanEnabled: false,
    isZoomEnabled: true,
    isRotateEnabled: true,
    relativePosition: [0.5, -2, 0.5],
    relativeLookAt: [0, 0, 0],
    computedPosition: "\\left[-6, -4, 2\\right]",
    computedLookAt: "\\left[0, 0, 0\\right]",
    useComputed: false,
  },
  AXIS: {
    type: "AXIS",
    description: "Axis",
    useCalculatedVisibility: false,
    color: "#808080",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    label: "",
    labelVisible: true,
    min: "-5",
    max: "+5",
    axis: "x",
    scale: "1",
    ticksVisible: true,
    size: "2",
    width: "1",
  },
  GRID: {
    type: "GRID",
    description: "Grid",
    useCalculatedVisibility: false,
    color: "#808080",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    width: "1/2",
    divisions: "\\left[10,\\ 10\\right]",
    snap: false,
  },
  POINT: {
    type: "POINT",
    description: "Point",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    label: "",
    labelVisible: false,
    coords: "\\left[0,0,0\\right]",
    size: "16",
  },
  LINE: {
    type: "LINE",
    description: "Line",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    label: "",
    labelVisible: false,
    size: "6",
    width: "4",
    start: false,
    end: false,
    coords: "\\left[\\left[1,1,1\\right], \\left[-1,1,-1\\right]\\right]",
  },
  VECTOR: {
    type: "VECTOR",
    description: "Vector",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    label: "",
    labelVisible: false,
    size: "6",
    width: "4",
    start: false,
    end: true,
    components: "\\left[3,2,1\\right]",
    tail: "\\left[0,0,0\\right]",
  },
  PARAMETRIC_CURVE: {
    type: "PARAMETRIC_CURVE",
    description: "Parametric Curve",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    size: "6",
    width: "4",
    start: false,
    end: false,
    expr: "_f(t)=\\left[\\cos\\left(t\\right),\\ \\sin\\left(t\\right),\\ t\\right]",
    range: "\\left[-2\\pi,\\ 2\\pi\\right]",
    samples: "128",
  },
  PARAMETRIC_SURFACE: {
    type: "PARAMETRIC_SURFACE",
    description: "Parametric Surface",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "0.75",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    shaded: true,
    expr: "_f(u,v)=\\left[v\\cdot\\cos\\left(u\\right),v\\cdot\\sin\\left(u\\right),v\\right]",
    rangeU: "\\left[-\\pi,\\ \\pi\\right]",
    rangeV: "\\left[-3, 3\\right]",
    colorExpr: "_f(X, Y, Z, u, v)=mod(Z, 1)",
    gridOpacity: "0.5",
    gridWidth: "2",
    uSamples: "64",
    vSamples: "64",
    gridU: "8",
    gridV: "8",
  },
  EXPLICIT_SURFACE: {
    type: "EXPLICIT_SURFACE",
    description: "Explicit Surface",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "0.75",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    shaded: true,
    expr: "_f(x,y)=x^2-y^2",
    rangeU: "\\left[-2,\\ 2\\right]",
    rangeV: "\\left[-2,\\ 2\\right]",
    colorExpr: "_f(X, Y, Z, x, y)=mod(Z, 1)",
    gridOpacity: "0.5",
    gridWidth: "2",
    uSamples: "64",
    vSamples: "64",
    gridU: "8",
    gridV: "8",
  },
  EXPLICIT_SURFACE_POLAR: {
    type: "EXPLICIT_SURFACE_POLAR",
    description: "Explicit Surface (Polar)",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "0.75",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    shaded: true,
    expr: "_f(r,\\theta)=\\frac{1}{4}r^2\\cdot\\cos\\left(3\\theta\\right)",
    rangeU: "\\left[0,\\ 3\\right]",
    rangeV: "\\left[-\\pi,\\ \\pi\\right]",
    colorExpr: "_f(X, Y, Z, r, \\theta)=mod(Z, 1)",
    gridOpacity: "0.5",
    gridWidth: "2",
    uSamples: "64",
    vSamples: "64",
    gridU: "8",
    gridV: "8",
  },
  IMPLICIT_SURFACE: {
    type: "IMPLICIT_SURFACE",
    description: "Implicit Surface",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    shaded: true,
    rangeX: "\\left[-5,\\ 5\\right]",
    rangeY: "\\left[-5,\\ 5\\right]",
    rangeZ: "\\left[-5,\\ 5\\right]",
    lhs: "_f(x,y,z)=x^2+y^2",
    rhs: "_f(x,y,z)=z^2+1",
    samples: "20",
  },
  VECTOR_FIELD: {
    type: "VECTOR_FIELD",
    description: "Vector Field",
    useCalculatedVisibility: false,
    color: "#3090FF",
    visible: true,
    opacity: "1",
    zIndex: "0",
    zBias: "0",
    calculatedVisibility: "",
    size: "6",
    width: "2",
    start: false,
    end: true,
    rangeX: "\\left[-5,\\ 5\\right]",
    rangeY: "\\left[-5,\\ 5\\right]",
    rangeZ: "\\left[-5,\\ 5\\right]",
    expr: "_f(x,y,z)=\\frac{[y,\\ -x,\\ 0]}{\\sqrt{x^2+y^2}}",
    samples: "[10, 10, 5]",
    scale: "1",
  },
};

export default mathObjectDefaults;
