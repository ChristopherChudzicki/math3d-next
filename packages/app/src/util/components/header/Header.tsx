import mergeClassNames from "classnames";
import React from "react";

type Props = {
  className?: string;
};

const Header: React.FC<Props> = (props) => (
  <div className={mergeClassNames(props.className)} />
);

export default Header;
