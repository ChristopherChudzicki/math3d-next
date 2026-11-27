import React from "react";
import { useLinkProps } from "@tanstack/react-router";
import type {
  AnyRouter,
  LinkComponentProps,
  RegisteredRouter,
} from "@tanstack/react-router";

type PlainAnchorProps = React.ComponentProps<"a"> & {
  /** A full-page navigation, or a link off the app. */
  href: string;
  to?: never;
};

/**
 * `Link` resolves a function child itself; `useLinkProps` doesn't, so router
 * mode's children are nodes only.
 */
type NodeChildren = { children?: React.ReactNode };

/** Router mode's props, untyped by route. */
type RouterAnchorProps = LinkComponentProps<"a"> & NodeChildren;

/**
 * A link in one of two modes: `to` (with `params`, `search`, …) navigates
 * within the app through the router, typed against the routes; `href` is a
 * plain anchor, for other sites or a deliberate full-page load. `Extra` is a
 * wrapper's own props.
 */
type AnchorComponent<Extra = unknown> = {
  (props: PlainAnchorProps & Extra): React.ReactElement;
  <
    TRouter extends AnyRouter = RegisteredRouter,
    const TFrom extends string = string,
    const TTo extends string | undefined = undefined,
    const TMaskFrom extends string = TFrom,
    const TMaskTo extends string = "",
  >(
    props: LinkComponentProps<"a", TRouter, TFrom, TTo, TMaskFrom, TMaskTo> &
      NodeChildren &
      Extra,
  ): React.ReactElement;
};

/**
 * Active (`aria-current="page"`) only at exactly its own URL, hash included:
 * by default the router counts `/` active on every page. No `active` class
 * either.
 */
const ACTIVE = {
  activeOptions: { exact: true, includeHash: true },
  activeProps: {},
} as const;

const RouterAnchor = React.forwardRef<HTMLAnchorElement, RouterAnchorProps>(
  (options, ref) => (
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- content arrives via props
    <a
      {...useLinkProps(
        // AnchorComponent's call signature checks the target against the routes.
        { ...ACTIVE, ...options } as Parameters<typeof useLinkProps>[0],
        ref as React.ForwardedRef<Element>,
      )}
    />
  ),
);
RouterAnchor.displayName = "RouterAnchor";

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
