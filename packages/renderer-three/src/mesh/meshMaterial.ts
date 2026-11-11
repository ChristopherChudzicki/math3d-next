import type { Node } from "three/webgpu";
import {
  attribute,
  cameraViewMatrix,
  cross,
  dFdx,
  dFdy,
  dot,
  float,
  length,
  max,
  min,
  mix,
  normalize,
  PI,
  positionView,
  positionViewDirection,
  pow,
  saturate,
  select,
  sqrt,
  transformNormalToView,
  vec3,
  vec4,
} from "three/tsl";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { projectWithDepthStyle } from "../shader/depthStyle";
import { sharedMaterial, uniformsAt } from "../shader/material";
import type { Opacity, Transparency } from "../shader/material";

export type MeshStyle = Pick<SurfaceSpec, "shaded" | "zBias" | "zIndex">;

/**
 * One mesh's depth style. It sits at `userData.mesh` on the mesh, where the
 * shared materials read it per mesh.
 */
export class MeshUniforms {
  zBias = 0;

  zIndex = 0;

  set({ zBias, zIndex }: MeshStyle): void {
    this.zBias = zBias;
    this.zIndex = zIndex;
  }
}

const read = uniformsAt<MeshUniforms>("mesh");

/**
 * The view-space normal from the `normal` attribute, normalized. A zero
 * normal gives MathBox's fallback, view-space up.
 */
const viewNormal = () => {
  const normal = attribute<"vec3">("normal", "vec3");
  return select(
    length(normal).greaterThan(0),
    normalize(transformNormalToView(normal)),
    vec3(0, 1, 0),
  ).toVarying("v_meshNormal");
};

/** The light's view-space direction, MathBox's (1, 2, 2) in world space. */
const towardLightView = () =>
  normalize(cameraViewMatrix.mul(vec4(1, 2, 2, 0)).xyz);

/**
 * The interpolated normal turned toward the camera. MathBox's facing test:
 * the triangle's screen-space orientation, not its winding, decides. The
 * fragment stage's `positionView` is rebuilt from the biased clip position,
 * so the view position comes through a varying.
 */
const facingNormal = (normal: Node<"vec3">) => {
  const view = positionView.toVarying("v_meshView");
  const face = cross(dFdx(view), dFdy(view));
  const side = select(dot(normal, face).greaterThan(0), 1, -1);
  return normalize(normal).mul(side);
};

/**
 * MathBox's shaded mesh color (`mesh.fragment.shaded`): a fixed light along
 * (1, 2, 2) in world space, wrapped diffuse and a specular highlight in a
 * lightened copy of the color. Like MathBox, it shades the squared color and
 * outputs the square root (`mesh.gamma.in`/`out`).
 */
const matteShading = (
  color: Node<"vec4">,
  normal: Node<"vec3">,
): Node<"vec4"> => {
  const rgb = color.rgb.mul(color.rgb);
  const towardLight = towardLightView();
  const n = facingNormal(normal);
  const cosine = dot(n, towardLight);
  const diffuse = mix(max(cosine, 0), cosine.mul(0.5).add(0.5), 0.1);
  const halfway = normalize(towardLight.add(positionViewDirection));
  const specular = pow(max(dot(n, halfway), 0), 16);
  const inverse = float(1).sub(rgb);
  const offSpecular = float(1).sub(inverse.mul(inverse));
  const shaded = rgb
    .mul(diffuse.mul(0.9).add(0.05))
    .add(offSpecular.mul(specular).mul(0.25));
  return vec4(sqrt(shaded), color.a);
};

const pow5 = (x: Node<"float">) => {
  const x2 = x.mul(x);
  return x2.mul(x2).mul(x);
};

const ROUGHNESS = 0.35;
// The lights `usegpu/live/scene.ts` gives Use.GPU: ambient 0.6, and a key
// light of intensity 0.8 that its default gray (0.5) halves to 0.4. Use.GPU
// scales directional light, not ambient, by π.
const AMBIENT = 0.6;
const KEY_LIGHT = 0.4;
const F0 = 0.04;

