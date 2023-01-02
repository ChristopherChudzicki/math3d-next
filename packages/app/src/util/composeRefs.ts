import type { ForwardedRef } from "react";

const composeRefs =
  <T>(...refs: ForwardedRef<T>[]) =>
  (instance: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        // eslint-disable-next-line no-param-reassign
        ref.current = instance;
      }
    });
  };

export default composeRefs;
