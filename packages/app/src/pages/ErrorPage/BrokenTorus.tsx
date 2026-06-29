import React, { useMemo } from "react";
import brokenTorusPaths, {
  BrokenTorusOptions,
  StrokeRole,
} from "./brokenTorusGeometry";

/** Default stroke colour per role — wired to the app's brand tokens. */
const ROLE_COLORS: Record<StrokeRole, string> = {
  main: "var(--color-primary)",
  accent: "var(--color-primary-dark)",
  cut: "#0050b3",
};

interface BrokenTorusProps {
  className?: string;
  /** Override geometry (radii, tilt, wedge, …); merged over the defaults. */
  options?: Partial<BrokenTorusOptions>;
  colors?: Partial<Record<StrokeRole, string>>;
}

/**
 * Decorative broken-torus wireframe. Purely presentational and `aria-hidden`;
 * the surrounding error message carries the meaning.
 */
const BrokenTorus: React.FC<BrokenTorusProps> = ({
  className,
  options,
  colors,
}) => {
  const paths = useMemo(() => brokenTorusPaths(options), [options]);
  const roleColor = { ...ROLE_COLORS, ...colors };
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
          stroke={roleColor[p.role]}
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
