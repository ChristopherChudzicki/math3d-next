/**
 * The Use.GPU side of the viewport. Use.GPU components are "Live" components,
 * not React components, so this file builds the tree with `use()` calls
 * instead of JSX and never touches React or Redux. Everything it needs
 * arrives as a `SceneSpec`.
 */
import { keyed, memoArgs, use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import type { Emit, TensorArray } from "@use-gpu/core";
import { AutoCanvas, WebGPU } from "@use-gpu/webgpu";
import {
  AmbientLight,
  DirectionalLight,
  FontLoader,
  OrbitCamera,
  Pass,
} from "@use-gpu/workbench";
import { ORBIT_CONTROLS_DEFAULT, OrbitControls } from "@use-gpu/interact";
import { Sampler } from "@use-gpu/frame";
import {
  Arrow,
  Axis,
  Cartesian,
  Grid,
  ImplicitSurface,
  Line,
  Plot,
  Point,
  Surface,
  Transpose,
} from "@use-gpu/plot";
import type {
  AxisSpec,
  Coords,
  GraphicSpec,
  GridSpec,
  ImplicitSurfaceSpec,
  LineSpec,
  PointSpec,
  RGBA,
  SceneSpec,
  SurfaceSpec,
} from "./specs";

/**
 * Translucent graphics go through the weighted-blended OIT pass, so their
 * draw order never matters. Opaque ones use the ordinary depth-tested path.
 */
const drawMode = (color: RGBA) => (color[3] < 1 ? "oit" : "opaque");

const UNIT_RANGE: [number, number][] = [
  [0, 1],
  [0, 1],
];

const renderPoint = (spec: PointSpec): LiveElement =>
  use(Point, {
    positions: spec.positions,
    size: spec.size,
    color: spec.color,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  });

const renderLine = (spec: LineSpec): LiveElement => {
  const common = {
    positions: spec.paths,
    width: spec.width,
    color: spec.color,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  };
  return spec.start || spec.end
    ? use(Arrow, {
        ...common,
        start: spec.start,
        end: spec.end,
        size: spec.arrowSize,
      })
    : use(Line, common);
};

const renderAxis = (spec: AxisSpec): LiveElement =>
  use(Axis, {
    axis: spec.axis,
    width: spec.width,
    color: spec.color,
    start: spec.start,
    end: spec.end,
    size: spec.arrowSize,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  });

const renderGrid = (spec: GridSpec): LiveElement =>
  use(Grid, {
    axes: spec.axes,
    first: { divide: spec.divisions[0], nice: spec.snap },
    second: { divide: spec.divisions[1], nice: spec.snap },
    width: spec.width,
    color: spec.color,
    zBias: spec.zBias,
    mode: drawMode(spec.color),
  });

const renderSurface = (spec: SurfaceSpec): LiveElement => {
  const { position, colorAt, samples, grid } = spec;
  const emitPosition = (emit: Emit, u: number, v: number) => {
    const [x, y, z] = position(u, v);
    emit(x, y, z, 1);
  };
  const emitPositionAndColor = (emit: Emit, u: number, v: number) => {
    emitPosition(emit, u, v);
    const [r, g, b, a] = colorAt(u, v);
    emit(r, g, b, a);
  };
  const gridLine = (positions: TensorArray) =>
    use(Line, {
      positions,
      width: grid.width,
      color: grid.color,
      // Sits just above the surface, like MathBox's gridline zBias.
      zBias: spec.zBias + 1,
      mode: drawMode(grid.color),
    });
  const hasGrid = grid.width > 0 && grid.color[3] > 0;
  return [
    use(Sampler, {
      axes: "xy",
      format: "vec4<f32>",
      size: samples,
      range: UNIT_RANGE,
      items: 2,
      as: ["positions", "colors"],
      expr: emitPositionAndColor,
      render: ({ positions, colors }: Record<string, TensorArray>) =>
        use(Surface, {
          positions,
          colors,
          shaded: spec.shaded,
          zBias: spec.zBias,
          mode: drawMode(spec.colorAt(0, 0)),
        }),
    }),
    // Gridlines: one coarse sampling per direction. A 2D tensor draws one
    // line per row, so each sampler is fine along one parameter and has as
    // many rows as gridlines in the other.
    hasGrid && grid.lines[1] > 0
      ? use(Sampler, {
          axes: "xy",
          format: "vec4<f32>",
          size: [samples[0], grid.lines[1]],
          range: UNIT_RANGE,
          expr: emitPosition,
          render: gridLine,
        })
      : null,
    hasGrid && grid.lines[0] > 0
      ? use(Sampler, {
          axes: "xy",
          format: "vec4<f32>",
          size: [grid.lines[0], samples[1]],
          range: UNIT_RANGE,
          expr: emitPosition,
          render: (positions: TensorArray) =>
            use(Transpose, {
              tensor: positions,
              axes: "yx",
              render: gridLine,
            }),
        })
      : null,
  ];
};

const renderImplicitSurface = (spec: ImplicitSurfaceSpec): LiveElement => {
  const { value, domain, samples } = spec;
  const size = [samples, samples, samples];
  // Sample one cell beyond the domain; the layer then scissors the surface at
  // the domain edge, so a surface crossing it is cut cleanly rather than
  // ending a cell short.
  const padding = 1;
  // Finite-difference step: half a grid cell per axis.
  const h = domain.map(([lo, hi]) => (hi - lo) / samples / 2);
  const emitValue = (emit: Emit, x: number, y: number, z: number) => {
    emit(value(x, y, z));
  };
  const emitNormal = (emit: Emit, x: number, y: number, z: number) => {
    const nx = value(x + h[0], y, z) - value(x - h[0], y, z);
    const ny = value(x, y + h[1], z) - value(x, y - h[1], z);
    const nz = value(x, y, z + h[2]) - value(x, y, z - h[2]);
    const len = Math.hypot(nx, ny, nz) || 1;
    emit(nx / len, ny / len, nz / len, 0);
  };
  return use(Sampler, {
    axes: "xyz",
    format: "f32",
    size,
    range: domain,
    padding,
    expr: emitValue,
    render: (values: TensorArray) =>
      use(Sampler, {
        axes: "xyz",
        format: "vec4<f32>",
        size,
        range: domain,
        padding,
        expr: emitNormal,
        render: (normals: TensorArray) =>
          use(ImplicitSurface, {
            values,
            normals,
            range: domain,
            padding,
            level: 0,
            method: "linear",
            shaded: spec.shaded,
            color: spec.color,
            zBias: spec.zBias,
            mode: drawMode(spec.color),
          }),
      }),
  });
};

const renderGraphic = memoArgs((spec: GraphicSpec): LiveElement => {
  switch (spec.kind) {
    case "point":
      return renderPoint(spec);
    case "line":
      return renderLine(spec);
    case "surface":
      return renderSurface(spec);
    case "implicit":
      return renderImplicitSurface(spec);
    case "axis":
      return renderAxis(spec);
    case "grid":
      return renderGrid(spec);
    default:
      return null;
  }
  // Specs are immutable, so an unchanged spec reference means nothing to
  // redo; without this memo every graphic (and every CPU sampler behind it)
  // re-ran on any change anywhere in the scene.
}, "renderGraphic");

/** The orbit-control bindings for the camera item's enable flags: an empty binding list disables that action. */
const actionBindings = (controls: SceneSpec["controls"]) => ({
  move: controls.pan ? ORBIT_CONTROLS_DEFAULT.move : [],
  rotate: controls.rotate ? ORBIT_CONTROLS_DEFAULT.rotate : [],
  zoom: controls.zoom ? ORBIT_CONTROLS_DEFAULT.zoom : [],
});

const PLOT_ROTATION_DEGREES = [-90, 0, 0];
const WHITE = [1, 1, 1, 1];

export const makeSceneRoot = (
  canvas: HTMLCanvasElement,
  scene: SceneSpec,
): LiveElement => {
  const graphics = scene.graphics.map(({ id, spec }) =>
    keyed(renderGraphic, id, spec),
  );
  // Plot's label support needs a font context even when nothing is labelled.
  const plot = use(FontLoader, {
    children: use(Plot, {
      children: use(Cartesian, {
        range: scene.range,
        scale: scene.scale,
        rotation: PLOT_ROTATION_DEGREES,
        children: graphics,
      }),
    }),
  });
  const pass = use(Pass, {
    lights: true,
    oit: true,
    children: [
      use(AmbientLight, { intensity: 0.6 }),
      use(DirectionalLight, { position: [1, 3, 2], intensity: 0.8 }),
      plot,
    ],
  });
  return use(WebGPU, {
    fallback: () => null,
    children: use(AutoCanvas, {
      canvas,
      samples: 4,
      backgroundColor: WHITE,
      children: use(OrbitControls, {
        ...scene.orbit,
        actionBindings: actionBindings(scene.controls),
        render: (
          radius: number,
          bearing: number,
          pitch: number,
          target: Coords,
        ) =>
          use(OrbitCamera, {
            radius,
            bearing,
            pitch,
            target,
            children: pass,
          }),
      }),
    }),
  });
};