/**
 * A port of Use.GPU's default lit material (`@use-gpu/wgsl`
 * `material/pbr-default`: metalness 0, roughness 0.35) under one key light
 * and ambient light. Burley diffuse and an untinted GGX highlight, applied to
 * the sRGB color as given.
 */
const glossyShading = (
  color: Node<"vec4">,
  normal: Node<"vec3">,
): Node<"vec4"> => {
  const albedo = color.rgb;
  const n = facingNormal(normal);
  const L = towardLightView();
  const V = positionViewDirection;
  const H = normalize(L.add(V));
  const a = float(ROUGHNESS * ROUGHNESS);
  const a2 = a.mul(a);
  const dotNL = saturate(dot(n, L));
  const dotNV = saturate(dot(n, V));
  const dotNH = saturate(dot(n, H));
  const dotLH = saturate(dot(L, H));
  // Schlick, with f90 = max(F0, 1 − roughness), as Use.GPU does.
  const fresnel = float(Math.max(F0, 1 - ROUGHNESS) - F0)
    .mul(pow5(float(1).sub(dotLH)))
    .add(F0);
  // GGX in Use.GPU's `ndfGGX` form.
  const ah = dotNH.mul(a);
  const k = a.div(float(1).sub(dotNH.mul(dotNH)).add(ah.mul(ah)));
  const distribution = k.mul(k).div(PI);
  // Height-correlated Smith visibility.
  const visibility = float(0.5).div(
    dotNL
      .mul(sqrt(dotNV.sub(a2.mul(dotNV)).mul(dotNV).add(a2)))
      .add(dotNV.mul(sqrt(dotNL.sub(a2.mul(dotNL)).mul(dotNL).add(a2))))
      .add(0.00001),
  );
  const f90 = a.mul(2).mul(dotLH).mul(dotLH).add(0.5);
  const scatter = (c: Node<"float">) =>
    f90
      .sub(1)
      .mul(pow5(float(1).sub(c)))
      .add(1);
  const burley = scatter(dotNL).mul(scatter(dotNV)).div(PI);
  const diffuse = albedo.mul(burley).mul(float(1).sub(fresnel));
  const specular = fresnel.mul(distribution).mul(visibility);
  const lit = albedo.mul(AMBIENT).add(
    diffuse
      .add(specular)
      .mul(dotNL)
      .mul(KEY_LIGHT * Math.PI),
  );
  return vec4(lit, color.a);
};

/**
 * How shaded surfaces are lit: `glossy`, brighter than MathBox with a white
 * highlight, or `matte`, as MathBox lights them.
 */
export type Shading = "glossy" | "matte";

const SHADINGS = { glossy: glossyShading, matte: matteShading };

const build = (shading: Shading | null) => () => {
  const color = attribute<"vec4">("color", "vec4");
  return {
    vertex: projectWithDepthStyle(
      positionView,
      read("zBias", "float"),
      read("zIndex", "float"),
    ),
    // Clamped to 1, as the unorm targets do: OIT accumulates in half float,
    // where a color above 1 would brighten the blend at that pixel.
    color: shading ? min(SHADINGS[shading](color, viewNormal()), 1) : color,
    // MathBox discards where the interpolated color has no opacity.
    mask: color.a.greaterThan(0),
  };
};

const materials = {
  glossy: sharedMaterial("mixed", build("glossy")),
  matte: sharedMaterial("mixed", build("matte")),
  flat: sharedMaterial("mixed", build(null)),
};

/**
 * A triangle mesh's material, shared by every mesh with that shading,
 * opacity and transparency model. `shading` applies only when `shaded`. The
 * mesh supplies the attributes `TriangleMesh` writes (`MeshBuffers`) and its
 * depth style at `userData.mesh`.
 */
export const meshMaterial = (
  shaded: boolean,
  opacity: Opacity,
  transparency: Transparency,
  shading: Shading,
) => materials[shaded ? shading : "flat"](opacity, transparency);
