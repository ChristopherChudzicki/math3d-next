import React from "react";
import { Icon } from "@iconify/react/offline";
import rotateCcw from "@iconify-icons/lucide/rotate-ccw";
import { Spinner } from "@/ui/LoadingSpinner";
import Button from "./Button";
import type { ButtonProps } from "./Button";

type RetryButtonProps = Omit<ButtonProps, "loading" | "children"> & {
  retrying: boolean;
};

/**
 * "Try again", which keeps focus while the retry is in flight. The spinner
 * takes the icon's place, so the button keeps its width.
 */
const RetryButton: React.FC<RetryButtonProps> = ({ retrying, ...others }) => (
  <Button {...others} loading={retrying}>
    {retrying ? (
      <Spinner size="1em" />
    ) : (
      <Icon icon={rotateCcw} aria-hidden="true" />
    )}
    Try again
  </Button>
);

export default RetryButton;
