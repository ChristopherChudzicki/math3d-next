import { useAppStore } from "@/store/hooks";
import { useSyncExternalStore } from "react";
import type { AppMathScope } from "./interfaces";

const useMathScope = (): AppMathScope => {
  const { mathScope } = useAppStore();
  return useSyncExternalStore(mathScope.subscribe, mathScope.get);
};

export { useMathScope };
