import {
  MathItem,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import React, { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";

import { actions } from "../sceneSlice";
import AutosizeText from "./AutosizeText";
import ColorWidget from "./ColorWidget";
import MathAssignment from "./MathAssignment";
import MathBoolean from "./MathBoolean";
import MathValue from "./MathValue";
import TextInput from "./TextInput";
import { IWidgetProps, OnWidgetChange, Parseable } from "./types";
import ErrorTooltip from "./ErrorTooltip";

type WidgetProps = IWidgetProps & {
  // This seems like a false positive
  // eslint-disable-next-line react/no-unused-prop-types
  widget: WidgetType;
};

const getWidgetComponent = (props: WidgetProps) => {
  if (props.widget === WidgetType.MathValue) return <MathValue {...props} />;
  if (props.widget === WidgetType.MathBoolean)
    return <MathBoolean {...props} />;
  if (props.widget === WidgetType.Color) return <ColorWidget {...props} />;
  if (props.widget === WidgetType.AutosizeText)
    return <AutosizeText {...props} />;
  if (props.widget === WidgetType.Text) return <TextInput {...props} />;
  throw new Error(`Unrecognized form widget`);
};

const FieldWidget: React.FC<WidgetProps> = (props) => {
  const widgetComponent = getWidgetComponent(props);
  return <ErrorTooltip error={props.error}>{widgetComponent}</ErrorTooltip>;
};

export default FieldWidget;

export const useOnWidgetChange = <T extends MIT>(item: MathItem<T>) => {
  const dispatch = useAppDispatch();
  const onWidgetChange: OnWidgetChange<Parseable> = useCallback(
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

export { MathAssignment };
export type { WidgetProps };
