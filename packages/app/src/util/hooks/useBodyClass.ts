import { useEffect } from "react";

const useBodyClass = (className: string) => {
  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
};

export default useBodyClass;
