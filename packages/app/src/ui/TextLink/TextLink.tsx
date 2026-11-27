import React from "react";
import classNames from "classnames";
import Anchor from "@/ui/Anchor";
import type { AnchorComponent, AnchorProps } from "@/ui/Anchor";
import * as styles from "./TextLink.module.css";

/**
 * An underlined link, for running text and standalone navigation alike. `to`
 * for a route in the app, or `href` for a plain anchor (another site, or a
 * deliberate full-page load).
 */
const TextLink = (({ className, ...others }: AnchorProps) => (
  <Anchor {...others} className={classNames(styles.text, className)} />
)) as AnchorComponent;

type TextLinkProps = React.ComponentProps<typeof TextLink>;

export default TextLink;
export type { TextLinkProps };
