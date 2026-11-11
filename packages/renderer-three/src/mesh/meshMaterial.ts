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
  mix,
  normalize,
  positionView,
  positionViewDirection,
  pow,
  select,
  sqrt,
  transformNormalToView,
  vec3,
  vec4,
} from "three/tsl";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { projectWithDepthStyle } from "../shader/depthStyle";
import { sharedMaterial, uniformsAt } from "../shader/material";
import type { Alpha, Transparency } from "../shader/material";

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

/**
 * MathBox's shaded mesh color (`mesh.fragment.shaded`): a fixed light along
 * (1, 2, 2) in world space, wrapped diffuse and a specular highlight in a
 * lightened copy of the color. Like MathBox, it shades the squared color and
 * outputs the square root (`mesh.gamma.in`/`out`).
 */
const mathboxShading = (
  color: Node<"vec4">,
  normal: Node<"vec3">,
): Node<"vec4"> => {
  const rgb = color.rgb.mul(color.rgb);
  const towardLight = normalize(cameraViewMatrix.mul(vec4(1, 2, 2, 0)).xyz);
  // MathBox's facing test: the triangle's screen-space orientation, not its
  // winding, turns the interpolated normal toward the camera. The fragment
  // stage's `positionView` is rebuilt from the biased clip position, so the
  // view position comes through a varying.
  const view = positionView.toVarying("v_meshView");
  const face = cross(dFdx(view), dFdy(view));
  const side = select(dot(normal, face).greaterThan(0), 1, -1);
  const n = normalize(normal).mul(side);
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

const build = (shaded: boolean) => () => {
  const color = attribute<"vec4">("color", "vec4");
  return {
    vertex: projectWithDepthStyle(
      positionView,
      read("zBias", "float"),
      read("zIndex", "float"),
    ),
    color: shaded ? mathboxShading(color, viewNormal()) : color,
    // MathBox discards where the interpolated color has no opacity.
    mask: color.a.greaterThan(0),
  };
};

const shadedMaterial = sharedMaterial("mixed", build(true));
const flatMaterial = sharedMaterial("mixed", build(false));

/**
 * A triangle mesh's material, shared by every mesh with that shading and
 * alpha. The mesh supplies the attributes `TriangleMesh` writes
 * (`MeshBuffers`) and its depth style at `userData.mesh`.
 */
export const meshMaterial = (
  shaded: boolean,
  alpha: Alpha,
  transparency: Transparency,
) => (shaded ? shadedMaterial : flatMaterial)(alpha, transparency);
