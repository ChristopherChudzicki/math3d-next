import React from "react";
import MuiLink from "@mui/material/Link";
import { Link as ReactRouterLink } from "react-router";
import type { LinkProps } from "@mui/material/Link";
import invariant from "tiny-invariant";

const Link: React.FC<LinkProps & { ref?: HTMLAnchorElement }> = (props) => {
  const { href, ...others } = props;
  invariant(href);
  return <MuiLink to={href} {...others} component={ReactRouterLink} />;
};

export default Link;
export type { LinkProps };
