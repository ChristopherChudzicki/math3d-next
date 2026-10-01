import React from "react";
import classNames from "classnames";
import Anchor from "../Anchor";
import type { AnchorProps } from "../Anchor";
import * as styles from "./TextLink.module.css";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * `to` for a route in the app, or `href` for a plain anchor (another site, or
 * a deliberate full-page load).
 */
type TextLinkProps = DistributiveOmit<AnchorProps, "className"> & {
  className?: string;
};

/** An underlined link, for running text and standalone navigation alike. */
const TextLink: React.FC<TextLinkProps> = ({ className, ...others }) => (
  <Anchor
    {...(others as AnchorProps)}
    className={classNames(styles.text, className)}
  />
);

export default TextLink;
export type { TextLinkProps };
