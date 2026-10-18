import { Vector3 } from "three";
import type { Coords } from "./graphics/interfaces";

/**
 * A dolly zoom is a camera effect where the camera simultaneously moves away
 * from the object and zooms in. For large distance/zoom, this tends toward an
 * orthographic projection.
 *
 * MathBox does not support ThreeJS's orthographic camera, so we'll use a dolly
 * zoom to simulate it.
 *
 * Drawbacks
 * =========
 * As currently implemented, the dolly zoom keeps the front clipping plane near
 * the camera. As  the camera moves out (and fov decreases) extra objects may
 * appear that should not be visible.
 * Potentially fixable using https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer.clippingPlanes
 */
class DollyZoom {
  constructor(private zoomFactor: number) {
    this.zoomFactor = zoomFactor;
  }

  private static dollyZoom(zoom: number, position: Coords, target: Coords) {
    const t = new Vector3(...target);
    const p = new Vector3(...position);
    const diff = p.clone().sub(t);
    /**
     * We want to increase the distance to target by a factor of zoom.
     * I.e., we want
     *  P2 - T = zoom * (P1 - T)
     * hence:
     *  P2 = P1 + (P1 - T) * (zoom - 1)
     */
    return p.add(diff.multiplyScalar(zoom - 1));
  }

  /**
   *
   * For perspective camera's frustrum:
   *
   *    FoV at distance d and height h:
   *      FOV(h, d) = 2 * arctan(h / (2 * d))
   *    Height for fov and distance:
   *      h = 2 * d * tan(FOV / 2)
   *
   *
   *  At the first camera position:   d1, h1, fov1
   *  At the second camera position:  d2, h2, fov2
   *
   *  We want to keep the frustum height the same: h1 = h2 = h.
   *  We want to move the camera away from the object by a factor of zoom:
   *  d2 = d1 * zoom.
   *
   * So:
   *  h = 2 * d1 * tan(fov1 / 2)                  [1]
   *  h = 2 * zoom * d1 * tan(fov2 / 2)           [2]
   *
   * Dividing [2] by [1]:
   *  fov2 = 2 * arctan[ tan(fov1 / 2) / zoom]
   *
   *
   */
  private static zoomFoV = (fovDegrees: number, zoom: number) => {
    const rad = Math.PI / 180;
    const fov = fovDegrees * rad;
    const fov2 = 2 * Math.atan(Math.tan(0.5 * fov) / zoom);
    return fov2 / rad;
  };

  in(position: Coords, target: Coords = [0, 0, 0]) {
    return DollyZoom.dollyZoom(1 / this.zoomFactor, position, target);
  }

  out(position: Coords, target: Coords = [0, 0, 0]) {
    return DollyZoom.dollyZoom(this.zoomFactor, position, target);
  }

  outFov(inFov: number) {
    return DollyZoom.zoomFoV(inFov, this.zoomFactor);
  }
}

const ZOOM_FACTOR = 40;
const dolly = new DollyZoom(ZOOM_FACTOR);

const FOV_DOLLY_IN = 60;
const FOV_DOLLY_OUT = dolly.outFov(FOV_DOLLY_IN);

export { dolly, FOV_DOLLY_IN, FOV_DOLLY_OUT, ZOOM_FACTOR };
