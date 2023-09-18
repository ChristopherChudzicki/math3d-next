import { Vector3 } from "three";
import type { Coords } from "./graphics/interfaces";

class DollyZoom {
  constructor(private zoomFactor: number) {
    this.zoomFactor = zoomFactor;
  }

  private static dollyZoom(zoom: number, position: Coords, target: Coords) {
    const t = new Vector3(...target);
    const p = new Vector3(...position);
    const diff = p.clone().sub(t);
    return p.add(diff.multiplyScalar(zoom - 1));
  }

  private static zoomFoV = (fovDegrees: number, zoom: number) => {
    return (
      (2 *
        Math.atan(Math.tan((0.5 * fovDegrees * Math.PI) / 180) / zoom) *
        180) /
      Math.PI
    );
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
