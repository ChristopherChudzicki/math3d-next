import { useState, useCallback, useMemo } from "react";

interface Toggler {
  toggle: () => void;
  on: () => void;
  off: () => void;
  (value: boolean): void;
}

const useToggle = (initialValue: boolean): [boolean, Toggler] => {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);

  const toggler: Toggler = useMemo(() => {
    return Object.assign((v: boolean) => setValue(v), {
      on,
      off,
      toggle,
      set: setValue,
    });
    // This is safe because none of the above have any dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, toggler];
};

export default useToggle;
