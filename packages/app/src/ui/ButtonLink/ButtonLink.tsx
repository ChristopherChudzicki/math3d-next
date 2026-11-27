import React from "react";
import classNames from "classnames";
import Anchor from "@/ui/Anchor";
import type { AnchorComponent, AnchorProps } from "@/ui/Anchor";
import { buttonClassName } from "@/ui/Button/Button";
import type { ButtonStyleProps } from "@/ui/Button";

/**
 * A link that looks like a Button. It stays a plain link to assistive tech,
 * so use it for navigation and Button for actions. `to` for a route in the
 * app, or `href` for a plain anchor (another site, or a deliberate full-page
 * load).
 */
const ButtonLink = (({
  variant,
  tone,
  size,
  className,
  ...others
}: AnchorProps & ButtonStyleProps) => (
  <Anchor
    {...others}
    className={classNames(buttonClassName({ variant, tone, size }), className)}
  />
)) as AnchorComponent<ButtonStyleProps>;

type ButtonLinkProps = React.ComponentProps<typeof ButtonLink>;

export default ButtonLink;
export type { ButtonLinkProps };
