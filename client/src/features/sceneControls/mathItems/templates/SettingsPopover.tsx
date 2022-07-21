import { SettingOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import type {
  MathItem,
  MathItemConfig,
  MathItemType,
  PropertyConfig,
} from "configs";
import React, { useCallback, useMemo, useState } from "react";
import { SubtleButton } from "util/components";

import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { getMathProperties, useMathErrors, useMathScope } from "../mathScope";
import CloseButton from "./CloseButton";
import styles from "./SettingsPopover.module.css";

interface FormProps<T extends MathItemType> {
  config: MathItemConfig<T>;
  item: MathItem<T>;
}

const SettingsForm = <T extends MathItemType>({
  config,
  item,
}: FormProps<T>) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathPropNames = useMemo(
    () => getMathProperties(config).map((p) => p.name),
    [config]
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
        throw new Error(`value should be a string; received ${typeof value}`);
      }
      return { field, value };
    });
  }, [config, item.properties]);
  return (
    <div className={styles["settings-form"]} title="Settings">
      {fields.map(({ field, value }) => (
        <React.Fragment key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          <FieldWidget
            itemId={item.id}
            title={field.label}
            error={errors[field.name]}
            widget={field.widget}
            name={field.name}
            value={value}
            onChange={onWidgetChange}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

interface TitleProps {
  config: MathItemConfig;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

const SettingsTitle: React.FC<TitleProps> = (props) => (
  <div className={styles["settings-title"]}>
    {props.config.label} Settings
    <CloseButton onClick={props.onClick} />
  </div>
);

interface SettingsPopoverProps {
  config: MathItemConfig;
  item: MathItem;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ config, item }) => {
  const [visible, setVisible] = useState(false);
  const setVisibleTrue = useCallback(() => setVisible(true), []);
  const setVisibleFalse = useCallback(() => setVisible(false), []);
  const handleVisibleChange = useCallback((isVisible: boolean) => {
    setVisible(isVisible);
  }, []);
  return (
    <Popover
      content={<SettingsForm item={item} config={config} />}
      title={<SettingsTitle config={config} onClick={setVisibleFalse} />}
      placement="right"
      trigger="click"
      visible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <SubtleButton
        title="Show Settings"
        className={styles["settings-button"]}
        onClick={setVisibleTrue}
      >
        <SettingOutlined />
      </SubtleButton>
    </Popover>
  );
};

export default SettingsPopover;
