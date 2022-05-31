import { useEffect } from "react";
import { MathfieldElement } from "mathlive";
import { MathfieldEventName, MathfieldHandlers } from "./types";

type AddEventListenerParams = Parameters<Element["addEventListener"]>;
/**
 * Add an event listener to a MathField element
 */
const useListenToEvent = <T extends MathfieldEventName>(
  element: MathfieldElement | null,
  name: T,
  listener?: MathfieldHandlers[T],
  options?: AddEventListenerParams[2]
) => {
  useEffect(() => {
    if (!element) return () => {};
    if (!listener) return () => {};
    const h = listener as () => void;
    element.addEventListener(name, h, options);
    return () => {
      element.removeEventListener(name, h, options);
    };
  }, [element, name, listener, options]);
};

export { useListenToEvent };
