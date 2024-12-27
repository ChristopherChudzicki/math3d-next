import type { Ref, RefCallback } from "react";

/**
 * Compose 2+ refs. Useful when a reusable component needs a ref itself, but
 * consumers may also need the ref.
 */
const composeRefs = <T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> => {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        // eslint-disable-next-line no-param-reassign
        ref.current = value;
      }
    });
  };
};

export default composeRefs;
