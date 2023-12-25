import React from "react";
import MuiLink from "@mui/material/Link";
import { Link as ReactRouterLink } from "react-router-dom";
import type { LinkProps as ReactRouterLinkProps } from "react-router-dom";
import type { LinkProps as MuiLinkProps } from "@mui/material/Link";

type LinkProps = Omit<MuiLinkProps, "href"> & {
  to: ReactRouterLinkProps["to"];
};

/**
 * A button rendered as a link that uses react-router-dom's Link component
 * for routing.
 */
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  return <MuiLink {...props} component={ReactRouterLink} ref={ref} />;
});
Link.displayName = "Link";

export default Link;
export type { LinkProps };
