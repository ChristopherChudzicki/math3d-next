/**
 * The Use.GPU side of the viewport. Use.GPU components are "Live" components,
 * not React components, so this file builds the tree with `use()` calls
 * instead of JSX and never touches React or Redux. Everything it needs
 * arrives as a `SceneSpec` plus `SceneHooks`.
 */
import { keyed, use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { AutoCanvas, WebGPU } from "@use-gpu/webgpu";
import {
  AmbientLight,
  DirectionalLight,
  FontLoader,
  OrbitCamera,
  Pass,
} from "@use-gpu/workbench";
import type { FontSource } from "@use-gpu/workbench";
import { ORBIT_CONTROLS_DEFAULT, OrbitControls } from "@use-gpu/interact";
import { Cartesian, Plot } from "@use-gpu/plot";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";
import type { GraphicSpec } from "@/features/viewport/usegpu/graphicSpec/types";
import {
  keyLightPosition,
  PLOT_ROTATION_DEGREES,
} from "@/features/viewport/usegpu/orbit";
import type { OrbitSpec } from "@/features/viewport/usegpu/orbit";
import { renderGraphic } from "./graphics/renderGraphic";

export type SceneSpec = {
  range: AxesRange;
  scale: Coords;
  /**
   * Seeds the orbit controls. Must keep its identity while the camera item is
   * unchanged: a new `target` array resets the user's pan.
   */
  orbit: OrbitSpec;
  /** Bumping it re-seeds the orbit controls from `orbit`. */
  controlsVersion: number;
  /** `OrbitCamera`'s dolly: 1 is perspective, 0 orthographic. */
  projection: { dolly: number };
  controls: { rotate: boolean; pan: boolean; zoom: boolean };
  graphics: { id: string; spec: GraphicSpec }[];
};

export type SceneHooks = {
  /** WebGPU found no adapter, or could not mount a device on it. */
  onUnsupported(error: unknown): void;
  /**
   * Called with the controls' orbit whenever it differs from the last call,
   * including on first render.
   */
  onOrbit(orbit: OrbitSpec): void;
};

/** The orbit-control bindings for the camera item's enable flags: an empty binding list disables that action. */
const actionBindings = (controls: SceneSpec["controls"]) => ({
  move: controls.pan ? ORBIT_CONTROLS_DEFAULT.move : [],
  rotate: controls.rotate ? ORBIT_CONTROLS_DEFAULT.rotate : [],
  zoom: controls.zoom ? ORBIT_CONTROLS_DEFAULT.zoom : [],
});

const WHITE = [1, 1, 1, 1];

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
        children: graphics,
      }),
    }),
  });
  const ambient = use(AmbientLight, { intensity: 0.6 });
  // Rebuilt only when the key light moves, so zoom and pan keep the Pass.
  let lit: { light: Coords; pass: LiveElement } | null = null;
  const litPass = (orbit: OrbitSpec) => {
    const light = keyLightPosition(orbit);
    if (!lit || lit.light.some((v, i) => v !== light[i])) {
      lit = {
        light,
        pass: use(Pass, {
          lights: true,
          oit: true,
          children: [
            ambient,
            use(DirectionalLight, { position: light, intensity: 0.8 }),
            plot,
          ],
        }),
      };
    }
    return lit.pass;
  };
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
    children: use(AutoCanvas, {
      canvas,
      samples: 4,
      backgroundColor: WHITE,
      children: use(OrbitControls, {
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
            children: litPass(orbit),
          });
        },
      }),
    }),
  });
};
