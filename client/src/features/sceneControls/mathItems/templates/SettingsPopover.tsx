import React, { useState, useCallback, useMemo } from "react";
import { Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import SubtleButton from "../../../../util/components/SubtleButton";
import styles from "./SettingsPopover.module.css";
import type { MathItemConfig } from "../configs";
import FieldWidget from "../FieldWidget.tsx";
import CloseButton from "./CloseButton";

interface FormProps {
  config: MathItemConfig;
}

const SettingsForm: React.FC<FormProps> = ({ config }) => {
  const settings = useMemo(
    () => config.properties.filter((p) => !p.primaryOnly),
    [config]
  );
  return (
    <div className={styles["settings-form"]}>
      {settings.map((s) => (
        <React.Fragment key={s.name}>
          <label htmlFor={s.name}>{s.label}</label>
          <FieldWidget widget={s.widget} name={s.name} />
        </React.Fragment>
      ))}
    </div>
  );
};

interface TitleProps {
  config: MathItemConfig;
  onClick: React.MouseEventHandler<HTMLButtonElement>
}

const SettingsTitle: React.FC<TitleProps> = (props) => (
  <div className={styles["settings-title"]}>
    {props.config.label} Settings
    <CloseButton onClick={props.onClick} />
  </div>
);

interface SettingsPopoverProps {
  config: MathItemConfig;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ config }) => {
  const [visible, setVisible] = useState(false);
  const setVisibleTrue = useCallback(() => setVisible(true), []);
  const setVisibleFalse = useCallback(() => setVisible(false), []);
  const handleVisibleChange = useCallback((isVisible: boolean) => {
    setVisible(isVisible);
  }, []);
  return (
    <Popover
      content={<SettingsForm config={config} />}
      title={<SettingsTitle config={config} onClick={setVisibleFalse} />}
      placement='right'
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
