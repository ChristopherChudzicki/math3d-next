import React from "react";
import MuiLink from "@mui/material/Link";
import { Link as ReactRouterLink } from "react-router-dom";
import type { LinkProps } from "@mui/material/Link";
import invariant from "tiny-invariant";

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { href, ...others } = props;
  invariant(href);
  return (
    <MuiLink to={href} {...others} component={ReactRouterLink} ref={ref} />
  );
});
Link.displayName = "Link";

export default Link;
export type { LinkProps };
