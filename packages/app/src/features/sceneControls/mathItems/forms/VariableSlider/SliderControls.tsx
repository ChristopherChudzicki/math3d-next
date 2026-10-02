import React, { useCallback } from "react";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import PauseIcon from "@mui/icons-material/Pause";
import FastRewindOutlinedIcon from "@mui/icons-material/FastRewindOutlined";
import FastForwardOutlinedIcon from "@mui/icons-material/FastForwardOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
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
        className={styles.control}
        onClick={handleAnimationChange}
        title={isAnimating ? btnLabels.pause : btnLabels.play}
        label={isAnimating ? btnLabels.pause : btnLabels.play}
      >
        {isAnimating ? (
          <PauseIcon fontSize="inherit" className={styles.pauseIcon} />
        ) : (
          <PlayArrowOutlinedIcon fontSize="inherit" />
        )}
      </IconButton>
      <ButtonGroup aria-label="Speed">
        <IconButton
          variant="outline"
          size="sm"
          className={styles.control}
          onClick={onDecrease}
          disabled={!canDecrease}
          label={btnLabels.slower}
        >
          <FastRewindOutlinedIcon fontSize="inherit" />
        </IconButton>
        <output className={styles.speed}>{speed.label}x</output>
        <IconButton
          variant="outline"
          size="sm"
          className={styles.control}
          onClick={onIncrease}
          disabled={!canIncrease}
          label={btnLabels.faster}
        >
          <FastForwardOutlinedIcon fontSize="inherit" />
        </IconButton>
      </ButtonGroup>
      <ButtonGroup aria-label="Step">
        <IconButton
          variant="outline"
          size="sm"
          className={styles.control}
          onClick={onStepDown}
          label={btnLabels.decrement}
        >
          <RemoveOutlinedIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          variant="outline"
          size="sm"
          className={styles.control}
          onClick={onStepUp}
          label={btnLabels.increment}
        >
          <AddOutlinedIcon fontSize="inherit" />
        </IconButton>
      </ButtonGroup>
    </div>
  );
};

export default SliderControls;
export { mustFindSpeed };
export type { SliderControlsProps, SpeedOption };
