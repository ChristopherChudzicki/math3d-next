import React from "react";
import { convertLatexToMarkup } from "mathlive";

type StaticMathProps = React.ComponentProps<"span"> & {
  children: string;
};
const StaticMath: React.FC<StaticMathProps> = ({ children }) => (
  <span
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: convertLatexToMarkup(children),
    }}
  />
);

export default StaticMath;
