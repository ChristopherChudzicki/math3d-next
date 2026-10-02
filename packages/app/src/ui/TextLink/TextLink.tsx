import React from "react";
import classNames from "classnames";
import Anchor from "../Anchor";
import type { AnchorProps } from "../Anchor";
import * as styles from "./TextLink.module.css";

/**
 * `to` for a route in the app, or `href` for a plain anchor (another site, or
 * a deliberate full-page load).
 */
type TextLinkProps = AnchorProps;

/** An underlined link, for running text and standalone navigation alike. */
const TextLink: React.FC<TextLinkProps> = ({ className, ...others }) => (
  <Anchor {...others} className={classNames(styles.text, className)} />
);

export default TextLink;
export type { TextLinkProps };
