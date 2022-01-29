import React from "react";
import mergeClassNames from "classnames";

type Props = {
  className?: string;
};

const Header: React.FC<Props> = (props) => <div className={mergeClassNames(props.className)} />;

export default Header;
