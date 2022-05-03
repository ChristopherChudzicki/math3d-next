import React, { useState, useCallback, useMemo } from "react";
import { Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { SubtleButton } from "util/components";
import type { MathItem, MathItemConfig } from "types";
import { useAppDispatch } from "app/hooks";
import styles from "./SettingsPopover.module.css";
import FieldWidget from "../FieldWidget.tsx";
import CloseButton from "./CloseButton";
import { actions } from '../mathItems.slice'

interface FormProps {
  config: MathItemConfig;
  item: MathItem;
}

const SettingsForm: React.FC<FormProps> = ({ config, item }) => {
  const dispatch = useAppDispatch();
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    if (e.target.name === undefined) {
      throw new Error(`target.name should not be undefined`)
    }
    const properties = {
      [e.target.name]: e.target.value
    }
    const patch = { id: item.id, type: item.type, properties }
    dispatch(actions.setProperties(patch))
  }, [dispatch, item.id, item.type])
  const fields = useMemo(() => {
    const settings = config.properties.filter((p) => !p.primaryOnly);
    return settings.map((field) => {
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
          <FieldWidget widget={field.widget} name={field.name} value={value} onChange={onChange} />
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
