import React, { useMemo } from "react";
import brokenTorusPaths, { StrokeRole } from "./brokenTorusGeometry";

/** Stroke colour per role — wired to the app's brand tokens. */
const ROLE_COLORS: Record<StrokeRole, string> = {
  main: "var(--color-primary)",
  accent: "var(--color-primary-dark)",
  cut: "#0050b3",
};

interface BrokenTorusProps {
  className?: string;
}

/**
 * Decorative broken-torus wireframe. Purely presentational and `aria-hidden`;
 * the surrounding error message carries the meaning. Tune the look via
 * `DEFAULT_OPTIONS` in ./brokenTorusGeometry and `ROLE_COLORS` above.
 */
const BrokenTorus: React.FC<BrokenTorusProps> = ({ className }) => {
  const paths = useMemo(() => brokenTorusPaths(), []);
  return (
    <svg
      className={className}
      viewBox="0 0 400 270"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-testid="broken-torus"
    >
      {paths.map((p, i) => (
        <path
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          d={p.d}
          stroke={ROLE_COLORS[p.role]}
          strokeWidth={p.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={p.dash}
          opacity={p.opacity}
        />
      ))}
    </svg>
  );
};

export default BrokenTorus;
