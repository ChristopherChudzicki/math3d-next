import { Scene, PartialBy, MathItemType } from "types";

const defaultScene: PartialBy<Scene, "id"> = {
  title: "Untitled",
  items: [
    {
      id: "1",
      type: MathItemType.ExplicitSurface,
      properties: {
        expr: "_f(x,y)=1-x^2-y",
        color: "#3498db",
        gridU: "8",
        gridV: "8",
        zBias: "0",
        rangeU: "\\left[-2,\\ 2\\right]",
        rangeV: "\\left[-2,\\ 2\\right]",
        shaded: true,
        zIndex: "0",
        opacity: "0.5",
        visible: true,
        uSamples: "64",
        vSamples: "64",
        colorExpr: "_f(X, Y, Z, x, y)=mod(Z, 1)",
        gridWidth: "2",
        description: "Explicit Surface",
        gridOpacity: "0.5",
        calculatedVisibility: "",
      },
    },
    {
      id: "camera",
      type: MathItemType.Camera,
      properties: {
        description: "Camera",
        useComputed: false,
        isPanEnabled: false,
        isZoomEnabled: true,
        computedLookAt: "\\left[0, 0, 0\\right]",
        isOrthographic: false,
        relativeLookAt: [0, 0, 0],
        isRotateEnabled: true,
        computedPosition: "\\left[-6, -4, 2\\right]",
        relativePosition: [
          2.1012137801269315, -1.110291947867365, 0.6883648518373156,
        ],
      },
    },
    {
      id: "axis-x",
      type: MathItemType.Axis,
      properties: {
        max: "+5",
        min: "-5",
        axis: "x",
        size: "2",
        color: "#808080",
        label: "x",
        scale: "1",
        width: "1",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: true,
        description: "Axis",
        labelVisible: true,
        ticksVisible: true,
        calculatedVisibility: "",
      },
    },
    {
      id: "axis-y",
      type: MathItemType.Axis,
      properties: {
        max: "+5",
        min: "-5",
        axis: "y",
        size: "2",
        color: "#808080",
        label: "y",
        scale: "1",
        width: "1",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: true,
        description: "Axis",
        labelVisible: true,
        ticksVisible: true,
        calculatedVisibility: "",
      },
    },
    {
      id: "axis-z",
      type: MathItemType.Axis,
      properties: {
        max: "+5",
        min: "-5",
        axis: "z",
        size: "2",
        color: "#808080",
        label: "z",
        scale: "1",
        width: "1",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: true,
        description: "Axis",
        labelVisible: true,
        ticksVisible: true,
        calculatedVisibility: "",
      },
    },
    {
      id: "grid-xy",
      type: MathItemType.Grid,
      properties: {
        axes: "xy",
        snap: false,
        color: "#808080",
        width: "1/2",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: true,
        divisions: "\\left[10,\\ 10\\right]",
        description: "Grid",
        calculatedVisibility: "",
      },
    },
    {
      id: "grid-yz",
      type: MathItemType.Grid,
      properties: {
        axes: "yz",
        snap: false,
        color: "#808080",
        width: "1/2",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: false,
        divisions: "\\left[10,\\ 10\\right]",
        description: "Grid",
        calculatedVisibility: "",
      },
    },
    {
      id: "grid-zx",
      type: MathItemType.Grid,
      properties: {
        axes: "zx",
        snap: false,
        color: "#808080",
        width: "1/2",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: false,
        divisions: "\\left[10,\\ 10\\right]",
        description: "Grid",
        calculatedVisibility: "",
      },
    },
    {
      id: "cameraFolder",
      type: MathItemType.Folder,
      properties: {
        description: "Camera Controls",
        isCollapsed: false,
      },
    },
    {
      id: "axes",
      type: MathItemType.Folder,
      properties: {
        description: "Axes and Grids",
        isCollapsed: false,
      },
    },
    {
      id: "mainFolder",
      type: MathItemType.Folder,
      properties: {
        description: "A Folder",
        isCollapsed: false,
      },
    },
  ],
  sortableTree: {
    axes: ["axis-x", "axis-y", "axis-z", "grid-xy", "grid-yz", "grid-zx"],
    root: ["mainFolder"],
    setup: ["cameraFolder", "axes"],
    mainFolder: ["1"],
    cameraFolder: ["camera"],
  },
};

export default defaultScene;
