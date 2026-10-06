import { Icon } from "@iconify/react/offline";
import settings from "@iconify-icons/lucide/settings";
import type {
  MathItem,
  MathItemConfig,
  MathItemType,
  PropertyConfig,
} from "@math3d/mathitem-configs";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import IconButton from "@/ui/IconButton";
import { Popover } from "@/ui/Popover";
import circleHelp from "@iconify-icons/lucide/circle-help";
import Markdown from "@/ui/Markdown";
import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { useMathScope, select } from "../sceneSlice";
import { getMathProperties, useMathErrors } from "../mathScope";
import CloseButton from "./CloseButton";
import styles from "./SettingsPopover.module.css";
import { OnWidgetChange } from "../FieldWidget/types";

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
        <Markdown id={tipId} className={styles["tip-row"]}>
          {field.description}
        </Markdown>
      ) : null}
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
  const defaultZOrder = useSelector(select.defaultGraphicOrder);

  return (
    <div className={styles["settings-form"]}>
      {fields.map(({ field, value }) => {
        const extras =
          field.name === "zOrder"
            ? { placeholder: `${defaultZOrder[item.id]}` }
            : {};
        return (
          <SettingsField
            key={field.name}
            itemId={item.id}
            field={field}
            value={value}
            error={errors[field.name]}
            onWidgetChange={onWidgetChange}
            {...extras}
          />
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
