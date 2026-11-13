/**
 * The viewport renderers, in menu order. Each key is a `?renderer=` value and
 * a stored preference. `name` is the library, as the pill shows it;
 * `description` completes the pill's "You're using …".
 */
const RENDERERS = {
  threejs: {
    name: "three.js",
    menuLabel: "Default",
    description: "the three.js renderer",
  },
  mathbox: {
    name: "MathBox",
    menuLabel: "Legacy (MathBox)",
    description: "the legacy MathBox renderer",
  },
} as const satisfies Record<
  string,
  { name: string; menuLabel: string; description: string }
>;

type Renderer = keyof typeof RENDERERS;

const DEFAULT_RENDERER: Renderer = "threejs";

/** Offered when the default renderer can't draw. */
const LEGACY_RENDERER: Renderer = "mathbox";

const RENDERER_KEYS = Object.keys(RENDERERS) as Renderer[];

const isRenderer = (value: unknown): value is Renderer =>
  RENDERER_KEYS.includes(value as Renderer);

export {
  DEFAULT_RENDERER,
  LEGACY_RENDERER,
  RENDERERS,
  RENDERER_KEYS,
  isRenderer,
};
export type { Renderer };
