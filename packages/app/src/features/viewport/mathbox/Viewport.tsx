/**
 * The MathBox viewport. This shell imports none of MathBox; `MathboxContent`
 * and MathBox's `three` load behind the one `React.lazy` below.
 */
import React from "react";
import ViewportShell from "@/features/viewport/shared/ViewportShell";
import { useLoadFlag } from "@/features/viewport/shared/useLoadFlag";
import type { Props as ContentProps } from "./MathboxContent";

const MathboxContent = React.lazy(() => import("./MathboxContent"));

type Props = Pick<ContentProps, "still"> & { className?: string };

const Viewport: React.FC<Props> = ({ className, still }) => {
  const [ready, onReady] = useLoadFlag();
  return (
    <ViewportShell
      renderer="mathbox"
      errorMessage="This scene couldn't be drawn."
      ready={ready}
      className={className}
    >
      <MathboxContent still={still} ready={ready} onReady={onReady} />
    </ViewportShell>
  );
};

export default Viewport;
