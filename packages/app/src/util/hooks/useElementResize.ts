import { useEffect, useRef } from "react";

const useElementResize = (
  element: Element | null,
  onResize: () => void,
): void => {
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    if (!element) return undefined;
    const observer = new ResizeObserver(() => onResizeRef.current());
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
};

export default useElementResize;
