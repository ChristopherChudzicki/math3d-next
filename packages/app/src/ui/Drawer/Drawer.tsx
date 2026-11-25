import React from "react";
import classNames from "classnames";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import renderInertWhileClosing from "@/ui/Dialog/renderInertWhileClosing";
import * as styles from "./Drawer.module.css";

type DrawerSide = "left" | "right";
type DrawerSize = "md" | "lg";

// In px, so fillsScreenQuery matches them: a media query's rem is the
// browser's default font size, not the root's 14px.
const WIDTHS: Record<DrawerSize, number> = {
  md: 336,
  // Three 14rem cards per row, with Body's padding and a 1rem gap.
  lg: 672,
};

type PopupProps = Omit<
  BaseDialog.Popup.Props,
  "className" | "render" | "style"
> & {
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
        render={renderInertWhileClosing}
        className={classNames(styles.popup, className)}
        style={{ width: WIDTHS[size] }}
      />
    </BaseDialog.Viewport>
  </BaseDialog.Portal>
);

/** Matches while a drawer of this size fills the screen's width. */
const fillsScreenQuery = (size: DrawerSize) => `(max-width: ${WIDTHS[size]}px)`;

export {
  Root,
  Trigger,
  Close,
  Header,
  Title,
  Description,
  Body,
  Actions,
} from "@/ui/Dialog/Dialog";
export { Popup, fillsScreenQuery };
export type { DrawerSide, DrawerSize, PopupProps };
