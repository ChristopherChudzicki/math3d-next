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
import { useSelector } from "react-redux";
import { IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import Markdown from "@/util/components/Markdown";
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
      <label id={labelId} htmlFor={field.name}>
        {field.label}
      </label>
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
          size="small"
          aria-label={`Show ${field.label} Description`}
          aria-pressed={showTip}
          onClick={() => setShowTip((current) => !current)}
        >
          {showTip ? <HelpRoundedIcon /> : <HelpOutlineIcon />}
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
        <section
          data-dndkit-no-drag
          className={styles.container}
          data-testid="more-settings-form"
        >
          <CloseButton
            aria-label="Close"
            className={styles.close}
            onClick={setVisible.off}
          />
          <h3 className={styles.title}>{config.label} Settings</h3>
          <hr className={styles.divider} />
          <SettingsForm item={item} config={config} />
        </section>
      </Popover>
      <SubtleButton
        ref={setAnchorEl}
        onClick={setVisible.toggle}
        aria-label="More Settings"
        className={styles["settings-button"]}
        centered
      >
        <SettingsOutlinedIcon />
      </SubtleButton>
    </>
  );
};

export default SettingsPopover;
