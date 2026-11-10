import { screenDPR, screenSize } from "three/tsl";
import { FOV } from "../camera";

const TAN_HALF_FOV = Math.tan(((FOV / 2) * Math.PI) / 180);

/**
 * View units per CSS pixel at view depth 1 (MathBox's `worldUnit`). A mark
 * sized with it is fixed in view space, so it shrinks on screen with
 * distance, as MathBox's do.
 */
export const viewUnitsPerPixel = screenDPR
  .mul(2 * TAN_HALF_FOV)
  .div(screenSize.y);
