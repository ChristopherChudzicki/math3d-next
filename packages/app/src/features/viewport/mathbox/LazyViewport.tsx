import React, { Suspense } from "react";

const Viewport = React.lazy(() => import("./Viewport"));

type Props = React.ComponentProps<typeof Viewport>;

/**
 * The MathBox viewport, loaded on first render so MathBox and its `three`
 * stay out of the main bundle.
 */
const LazyViewport: React.FC<Props> = (props) => (
  <Suspense fallback={<div className={props.className} aria-busy="true" />}>
    <Viewport {...props} />
  </Suspense>
);

export default LazyViewport;
