import React, { useEffect, useState } from "react";
import { renderMathInElement } from "mathlive";

type RenderMathInElementProps = {
  value: string;
  className?: string;
  mode: "inline" | "display";
};

const StaticMath: React.FC<RenderMathInElementProps> = ({
  value,
  className,
  mode,
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!container) return;
    renderMathInElement(container);
  }, [container, value, mode]);
  const scriptType = mode === "display" ? "math/tex" : "math/tex; mode=text";
  return (
    <span ref={setContainer} className={className}>
      <script type={scriptType}>{value}</script>
    </span>
  );
};

export default StaticMath;
