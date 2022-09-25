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
import styles from "./SliderControls.module.css";

interface SliderControlsProps {
  onAnimationChange: (value: boolean) => void;
  isAnimating: boolean;
  // onSpeedChange: () => void;
  // onStepChange: () => void;
}

const pauseIconAdjustSx = { transform: "scale(0.8)" };

const SliderControls: React.FC<SliderControlsProps> = ({
  onAnimationChange,
  isAnimating,
}) => {
  const handleAnimationChange = useCallback(() => {
    onAnimationChange(!isAnimating);
  }, [onAnimationChange, isAnimating]);
  return (
    <div className="d-flex align-items-center">
      <IconButton
        size="small"
        className={styles.playButton}
        onClick={handleAnimationChange}
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
        >
          <FastRewindOutlinedIcon fontSize="small" />
        </Button>
        <Button
          className={styles.speedControls}
          color="secondary"
          variant="outlined"
          disabled
        >
          2x
        </Button>
        <Button
          className={styles.speedControls}
          color="secondary"
          variant="outlined"
        >
          <FastForwardOutlinedIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <ButtonGroup color="secondary" variant="outlined">
        <Button className={styles.stepControls} variant="outlined">
          <RemoveOutlinedIcon fontSize="small" />
        </Button>
        <Button
          className={styles.stepControls}
          color="secondary"
          variant="outlined"
        >
          <AddOutlinedIcon fontSize="small" />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default SliderControls;
