import { useEffect } from "react";
import { assertNotNil } from "@/util/predicates";

/**
 * Insert a stylesheet into a ShadowDOM.
 *
 * Motivation: Customizing classes (e.g., min-height) in MathLive. Not ideal,
 * but the only way to do it without changing library.
 */
const useShadowStylesheet = (
  shadowHost: HTMLElement | null,
  stylesheet: string
) => {
  useEffect(() => {
    if (!shadowHost) return () => {};
    const element = document.createElement("style");
    element.innerHTML = stylesheet;
    assertNotNil(shadowHost.shadowRoot);
    shadowHost.shadowRoot.appendChild(element);
    return () => element.remove();
  }, [shadowHost, stylesheet]);
};

export default useShadowStylesheet;
