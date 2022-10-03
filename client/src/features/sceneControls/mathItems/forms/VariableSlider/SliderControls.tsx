import React, { useCallback } from "react";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import PauseIcon from "@mui/icons-material/Pause";
import FastRewindOutlinedIcon from "@mui/icons-material/FastRewindOutlined";
import FastForwardOutlinedIcon from "@mui/icons-material/FastForwardOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
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
}

const pauseIconAdjustSx = { transform: "scale(0.8)" };

const SliderControls: React.FC<SliderControlsProps> = ({
  onAnimationChange,
  isAnimating,
  speed,
  onSpeedChange,
  onStep,
}) => {
  const handleAnimationChange = useCallback(() => {
    onAnimationChange(!isAnimating);
  }, [onAnimationChange, isAnimating]);

  const canIncrease = !!findSpeed(speed.value, +1);
  const canDecrease = !!findSpeed(speed.value, -1);
  const onIncrease = useCallback(
    () => onSpeedChange(mustFindSpeed(speed.value, +1)),
    [onSpeedChange, speed]
  );
  const onDecrease = useCallback(
    () => onSpeedChange(mustFindSpeed(speed.value, -1)),
    [onSpeedChange, speed]
  );
  const onStepUp = useCallback(() => onStep(+1), [onStep]);
  const onStepDown = useCallback(() => onStep(-1), [onStep]);

  return (
    <div className="d-flex align-items-center">
      <IconButton
        size="small"
        className={styles.playButton}
        onClick={handleAnimationChange}
        title={isAnimating ? btnLabels.pause : btnLabels.play}
        aria-label={isAnimating ? btnLabels.pause : btnLabels.play}
      >
        {isAnimating ? (
          <PauseIcon fontSize="small" sx={pauseIconAdjustSx} />
        ) : (
          <PlayArrowOutlinedIcon fontSize="small" />
        )}
      </IconButton>
      <ButtonGroup
        className={styles.speedGroup}
        size="small"
        variant="outlined"
      >
        <Button
          className={styles.speedControls}
          color="secondary"
          variant="outlined"
          onClick={onDecrease}
          disabled={!canDecrease}
          aria-label={btnLabels.slower}
        >
          <FastRewindOutlinedIcon fontSize="small" />
        </Button>
        <Button
          className={classNames(styles.speedControls, styles.display)}
          color="secondary"
          variant="outlined"
          disabled
        >
          {speed.label}x
        </Button>
        <Button
          className={styles.speedControls}
          color="secondary"
          variant="outlined"
          onClick={onIncrease}
          disabled={!canIncrease}
          aria-label={btnLabels.faster}
        >
          <FastForwardOutlinedIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <ButtonGroup color="secondary" variant="outlined">
        <Button
          className={styles.stepControls}
          variant="outlined"
          onClick={onStepDown}
          aria-label={btnLabels.decrement}
        >
          <RemoveOutlinedIcon fontSize="small" />
        </Button>
        <Button
          className={styles.stepControls}
          color="secondary"
          variant="outlined"
          aria-label={btnLabels.increment}
          onClick={onStepUp}
        >
          <AddOutlinedIcon fontSize="small" />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default SliderControls;
export { mustFindSpeed };
export type { SliderControlsProps, SpeedOption };
