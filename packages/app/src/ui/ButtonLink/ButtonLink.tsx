import React from "react";
import classNames from "classnames";
import Anchor from "../Anchor";
import type { AnchorProps } from "../Anchor";
import { buttonClassName } from "../Button/Button";
import type { ButtonStyleProps } from "../Button";

/**
 * `to` for a route in the app, or `href` for a plain anchor (another site, or
 * a deliberate full-page load).
 */
type ButtonLinkProps = AnchorProps & ButtonStyleProps;

/**
 * A link that looks like a Button. It stays a plain link to assistive tech,
 * so use it for navigation and Button for actions.
 */
const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant,
  tone,
  size,
  className,
  ...others
}) => (
  <Anchor
    {...others}
    className={classNames(buttonClassName({ variant, tone, size }), className)}
  />
);

export default ButtonLink;
export type { ButtonLinkProps };
