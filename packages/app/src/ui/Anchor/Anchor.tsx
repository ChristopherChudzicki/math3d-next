import React from "react";
import { Link as RouterLink } from "react-router";
import type { LinkProps as RouterLinkProps } from "react-router";

type RouterAnchorProps = RouterLinkProps & {
  href?: never;
  ref?: React.Ref<HTMLAnchorElement>;
};

type PlainAnchorProps = React.ComponentProps<"a"> & {
  /** A full-page navigation, or a link off the app. */
  href: string;
  to?: never;
};

/**
 * A link in one of two modes: `to` navigates within the app through the
 * router; `href` is a plain anchor, for other sites or a deliberate full-page
 * load.
 */
type AnchorProps = RouterAnchorProps | PlainAnchorProps;

const isRouterMode = (props: AnchorProps): props is RouterAnchorProps =>
  props.to !== undefined;

const Anchor: React.FC<AnchorProps> = (props) =>
  isRouterMode(props) ? (
    <RouterLink {...props} />
  ) : (
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- content arrives via props
    <a {...props} />
  );

export default Anchor;
export type { AnchorProps };
