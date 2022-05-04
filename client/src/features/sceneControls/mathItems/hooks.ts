import { useCallback } from "react";
import { MathItems, MathItemType as MIT } from "types";
import { useAppDispatch } from "app/hooks";
import type { OnWidgetChange } from "./FieldWidget";
import { actions } from "./mathItems.slice";

const useSetItemProperties = <T extends MIT>(item: MathItems[T]) => {
  const dispatch = useAppDispatch();
  const setItemProperties: OnWidgetChange = useCallback(
    (e) => {
      const properties = { [e.name]: e.value };
      const patch = { id: item.id, type: item.type, properties };
      dispatch(actions.setProperties(patch));
    },
    [dispatch, item.id, item.type]
  );
  return setItemProperties;
};
