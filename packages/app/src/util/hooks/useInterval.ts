import { useEffect, useRef } from "react";

const useInterval = (cb: () => void, ms: number | null) => {
  const cbRef = useRef<() => void>(() => {});
  cbRef.current = cb;
  useEffect(() => {
    if (ms === null) return () => {};
    const intervalFn = () => cbRef.current();
    const id = setInterval(intervalFn, ms);
    return () => clearInterval(id);
  }, [ms]);
};

export { useInterval };
