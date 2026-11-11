/**
 * The Use.GPU side of the viewport. Use.GPU components are "Live" components,
 * not React components, so this file builds the tree with `use()` calls
 * instead of JSX and never touches React or Redux. Everything it needs
 * arrives as a `SceneSpec` plus `SceneHooks`.
 */
import { keyed, use, useResource } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { AutoCanvas, WebGPU } from "@use-gpu/webgpu";
import {
  AmbientLight,
  DirectionalLight,
  FontLoader,
  OrbitCamera,
  Pass,
  useDeviceContext,
} from "@use-gpu/workbench";
import type { FontSource } from "@use-gpu/workbench";
import {
  Cursor,
  ORBIT_CONTROLS_DEFAULT,
  OrbitControls,
} from "@use-gpu/interact";
import { Cartesian, Plot } from "@use-gpu/plot";
import type { ViewportHooks, ViewportSpec } from "@math3d/viewport-spec";
import {
  PLOT_ROTATION_DEGREES,
  toWorld,
} from "@/features/viewport/usegpu/orbit";
import type { OrbitSpec } from "@/features/viewport/usegpu/orbit";
import { renderGraphic } from "./graphics/renderGraphic";

/** `ViewportSpec` with its camera as Use.GPU's orbit controls take it. */
export type SceneSpec = Pick<
  ViewportSpec,
  "range" | "scale" | "controls" | "graphics"
> & {
  /**
   * Seeds the orbit controls, which re-seed each field only when it changes
   * (by identity): a new `target` array resets the user's pan.
   */
  orbit: OrbitSpec;
  /** Bumping it re-seeds the orbit controls from `orbit`. */
  controlsVersion: number;
  /** `OrbitCamera`'s dolly: 1 is perspective, 0 orthographic. */
  projection: { dolly: number };
};

export type SceneHooks = Pick<ViewportHooks, "onUnsupported"> & {
  /**
   * Called with the controls' orbit whenever it differs from the last call,
   * including on first render.
   */
  onOrbit(orbit: OrbitSpec): void;
  /** The plot's children are rendering, which happens only once the font has loaded. */
  onGraphicsMounted(): void;
  /** The device reported an error, or was lost, after it came up. */
  onError(error: Error): void;
};

const RenderProbe = ({ onRender }: { onRender: () => void }) => {
  onRender();
  return null;
};

const WatchDeviceLoss = ({ onLost }: { onLost: (error: Error) => void }) => {
  const device = useDeviceContext();
  useResource(
    (dispose) => {
      let mounted = true;
      dispose(() => {
        mounted = false;
      });
      device.lost.then((info) => {
        if (mounted) onLost(new Error(`WebGPU device lost: ${info.message}`));
      });
    },
    [device],
  );
  return null;
};

/** The orbit-control bindings for the camera item's enable flags: an empty binding list disables that action. */
const actionBindings = (controls: SceneSpec["controls"]) => ({
  move: controls.pan ? ORBIT_CONTROLS_DEFAULT.move : [],
  rotate: controls.rotate ? ORBIT_CONTROLS_DEFAULT.rotate : [],
  zoom: controls.zoom ? ORBIT_CONTROLS_DEFAULT.zoom : [],
});

const WHITE = [1, 1, 1, 1];

// MathBox's hardcoded light direction, (1, 2, 2) in cartesian coordinates.
const KEY_LIGHT = toWorld([1, 2, 2]);

const FONTS: FontSource[] = [
  {
    family: "Lato",
    weight: "normal",
    style: "normal",
    src: "/fonts/Lato-Regular.ttf",
  },
];

export const makeSceneRoot = (
  canvas: HTMLCanvasElement,
  scene: SceneSpec,
  hooks: SceneHooks,
): LiveElement => {
  const graphics = scene.graphics.map(({ id, spec }) =>
    keyed(renderGraphic, id, spec),
  );
  // Plot's label support needs a font context even when nothing is labeled.
  const plot = use(FontLoader, {
    fonts: FONTS,
    children: use(Plot, {
      children: use(Cartesian, {
        range: scene.range,
        scale: scene.scale,
        rotation: PLOT_ROTATION_DEGREES,
        children: [
          ...graphics,
          use(RenderProbe, { onRender: hooks.onGraphicsMounted }),
        ],
      }),
    }),
  });
  const pass = use(Pass, {
    lights: true,
    oit: true,
    children: [
      use(AmbientLight, { intensity: 0.6 }),
      use(DirectionalLight, { position: KEY_LIGHT, intensity: 0.8 }),
      plot,
    ],
  });
  let last: OrbitSpec | null = null;
  const report = (orbit: OrbitSpec) => {
    const same =
      last &&
      last.radius === orbit.radius &&
      last.bearing === orbit.bearing &&
      last.pitch === orbit.pitch &&
      last.target.every((v, i) => v === orbit.target[i]);
    if (same) return;
    last = orbit;
    hooks.onOrbit(orbit);
  };
  return use(WebGPU, {
    fallback: (error: Error) => {
      hooks.onUnsupported(error);
      return null;
    },
    onError: hooks.onError,
    children: use(AutoCanvas, {
      canvas,
      samples: 4,
      backgroundColor: WHITE,
      children: [
        // AutoCanvas owns the canvas cursor (default `default`); `move` matches
        // MathBox, whose threestrap `cursor` plugin shows it whenever controls exist.
        use(Cursor, { cursor: "move" }),
        use(WatchDeviceLoss, { onLost: hooks.onError }),
        use(OrbitControls, {
          ...scene.orbit,
          version: scene.controlsVersion,
          actionBindings: actionBindings(scene.controls),
          render: (
            radius: number,
            bearing: number,
            pitch: number,
            target: ArrayLike<number>,
          ) => {
            const orbit: OrbitSpec = {
              radius,
              bearing,
              pitch,
              target: [target[0], target[1], target[2]],
            };
            report(orbit);
            return use(OrbitCamera, {
              ...orbit,
              dolly: scene.projection.dolly,
              focus: 1,
              children: pass,
            });
          },
        }),
      ],
    }),
  });
};
