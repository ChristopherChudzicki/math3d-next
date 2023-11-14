import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback } from "react";
import type { AppMathScope } from "./interfaces";
import * as select from "./selectors";
import { actions } from "./mathItems.slice";

const useMathScope = (): AppMathScope => {
  return useAppSelector(select.mathScope());
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
