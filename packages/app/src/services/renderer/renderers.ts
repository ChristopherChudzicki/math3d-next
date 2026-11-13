/**
 * The viewport renderers, in menu order. Each key is a `?renderer=` value and
 * a stored preference. `name` is the library, as the pill shows it.
 */
const RENDERERS = {
  mathbox: { name: "MathBox", menuLabel: "Default" },
  threejs: { name: "three.js", menuLabel: "three.js (experimental)" },
} as const satisfies Record<string, { name: string; menuLabel: string }>;

type Renderer = keyof typeof RENDERERS;

const DEFAULT_RENDERER: Renderer = "mathbox";

const RENDERER_KEYS = Object.keys(RENDERERS) as Renderer[];

const isRenderer = (value: unknown): value is Renderer =>
  RENDERER_KEYS.includes(value as Renderer);

export { DEFAULT_RENDERER, RENDERERS, RENDERER_KEYS, isRenderer };
export type { Renderer };
