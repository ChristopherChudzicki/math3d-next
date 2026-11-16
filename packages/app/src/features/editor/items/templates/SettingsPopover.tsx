import { Icon } from "@iconify/react/offline";
import settings from "@iconify-icons/lucide/settings";
import { isMathGraphic } from "@math3d/mathitem-configs";
import type {
  MathGraphic,
  MathItem,
  MathItemConfig,
  MathItemType,
  PropertyConfig,
} from "@math3d/mathitem-configs";
import React, { useMemo } from "react";
import IconButton from "@/ui/IconButton";
import Switch from "@/ui/Switch";
import { useAppDispatch } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { visibilityMode } from "@/store/scene/state/util";
import { Popover } from "@/ui/Popover";
import circleHelp from "@iconify-icons/lucide/circle-help";
import FieldWidget, {
  useOnWidgetChange,
} from "@/features/editor/items/FieldWidget";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useDefaultZOrder } from "@/store/scene/evaluation/zOrders";
import {
  getMathProperties,
  useFinalVisibility,
  useMathErrors,
} from "@/store/scene/evaluation/mathScope";
import { OnWidgetChange } from "@/features/editor/items/FieldWidget/types";
import CloseButton from "./CloseButton";
import styles from "./SettingsPopover.module.css";

interface FormProps<T extends MathItemType> {
  config: MathItemConfig<T>;
  item: MathItem<T>;
}

type SettingsFieldProps = {
  itemId: string;
  field: PropertyConfig<string>;
  value: string;
  error?: Error;
  onWidgetChange: OnWidgetChange;
  placeholder?: string;
};
const SettingsField: React.FC<SettingsFieldProps> = ({
  itemId,
  field,
  onWidgetChange,
  ...others
}) => {
  const labelId = `${itemId}-${field.name}`;
  const tipId = `${itemId}-${field.name}-tip`;
  const [showTip, setShowTip] = React.useState(false);
  return (
    <>
      <span id={labelId}>{field.label}</span>
      <FieldWidget
        aria-labelledby={labelId}
        className={styles["settings-item"]}
        {...(showTip ? { "aria-describedby": tipId } : {})}
        itemId={itemId}
        label={field.label}
        widget={field.widget}
        name={field.name}
        onChange={onWidgetChange}
        {...others}
      />
      {field.description ? (
        <IconButton
          size="sm"
          label={`Show ${field.label} Description`}
          aria-pressed={showTip}
          onClick={() => setShowTip((current) => !current)}
        >
          <Icon icon={circleHelp} aria-hidden="true" />
        </IconButton>
      ) : (
        <span />
      )}
      {showTip ? (
        <p id={tipId} className={styles["tip-row"]}>
          {field.description}
        </p>
      ) : null}
    </>
  );
};

/** Whether the item's Calculated Visibility decides; off, it keeps what's shown. */
const FollowCalculatedVisibility: React.FC<{ item: MathGraphic }> = ({
  item,
}) => {
  const dispatch = useAppDispatch();
  const shown = useFinalVisibility(useMathScope(), item);
  const mode = visibilityMode(item.properties);
  const labelId = `${item.id}-followCalculatedVisibility`;
  return (
    <>
      <span id={labelId}>Follow Calculated Visibility</span>
      <Switch
        aria-labelledby={labelId}
        checked={mode === "following"}
        disabled={mode === "none"}
        onCheckedChange={(checked) => {
          dispatch(
            checked
              ? actions.followCalculatedVisibility({ ids: [item.id] })
              : actions.setProperties({
                  id: item.id,
                  type: item.type,
                  properties: {
                    visible: shown,
                    useCalculatedVisibility: false,
                  },
                }),
          );
        }}
      />
      <span />
    </>
  );
};

const SettingsForm = <T extends MathItemType>({
  config,
  item,
}: FormProps<T>) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathPropNames = useMemo(
    () => getMathProperties(config).map((p) => p.name),
    [config],
  );
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, mathPropNames);
  const fields = useMemo(() => {
    return config.settingsProperties.map((name) => {
      // @ts-expect-error ts does not know name is correlated with properties
      const field: PropertyConfig<string> = config.properties[name];
      // @ts-expect-error ts does not know that config and item are correlated
      const value = item.properties[name];
      if (typeof value !== "string") {
        throw new Error(
          `properties[${name}] should be a string; received ${typeof value}`,
        );
      }
      return { field, value };
    });
  }, [config, item.properties]);
  const defaultZOrder = useDefaultZOrder(item.id);

  return (
    <div className={styles["settings-form"]}>
      {fields.map(({ field, value }) => {
        const extras =
          field.name === "zOrder" ? { placeholder: `${defaultZOrder}` } : {};
        return (
          <React.Fragment key={field.name}>
            <SettingsField
              itemId={item.id}
              field={field}
              value={value}
              error={errors[field.name]}
              onWidgetChange={onWidgetChange}
              {...extras}
            />
            {field.name === "calculatedVisibility" && isMathGraphic(item) ? (
              <FollowCalculatedVisibility item={item} />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface SettingsPopoverProps {
  config: MathItemConfig;
  item: MathItem;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ config, item }) => (
  <Popover.Root>
    <Popover.Trigger
      render={
        <IconButton
          size="sm"
          label="More Settings"
          className={styles["settings-button"]}
        >
          <Icon icon={settings} aria-hidden="true" />
        </IconButton>
      }
    />
    <Popover.Popup
      side="right"
      align="start"
      data-dndkit-no-drag
      data-testid="more-settings-form"
      className={styles.container}
    >
      <Popover.Close
        render={<CloseButton label="Close" className={styles.close} />}
      />
      <Popover.Title>{config.label} Settings</Popover.Title>
      <hr className={styles.divider} />
      <SettingsForm item={item} config={config} />
    </Popover.Popup>
  </Popover.Root>
);

export default SettingsPopover;
