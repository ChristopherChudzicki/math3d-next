import React, { useState, useCallback, useMemo } from "react";
import { Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { SubtleButton } from "util/components";
import type { MathItem, MathItemConfig, MathItemType } from "configs";
import styles from "./SettingsPopover.module.css";
import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import CloseButton from "./CloseButton";
import { getMathProperties, useMathErrors } from "../mathScope";

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
  const errors = useMathErrors(item.id, mathPropNames);
  const fields = useMemo(() => {
    return [...config.properties]
      .filter((field) => !field.primaryOnly)
      .map((field) => {
        // @ts-expect-error ts does not know that config and item are correlated
        const value = item.properties[field.name];
        if (typeof value !== "string") {
          throw new Error(`value should be a string; received ${typeof value}`);
        }
        return { field, value };
      });
  }, [config, item.properties]);
  return (
    <div className={styles["settings-form"]}>
      {fields.map(({ field, value }) => (
        <React.Fragment key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          <FieldWidget
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
        className={styles["settings-button"]}
        onClick={setVisibleTrue}
      >
        <SettingOutlined />
      </SubtleButton>
    </Popover>
  );
};

export default SettingsPopover;
