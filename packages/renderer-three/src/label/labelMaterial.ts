/**
 * The label quad: an atlas raster at its pixel size, centered on its anchor
 * plus an offset in CSS pixels, after MathBox's `sprite.position` and
 * `label.outline` shaders.
 */
import { Texture, Vector2, Vector4 } from "three/webgpu";
import {
  attribute,
  mix,
  modelViewMatrix,
  positionGeometry,
  screenDPR,
  screenSize,
  select,
  sqrt,
  texture,
  uniform,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { projectWithDepthStyle } from "../shader/depthStyle";
import { sharedMaterial, uniformsAt } from "../shader/material";
import type { Transparency } from "../shader/material";
import type { Layout, Template } from "../instances/Instances";

/** Per label: its anchor, then its atlas slot as x, y, width, height. */
export const LABEL_LAYOUT = [
  ["labelAnchor", 3],
  ["labelSlot", 4],
] as const satisfies Layout;

/** A unit square, corners at 0 and 1, wound counterclockwise. */
export const QUAD_TEMPLATE: Template = {
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
  index: [0, 1, 2, 2, 1, 3],
};

/** The shared atlas, as the shader reads it. `atlas.ts` keeps these current. */
export const atlasInputs = {
  texture: texture(new Texture()),
  /** In device pixels. */
  size: uniform(new Vector2(1, 1)),
  /** Device pixels per CSS pixel in the rasters. */
  pixelRatio: uniform(1),
};

/**
 * One `Labels`' style as shader inputs, at `userData.label` on its mesh,
 * where the shared material reads it per mesh.
 */
export class LabelUniforms {
  /** RGBA as the spec gives it: `ThreeScene` outputs colors unconverted. */
  readonly color = new Vector4();

  /** CSS pixels, +y up the screen. */
  readonly offset = new Vector2();

  zBias = 0;

  zIndex = 0;
}

const read = uniformsAt<LabelUniforms>("label");

const build = () => {
  const color = read("color", "vec4");
  const anchor = modelViewMatrix.mul(
    vec4(attribute<"vec3">("labelAnchor", "vec3"), 1),
  ).xyz;
  const clip = projectWithDepthStyle(
    anchor,
    read("zBias", "float"),
    read("zIndex", "float"),
  );
  const slot = attribute<"vec4">("labelSlot", "vec4");

  // A raster drawn at another pixel ratio than the screen's keeps its CSS size.
  const size = slot.zw.mul(screenDPR.div(atlasInputs.pixelRatio));
  // In device pixels from the bottom left.
  const center = clip.xy
    .div(clip.w)
    .mul(0.5)
    .add(0.5)
    .mul(screenSize)
    .add(read("offset", "vec2").mul(screenDPR));
  // On whole pixels, so that each texel lands on one.
  const corner = center.sub(size.mul(0.5)).round();
  const ndc = corner
    .add(positionGeometry.xy.mul(size))
    .div(screenSize)
    .mul(2)
    .sub(1);
  const vertex = select(
    clip.w.greaterThan(0),
    vec4(ndc.mul(clip.w), clip.z, clip.w),
    // Behind a perspective camera: outside the clip volume.
    vec4(0, 0, 2, 1),
  );

  const uv = varying(
    slot.xy
      .add(vec2(positionGeometry.x, positionGeometry.y.oneMinus()).mul(slot.zw))
      .div(atlasInputs.size),
  );
  const coverage = atlasInputs.texture.sample(uv);
  const text = coverage.r;
  const outlined = coverage.g;
  // MathBox's `label.outline`: the text over a white outline, mixed in
  // squared color.
  const rgb = sqrt(mix(vec3(1), color.rgb.mul(color.rgb), text));
  return {
    vertex,
    color: vec4(rgb, outlined.mul(color.a)),
    mask: outlined.greaterThan(0),
  };
};

const material = sharedMaterial("uniform", build);

/**
 * The material labels share. Its alpha is the text's and the outline's
 * antialiasing; a label has no opacity of its own.
 */
export const labelMaterial = (transparency: Transparency) =>
  material("edges", transparency);
