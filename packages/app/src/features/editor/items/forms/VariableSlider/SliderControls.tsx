import React, { useCallback } from "react";
import { Icon } from "@iconify/react/offline";
import play from "@iconify-icons/lucide/play";
import pause from "@iconify-icons/lucide/pause";
import rewind from "@iconify-icons/lucide/rewind";
import fastForward from "@iconify-icons/lucide/fast-forward";
import plus from "@iconify-icons/lucide/plus";
import minus from "@iconify-icons/lucide/minus";
import ButtonGroup from "@/ui/ButtonGroup";
import IconButton from "@/ui/IconButton";
import { assertNotNil } from "@/util";
import classNames from "classnames";
import styles from "./SliderControls.module.css";

const btnLabels = {
  pause: "Pause",
  play: "Play",
  faster: "Increase speed",
  slower: "Decrease speed",
  increment: "Step forward",
  decrement: "Step backward",
};

type SpeedOption = {
  value: string;
  label: string;
  numeric: number;
};

const speedOptions: SpeedOption[] = [
  { value: "1/16", label: "1\u204416", numeric: 1 / 16 },
  { value: "1/8", label: "1\u20448", numeric: 1 / 8 },
  { value: "1/4", label: "1\u20444", numeric: 1 / 4 },
  { value: "1/2", label: "1\u20442", numeric: 1 / 2 },
  { value: "3/4", label: "3\u20444", numeric: 3 / 4 },
  { value: "1", label: "1", numeric: 1 },
  { value: "2", label: "2", numeric: 2 },
  { value: "4", label: "4", numeric: 4 },
  { value: "8", label: "8", numeric: 8 },
];

const findSpeed = (speed: string, increment = 0): SpeedOption | undefined => {
  const i = speedOptions.findIndex((o) => o.value === speed);
  if (i < 0) {
    throw new Error(`Could not find speed: ${speed}`);
  }
  const newSpeed = speedOptions[i + increment];
  return newSpeed;
};
const mustFindSpeed = (speed: string, increment = 0): SpeedOption => {
  const newSpeed = findSpeed(speed, increment);
  assertNotNil(newSpeed);
  return newSpeed;
};

interface SliderControlsProps {
  onAnimationChange: (value: boolean) => void;
  isAnimating: boolean;
  speed: SpeedOption;
  onSpeedChange: (speed: SpeedOption) => void;
  onStep: (increment: number) => void;
  className?: string;
}

const SliderControls: React.FC<SliderControlsProps> = ({
  onAnimationChange,
  isAnimating,
  speed,
  onSpeedChange,
  onStep,
  className,
}) => {
  const handleAnimationChange = useCallback(() => {
    onAnimationChange(!isAnimating);
  }, [onAnimationChange, isAnimating]);

  const canIncrease = !!findSpeed(speed.value, +1);
  const canDecrease = !!findSpeed(speed.value, -1);
  const onIncrease = useCallback(
    () => onSpeedChange(mustFindSpeed(speed.value, +1)),
    [onSpeedChange, speed],
  );
  const onDecrease = useCallback(
    () => onSpeedChange(mustFindSpeed(speed.value, -1)),
    [onSpeedChange, speed],
  );
  const onStepUp = useCallback(() => onStep(+1), [onStep]);
  const onStepDown = useCallback(() => onStep(-1), [onStep]);

  return (
    <div className={classNames(styles.controls, className)}>
      <IconButton
        variant="outline"
        size="sm"
        onClick={handleAnimationChange}
        title={isAnimating ? btnLabels.pause : btnLabels.play}
        label={isAnimating ? btnLabels.pause : btnLabels.play}
      >
        {isAnimating ? (
          <Icon icon={pause} aria-hidden="true" />
        ) : (
          <Icon icon={play} aria-hidden="true" />
        )}
      </IconButton>
      <ButtonGroup aria-label="Speed">
        <IconButton
          variant="outline"
          size="sm"
          onClick={onDecrease}
          disabled={!canDecrease}
          label={btnLabels.slower}
        >
          <Icon icon={rewind} aria-hidden="true" />
        </IconButton>
        <output className={styles.speed}>{speed.label}x</output>
        <IconButton
          variant="outline"
          size="sm"
          onClick={onIncrease}
          disabled={!canIncrease}
          label={btnLabels.faster}
        >
          <Icon icon={fastForward} aria-hidden="true" />
        </IconButton>
      </ButtonGroup>
      <ButtonGroup aria-label="Step">
        <IconButton
          variant="outline"
          size="sm"
          onClick={onStepDown}
          label={btnLabels.decrement}
        >
          <Icon icon={minus} aria-hidden="true" />
        </IconButton>
        <IconButton
          variant="outline"
          size="sm"
          onClick={onStepUp}
          label={btnLabels.increment}
        >
          <Icon icon={plus} aria-hidden="true" />
        </IconButton>
      </ButtonGroup>
    </div>
  );
};

export default SliderControls;
export { mustFindSpeed };
export type { SliderControlsProps, SpeedOption };
