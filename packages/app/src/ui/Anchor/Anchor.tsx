import React from "react";
import { Link } from "@tanstack/react-router";
import type { LinkComponent, LinkComponentProps } from "@tanstack/react-router";

type PlainAnchorProps = React.ComponentProps<"a"> & {
  /** A full-page navigation, or a link off the app. */
  href: string;
  to?: never;
};

/** Router mode's props, untyped by route. */
type RouterAnchorProps = LinkComponentProps<"a">;

/**
 * A link in one of two modes: `to` (with `params`, `search`, …) navigates
 * within the app through the router, typed against the routes; `href` is a
 * plain anchor, for other sites or a deliberate full-page load. `Extra` is a
 * wrapper's own props.
 */
type AnchorComponent<Extra = unknown> = ((
  props: PlainAnchorProps & Extra,
) => React.ReactElement) &
  LinkComponent<React.FC<React.ComponentProps<"a"> & Extra>>;

/**
 * Active (`aria-current="page"`) only at exactly its own URL, hash included:
 * by default the router counts `/` active on every page.
 */
const ACTIVE_OPTIONS = { exact: true, includeHash: true } as const;

const RouterAnchor: LinkComponent<"a"> = (props) => (
  <Link activeOptions={ACTIVE_OPTIONS} {...props} />
);

/** The props of either mode, untyped by route: for wrappers to pass through. */
type AnchorProps = PlainAnchorProps | RouterAnchorProps;

const isRouterMode = (props: AnchorProps): props is RouterAnchorProps =>
  props.to !== undefined;

const Anchor = ((props: AnchorProps) =>
  isRouterMode(props) ? (
    <RouterAnchor {...props} />
  ) : (
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- content arrives via props
    <a {...props} />
  )) as AnchorComponent;

export default Anchor;
export type { AnchorComponent, AnchorProps };
