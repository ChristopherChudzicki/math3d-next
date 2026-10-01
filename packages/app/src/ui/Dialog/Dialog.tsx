import React from "react";
import classNames from "classnames";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Icon } from "@iconify/react/offline";
import xIcon from "@iconify-icons/lucide/x";
import IconButton from "../IconButton";
import * as styles from "./Dialog.module.css";

const { Root, Trigger, Close } = BaseDialog;

type DialogSize = "sm" | "md" | "lg";

type PopupProps = Omit<BaseDialog.Popup.Props, "className"> & {
  /** Width: sm for confirmations, md for forms, lg for browsing. */
  size?: DialogSize;
  className?: string;
};

/**
 * The dialog surface, with its portal, backdrop, and viewport. Keeps the popup
 * on screen; put long content in `Body`, which scrolls.
 */
const Popup: React.FC<PopupProps> = ({ size = "md", className, ...others }) => (
  <BaseDialog.Portal>
    <BaseDialog.Backdrop className={styles.backdrop} />
    <BaseDialog.Viewport className={styles.viewport}>
      <BaseDialog.Popup
        {...others}
        className={classNames(styles.popup, styles[size], className)}
      />
    </BaseDialog.Viewport>
  </BaseDialog.Portal>
);

type HeaderProps = React.ComponentProps<"div"> & {
  /** Label for the close button. */
  closeLabel?: string;
  /**
   * Disables the close button, e.g. while a submit can't be abandoned. Escape
   * and backdrop clicks still go to `Root`'s `onOpenChange`; ignore them there.
   */
  closeDisabled?: boolean;
};

/**
 * Title row with a close button. Modal dialogs need a close button inside the
 * popup so touch screen reader users can leave it.
 */
const Header: React.FC<HeaderProps> = ({
  closeLabel = "Close",
  closeDisabled = false,
  className,
  children,
  ...others
}) => (
  <div {...others} className={classNames(styles.header, className)}>
    <div className={styles.headerText}>{children}</div>
    <Close
      disabled={closeDisabled}
      render={
        <IconButton label={closeLabel}>
          <Icon icon={xIcon} aria-hidden="true" />
        </IconButton>
      }
    />
  </div>
);

type TitleProps = Omit<BaseDialog.Title.Props, "className"> & {
  className?: string;
};

const Title: React.FC<TitleProps> = ({ className, ...others }) => (
  <BaseDialog.Title
    {...others}
    className={classNames(styles.title, className)}
  />
);

type DescriptionProps = Omit<BaseDialog.Description.Props, "className"> & {
  className?: string;
};

const Description: React.FC<DescriptionProps> = ({ className, ...others }) => (
  <BaseDialog.Description
    {...others}
    className={classNames(styles.description, className)}
  />
);

const Body: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...others
}) => <div {...others} className={classNames(styles.body, className)} />;

/**
 * Wraps `Body` and `Actions` in a form dialog, so a submit button in the
 * footer submits the fields in the body.
 */
const Form: React.FC<React.ComponentProps<"form">> = ({
  className,
  ...others
}) => <form {...others} className={classNames(styles.form, className)} />;

/**
 * The footer's buttons, right-aligned. Put the primary action last, so it sits
 * at the trailing edge.
 */
const Actions: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...others
}) => <div {...others} className={classNames(styles.actions, className)} />;

export {
  Root,
  Trigger,
  Close,
  Popup,
  Header,
  Title,
  Description,
  Body,
  Form,
  Actions,
};
export type { DialogSize, PopupProps, HeaderProps };
