import React from "react";
import classNames from "classnames";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import * as styles from "../Dialog/Dialog.module.css";

const { Root, Close } = BaseAlertDialog;

type RootProps = BaseAlertDialog.Root.Props;

type PopupProps = Omit<BaseAlertDialog.Popup.Props, "className"> & {
  className?: string;
};

/**
 * A confirmation that interrupts: role="alertdialog", and no backdrop dismiss.
 * Styled like Dialog's small size. Nest it inside a Dialog to confirm from one.
 */
const Popup: React.FC<PopupProps> = ({ className, ...others }) => (
  <BaseAlertDialog.Portal>
    <BaseAlertDialog.Backdrop className={styles.backdrop} />
    <BaseAlertDialog.Viewport className={styles.viewport}>
      <BaseAlertDialog.Popup
        {...others}
        className={classNames(styles.popup, styles.sm, styles.alert, className)}
      />
    </BaseAlertDialog.Viewport>
  </BaseAlertDialog.Portal>
);

type TitleProps = Omit<BaseAlertDialog.Title.Props, "className"> & {
  className?: string;
};

const Title: React.FC<TitleProps> = ({ className, ...others }) => (
  <BaseAlertDialog.Title
    {...others}
    className={classNames(styles.title, className)}
  />
);

type DescriptionProps = Omit<BaseAlertDialog.Description.Props, "className"> & {
  className?: string;
};

const Description: React.FC<DescriptionProps> = ({ className, ...others }) => (
  <BaseAlertDialog.Description
    {...others}
    className={classNames(styles.description, className)}
  />
);

/** The footer's buttons, right-aligned. Put the primary action last. */
const Actions: React.FC<React.ComponentProps<"div">> = ({
  className,
  ...others
}) => <div {...others} className={classNames(styles.actions, className)} />;

export { Root, Close, Popup, Title, Description, Actions };
export type { RootProps, PopupProps };
