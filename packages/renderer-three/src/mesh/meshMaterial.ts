import { DoubleSide, MeshBasicNodeMaterial } from "three/webgpu";
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
  userData,
  vec3,
  vec4,
} from "three/tsl";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { projectWithDepthStyle } from "../shader/depthStyle";

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

// three's types give `userData` no node type; this casts to the one asked for.
const read = (property: Exclude<keyof MeshUniforms, "set">) =>
  userData(`mesh.${property}`, "float") as unknown as Node<"float">;

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

const materials = new Map<string, MeshBasicNodeMaterial>();

/**
 * A triangle mesh's material, shared by every mesh with that shading and
 * transparency. The mesh supplies the attributes `TriangleMesh` writes
 * (`MeshBuffers`) and its depth style at `userData.mesh`.
 */
export const meshMaterial = (
  shaded: boolean,
  transparent: boolean,
): MeshBasicNodeMaterial => {
  const key = `${shaded}/${transparent}`;
  let material = materials.get(key);
  if (!material) {
    material = new MeshBasicNodeMaterial();
    const color = attribute<"vec4">("color", "vec4");
    material.colorNode = shaded ? mathboxShading(color, viewNormal()) : color;
    // MathBox discards where the interpolated color has no opacity.
    material.maskNode = color.a.greaterThan(0);
    material.vertexNode = projectWithDepthStyle(
      positionView,
      read("zBias"),
      read("zIndex"),
    );
    // Double-sided, and writing depth even when translucent, like MathBox's
    // surfaces.
    material.transparent = transparent;
    material.side = DoubleSide;
    materials.set(key, material);
  }
  return material;
};
