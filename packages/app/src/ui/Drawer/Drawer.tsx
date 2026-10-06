import React from "react";
import classNames from "classnames";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import * as styles from "./Drawer.module.css";

type DrawerSide = "left" | "right";
type DrawerSize = "md" | "lg";

type PopupProps = Omit<BaseDialog.Popup.Props, "className"> & {
  /** The screen edge the drawer slides in from. */
  side?: DrawerSide;
  /** Width: md for a form or a list, lg for browsing. */
  size?: DrawerSize;
  className?: string;
};

/**
 * A modal dialog that fills the screen's height at one edge. The backdrop is
 * light, so the page stays visible beside it. Put long content in `Body`,
 * which scrolls.
 */
const Popup: React.FC<PopupProps> = ({
  side = "left",
  size = "md",
  className,
  ...others
}) => (
  <BaseDialog.Portal>
    {/* Rendered when nested too, so each stacked dialog dims the one beneath. */}
    <BaseDialog.Backdrop className={styles.backdrop} forceRender />
    <BaseDialog.Viewport
      className={classNames(styles.viewport, side === "right" && styles.right)}
    >
      <BaseDialog.Popup
        {...others}
        className={classNames(styles.popup, styles[size], className)}
      />
    </BaseDialog.Viewport>
  </BaseDialog.Portal>
);

export {
  Root,
  Trigger,
  Close,
  Header,
  Title,
  Description,
  Body,
  Actions,
} from "../Dialog/Dialog";
export { Popup };
export type { DrawerSide, DrawerSize, PopupProps };
