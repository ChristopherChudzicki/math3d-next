import { MathItemType } from "@math3d/mathitem-configs";
import { Scene } from "@/types";

const defaultScene: Omit<Scene, "id"> = {
  title: "Untitled",
  items: [
    {
      id: "1",
      type: MathItemType.ExplicitSurface,
      properties: {
        expr: {
          name: "_f",
          params: ["x", "y"],
          rhs: "1 - x^2 - y",
          type: "function-assignment",
        },
        color: "#3498db",
        grid1: "8",
        grid2: "8",
        zBias: "0",
        domain: {
          type: "array",
          items: [
            {
              type: "function-assignment",
              name: "_f",
              params: ["y"],
              rhs: "[-5, 5]",
            },
            {
              type: "function-assignment",
              name: "_f",
              params: ["x"],
              rhs: "[-5, 5]",
            },
          ],
        },
        shaded: "true",
        zIndex: "0",
        opacity: "0.5",
        visible: "true",
        samples1: "64",
        samples2: "64",
        colorExpr: {
          type: "function-assignment",
          name: "_f",
          params: ["X", "Y", "Z", "x", "y"],
          rhs: "mod(Z, 1)",
        },
        gridWidth: "2",
        description: "Explicit Surface",
        gridOpacity: "0.5",
      },
    },
    {
      id: "camera",
      type: MathItemType.Camera,
      properties: {
        description: "Camera",
        updateOnDrag: "true",
        isPanEnabled: "false",
        isZoomEnabled: "true",
        target: "\\left[0, 0, 0\\right]",
        isOrthographic: "false",
        isRotateEnabled: "true",
        position: "\\left[-6, -4, 2\\right]",
        useRelative: "false",
      },
    },
    {
      id: "axis-x",
      type: MathItemType.Axis,
      properties: {
        max: "+5",
        min: "-5",
        axis: "x",
        size: "6",
        color: "#808080",
        label: "x",
        scale: "1",
        width: "1",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: "true",
        description: "Axis",
        labelVisible: "true",
        ticksVisible: "true",
        end: "true",
        start: "false",
        divisions: "10",
      },
    },
    {
      id: "axis-y",
      type: MathItemType.Axis,
      properties: {
        max: "+5",
        min: "-5",
        axis: "y",
        size: "6",
        color: "#808080",
        label: "y",
        scale: "1",
        width: "1",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: "true",
        description: "Axis",
        labelVisible: "true",
        ticksVisible: "true",
        end: "true",
        start: "false",
        divisions: "10",
      },
    },
    {
      id: "axis-z",
      type: MathItemType.Axis,
      properties: {
        max: "+5",
        min: "-5",
        axis: "z",
        size: "6",
        color: "#808080",
        label: "z",
        scale: "\\frac{1}{2}",
        width: "1",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: "true",
        description: "Axis",
        labelVisible: "true",
        ticksVisible: "true",
        end: "true",
        start: "false",
        divisions: "10",
      },
    },
    {
      id: "grid-xy",
      type: MathItemType.Grid,
      properties: {
        axes: "xy",
        snap: "false",
        color: "#808080",
        width: "1/2",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: "true",
        divisions: "\\left[10,\\ 10\\right]",
        description: "Grid",
      },
    },
    {
      id: "grid-yz",
      type: MathItemType.Grid,
      properties: {
        axes: "yz",
        snap: "false",
        color: "#808080",
        width: "1/2",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: "false",
        divisions: "\\left[10,\\ 10\\right]",
        description: "Grid",
      },
    },
    {
      id: "grid-zx",
      type: MathItemType.Grid,
      properties: {
        axes: "zx",
        snap: "false",
        color: "#808080",
        width: "1/2",
        zBias: "0",
        zIndex: "0",
        opacity: "1",
        visible: "false",
        divisions: "\\left[10,\\ 10\\right]",
        description: "Grid",
      },
    },
    {
      id: "cameraFolder",
      type: MathItemType.Folder,
      properties: {
        description: "Camera Controls",
        isCollapsed: "false",
      },
    },
    {
      id: "axes",
      type: MathItemType.Folder,
      properties: {
        description: "Axes and Grids",
        isCollapsed: "false",
      },
    },
    {
      id: "initialFolder",
      type: MathItemType.Folder,
      properties: {
        description: "A Folder",
        isCollapsed: "false",
      },
    },
  ],
  itemOrder: {
    axes: ["axis-x", "axis-y", "axis-z", "grid-xy", "grid-yz", "grid-zx"],
    main: ["initialFolder"],
    setup: ["cameraFolder", "axes"],
    initialFolder: ["1"],
    cameraFolder: ["camera"],
  },
};

export default defaultScene;
