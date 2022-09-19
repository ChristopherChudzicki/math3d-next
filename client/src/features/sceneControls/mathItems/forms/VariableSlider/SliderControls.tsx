import React from "react";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import FastRewindOutlinedIcon from "@mui/icons-material/FastRewindOutlined";
import FastForwardOutlinedIcon from "@mui/icons-material/FastForwardOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import styles from "./SliderControls.module.css";

interface SliderControlsProps {}

const SliderControls: React.FC<SliderControlsProps> = (props) => {
  return (
    <div className="d-flex align-items-center">
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
          <FastRewindOutlinedIcon />
        </Button>
        <Button
          className={styles.speedControls}
          color="secondary"
          variant="outlined"
        >
          <PlayArrowOutlinedIcon />
        </Button>
        <Button
          className={styles.speedControls}
          color="secondary"
          variant="outlined"
        >
          <FastForwardOutlinedIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup size="small" color="secondary" variant="outlined">
        <Button className={styles.stepControls} variant="outlined">
          <RemoveOutlinedIcon />
        </Button>
        <Button
          className={styles.stepControls}
          color="secondary"
          variant="outlined"
        >
          <AddOutlinedIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default SliderControls;
