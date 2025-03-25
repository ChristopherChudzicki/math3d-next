import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { SubtleButton } from "@/util/components";
import Popover from "@mui/material/Popover";
import type {
  MathItem,
  MathItemConfig,
  MathItemType,
  PropertyConfig,
} from "@math3d/mathitem-configs";
import React, { useMemo } from "react";
import { useToggle } from "@/util/hooks";
import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { useMathScope } from "../sceneSlice";
import { getMathProperties, useMathErrors } from "../mathScope";
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
        throw new Error(`value should be a string; received ${typeof value}`);
      }
      return { field, value };
    });
  }, [config, item.properties]);
  return (
    <div className={styles["settings-form"]}>
      {fields.map(({ field, value }) => (
        <React.Fragment key={field.name}>
          <label id={`${item.id}-${field.name}`} htmlFor={field.name}>
            {field.label}
          </label>
          <FieldWidget
            className={styles["settings-item"]}
            aria-labelledby={`${item.id}-${field.name}`}
            itemId={item.id}
            label={field.label}
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

interface SettingsPopoverProps {
  config: MathItemConfig;
  item: MathItem;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ config, item }) => {
  const [visible, setVisible] = useToggle(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return (
    <>
      <Popover
        anchorEl={anchorEl}
        open={visible}
        className={styles.container}
        onClose={setVisible.off}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        slotProps={{
          root: {
            // @ts-expect-error https://github.com/mui/material-ui/issues/33175
            "data-dndkit-no-drag": true,
          },
        }}
      >
        <section data-dndkit-no-drag className={styles.container}>
          <CloseButton className={styles.close} onClick={setVisible.off} />
          <h3 className={styles.title}>{config.label} Settings</h3>
          <hr className={styles.divider} />
          <SettingsForm item={item} config={config} />
        </section>
      </Popover>
      <SubtleButton
        ref={setAnchorEl}
        onClick={setVisible.toggle}
        aria-label="Show Settings"
        className={styles["settings-button"]}
        centered
      >
        <SettingsOutlinedIcon />
      </SubtleButton>
    </>
  );
};

export default SettingsPopover;
