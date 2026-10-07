import { MathItem, MathItemType as MIT } from "@math3d/mathitem-configs";
import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { actions } from "../sceneSlice";
import { OnWidgetChange } from "./types";

export const useOnWidgetChange = <T extends MIT>(item: MathItem<T>) => {
  const dispatch = useAppDispatch();
  const onWidgetChange: OnWidgetChange = useCallback(
    (e, clean) => {
      const properties = { [e.name]: e.value };
      const patch = { id: item.id, properties, type: item.type };
      dispatch(actions.setProperties(patch, clean));
    },
    [dispatch, item.id, item.type],
  );
  return onWidgetChange;
};

type PatchPropertyOnChange = (
  e: {
    name: string;
    value: unknown;
  },
  subpath: string,
  clean?: boolean,
) => void;

export const usePatchPropertyOnChange = <T extends MIT>(item: MathItem<T>) => {
  const dispatch = useAppDispatch();
  const onWidgetChange: PatchPropertyOnChange = useCallback(
    (e, subpath, clean) => {
      const path = `/${e.name}/${subpath}`;
      dispatch(
        actions.patchProperty({ id: item.id, path, value: e.value }, clean),
      );
    },
    [dispatch, item.id],
  );
  return onWidgetChange;
};
