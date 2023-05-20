import React, { useState, useMemo, useRef } from "react";
import MuiPopper, { PopperProps } from "@mui/material/Popper";
import { styled, useTheme } from "@mui/material/styles";
import Fade from "@mui/material/Fade";
import classNames from "classnames";
import FocusTrap from "@mui/base/FocusTrap";
import { TransitionProps } from "@mui/material/transitions";
import usePointerAway from "./usePointerAway";
import style from "./Popover.module.css";

/**
 * Adapted from https://github.com/mui/material-ui/blob/27f1c282cf4a8c5b5aa175b8b594d3a726a8474b/docs/data/material/components/popper/ScrollPlayground.js#L19
 */
const Popper = styled(MuiPopper, {
  shouldForwardProp: () => true,
})({
  zIndex: 1,
  "& > div": {
    position: "relative",
  },
  '&[data-popper-placement*="bottom"]': {
    "& > div": {
      marginTop: 2,
    },
    "& .MuiPopper-arrow": {
      top: 0,
      left: 0,
      marginTop: "-0.9em",
      width: "3em",
      height: "1em",
      "&::before": {
        borderWidth: "0 1em 1em 1em",
        borderColor:
          "transparent transparent var(--popover-background) transparent",
      },
    },
  },
  '&[data-popper-placement*="top"]': {
    "& > div": {
      marginBottom: 2,
    },
    "& .MuiPopper-arrow": {
      bottom: 0,
      left: 0,
      marginBottom: "-0.9em",
      width: "3em",
      height: "1em",
      "&::before": {
        borderWidth: "1em 1em 0 1em",
        borderColor:
          "var(--popover-background) transparent transparent transparent",
      },
    },
  },
  '&[data-popper-placement*="right"]': {
    "& > div": {
      marginLeft: 2,
    },
    "& .MuiPopper-arrow": {
      left: 0,
      marginLeft: "-0.9em",
      height: "3em",
      width: "1em",
      "&::before": {
        borderWidth: "1em 1em 1em 0",
        borderColor:
          "transparent var(--popover-background) transparent transparent",
      },
    },
  },
  '&[data-popper-placement*="left"]': {
    "& > div": {
      marginRight: 2,
    },
    "& .MuiPopper-arrow": {
      right: 0,
      marginRight: "-0.9em",
      height: "3em",
      width: "1em",
      "&::before": {
        borderWidth: "1em 0 1em 1em",
        borderColor:
          "transparent transparent transparent var(--popover-background)",
      },
    },
  },
});

const Arrow = styled("div")({
  position: "absolute",
  fontSize: 7,
  width: "3em",
  height: "3em",
  "&::before": {
    content: '""',
    margin: "auto",
    display: "block",
    width: 0,
    height: 0,
    borderStyle: "solid",
  },
});

interface PopoverProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  closeButton?: React.ReactNode;
  modifiers?: PopperProps["modifiers"];
  onPointerAway?: () => void;
  transitionDuration?: number;
  trigger: React.ReactElement;
  visible: boolean;
  placement?: PopperProps["placement"];
}

const noOp = () => {};

/**
 * A Popover component based on MUI's [`Popper`](https://mui.com/material-ui/react-popper/)
 * interface.
 */
const Popover: React.FC<PopoverProps> = ({
  as: Component = "div",
  visible,
  trigger,
  children,
  className,
  placement,
  transitionDuration,
  onPointerAway = noOp,
  modifiers = [],
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [arrowEl, setArrowEl] = useState<HTMLElement | null>(null);
  const allModifiers = useMemo(
    () => [
      ...modifiers,
      {
        name: "arrow",
        enabled: true,
        options: {
          element: arrowEl,
        },
      },
      {
        name: "offset",
        enabled: true,
        options: {
          offset: [0, 24],
        },
      },
    ],
    [arrowEl, modifiers]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  usePointerAway(containerRef, onPointerAway);
  const contents = (
    <Component
      ref={containerRef}
      className={classNames(style.container, className)}
    >
      <Arrow ref={setArrowEl} className="MuiPopper-arrow" />
      <FocusTrap open={visible}>
        <div tabIndex={-1}>{children}</div>
      </FocusTrap>
    </Component>
  );
  const theme = useTheme();
  const duration = transitionDuration ?? theme.transitions.duration.standard;
  const transition = duration > 0;
  return (
    <>
      <Popper
        modifiers={allModifiers}
        open={visible}
        anchorEl={anchorEl}
        transition={transition}
        disablePortal
        placement={placement}
      >
        {transition
          ? (props: { TransitionProps: TransitionProps }) => (
              <Fade {...props.TransitionProps} timeout={duration}>
                <div>
                  <FocusTrap open={visible}>{contents}</FocusTrap>
                </div>
              </Fade>
            )
          : contents}
      </Popper>
      {React.cloneElement(trigger, { ref: setAnchorEl })}
    </>
  );
};

export default Popover;
export type { PopoverProps };
