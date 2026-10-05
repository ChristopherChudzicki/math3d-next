import React from "react";
import classNames from "classnames";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import * as styles from "./Slider.module.css";

type SliderProps = Omit<BaseSlider.Root.Props<number>, "className"> & {
  /** The thumb's accessible name. */
  "aria-label"?: string;
  className?: string;
};

/**
 * A single-value slider. Props other than `aria-label` and `className` go to
 * Base UI's Slider.Root; its default `largeStep` (Page Up/Down) is 10 in value
 * units, so set it relative to the range.
 */
const Slider: React.FC<SliderProps> = ({
  "aria-label": ariaLabel,
  className,
  ...others
}) => (
  <BaseSlider.Root {...others} className={classNames(styles.root, className)}>
    <BaseSlider.Control className={styles.control}>
      <BaseSlider.Track className={styles.track}>
        <BaseSlider.Indicator className={styles.indicator} />
        <BaseSlider.Thumb aria-label={ariaLabel} className={styles.thumb} />
      </BaseSlider.Track>
    </BaseSlider.Control>
  </BaseSlider.Root>
);

export default Slider;
export type { SliderProps };
