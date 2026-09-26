import { useAppDispatch, useAppStore } from "@/store/hooks";
import { useCallback, useSyncExternalStore } from "react";
import type { AppMathScope } from "./interfaces";
import { actions } from "./scene.slice";

const useMathScope = (): AppMathScope => {
  const { mathScope } = useAppStore();
  return useSyncExternalStore(mathScope.subscribe, mathScope.get);
};

const useSetTitle = () => {
  const dispatch = useAppDispatch();
  return useCallback(
    (title: string) => {
      dispatch(actions.setTitle({ title }));
    },
    [dispatch],
  );
};

export { useMathScope, useSetTitle };
