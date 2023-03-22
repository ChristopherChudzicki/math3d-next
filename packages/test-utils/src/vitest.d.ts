/* eslint-disable @typescript-eslint/no-empty-interface */
import type { CustomMatchers } from "./nearlyEqual";

declare global {
  namespace Vi {
    interface Assertion extends CustomMatchers {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
  }
}
