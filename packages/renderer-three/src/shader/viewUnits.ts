import { cameraProjectionMatrix, screenDPR, screenSize, vec4 } from "three/tsl";
import { TAN_HALF_FOV } from "../camera";

/** How the projection scales view x and y. */
export const projectionScale = cameraProjectionMatrix.mul(vec4(1, 1, 0, 0)).xy;

/**
 * View units per CSS pixel at view depth 1 (MathBox's `worldUnit`). A mark
 * sized with it is fixed in view space, so it shrinks on screen with
 * distance, as MathBox's do.
 */
export const viewUnitsPerPixel = screenDPR
  .mul(2 * TAN_HALF_FOV)
  .div(screenSize.y);
