import mergeClassNames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
// Styles mathbox's loading splash, which mathBox() always installs.
import "mathbox/mathbox.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";
import { debounce } from "lodash-es";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useElementResize } from "@/util/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import * as select from "@/store/scene/state/selectors";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useMathResults } from "@/store/scene/evaluation/mathScope";
import {
  useHasViewportItems,
  useViewportItems,
} from "@/features/viewport/shared/useViewportItems";
import is3dDisabled from "@/features/viewport/shared/is3dDisabled";
import { Graphic } from "./graphics";
import Camera from "./Camera";
import type { OnMoveEnd } from "./Camera";
import { ZOOM_FACTOR } from "./dollyZoom";
import { initDrainState, stepDrain } from "./stillReadiness";
import * as styles from "./Viewport.module.css";

type Props = {
  className?: string;
  /**
   * Render a single still frame: warm up briefly, halt the render loop (rather
   * than looping at ~60fps forever), and mark the container `data-scene-ready`
   * for a headless screenshotter. Used by the `/app/frame` render page.
   */
  still?: boolean;
};

const mathboxOptions = {
  plugins: ["core", "controls", "cursor"],
  controls: {
    klass: OrbitControls,
  },
  camera: {
    up: new Vector3(0, 0, 1),
  },
};

// The mathbox root selection proxies three's render Loop via start()/stop() at
// runtime (see mathbox's index.js), and carries the internal render Context on
// `_context`. Neither is in mathbox's TS types.
type MathboxContext = {
  // Number of scene objects still queued in mathbox's warmup pipeline. mathbox
  // inserts them a few per frame, pre-warming each off-screen; it reaches 0 once
  // every object has been inserted and drawn (mathbox render/scene.js).
  getPending: () => number;
};
type MathboxRoot = MathboxSelection & {
  stop: () => void;
  start: () => void;
  _context?: MathboxContext;
};

const ViewportContent = () => {
  const dispatch = useAppDispatch();
  const { graphics, camera, range, scale } = useViewportItems();

  const onCameraChange: OnMoveEnd = useMemo(() => {
    const cb: OnMoveEnd = (patches) => {
      patches.forEach((patch) =>
        dispatch(actions.patchProperty({ id: camera.id, ...patch })),
      );
    };
    return debounce(cb, 200);
  }, [dispatch, camera.id]);

  return (
    <MB.Cartesian range={range} scale={scale}>
      <Camera
        item={camera}
        range={range}
        scale={scale}
        onMoveEnd={onCameraChange}
      />
      {graphics.map((item) => (
        <Graphic key={item.id} item={item} />
      ))}
    </MB.Cartesian>
  );
};

const cameraProps = ["isOrthographic"] as const;
const useIsOrthographic = () => {
  const scope = useMathScope();
  const { isOrthographic } = useMathResults(scope, "camera", cameraProps);
  return !!isOrthographic;
};

const Viewport: React.FC<Props> = ({ className, still }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [mathbox, setMathbox] = useState<MathboxSelection | null>(null);
  // The scene load whose warmup has drained, so each load shows the splash
  // again. A mathbox instance swapped within one load counts as drained.
  const loadCount = useAppSelector(select.loadCount);
  const [drainedLoad, setDrainedLoad] = useState<number | null>(null);
  const warmedUp = drainedLoad === loadCount;
  const hasRequired = useHasViewportItems();

  const isOrthographic = useIsOrthographic();
  const focus = isOrthographic ? ZOOM_FACTOR : 1;

  const handleMathbox = useCallback((mb: MathboxSelection | null) => {
    // @ts-expect-error Exposed for debugging
    window.mathbox = mb;
    setMathbox(mb);
  }, []);

  // Wait for each scene load's warmup to drain, then hide its loading splash. In
  // `still` mode, also halt the render loop and flag readiness so a
  // screenshotter can capture a static, fully-rendered, CPU-idle frame.
  useEffect(() => {
    if (!mathbox) return undefined;
    const context = (mathbox as MathboxRoot)._context;
    const readPending =
      typeof context?.getPending === "function"
        ? () => context.getPending()
        : null;

    let state = initDrainState(performance.now());
    let raf = requestAnimationFrame(function tick() {
      const pending = readPending ? readPending() : null;
      const result = stepDrain(state, {
        pending,
        now: performance.now(),
      });
      state = result.state;
      if (result.ready) {
        // `stop()` is mathbox's documented loop control (start()/stop() on the
        // root selection, see index.js) — stable enough to call bare, unlike
        // the internal `_context.getPending` we feature-detect above.
        if (still) (mathbox as MathboxRoot).stop();
        setDrainedLoad(loadCount);
        return;
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [still, mathbox, loadCount]);

  // threestrap's size plugin (mathbox's resize pipeline) already listens for
  // a "resize" event on this container element directly, not just on
  // `window` - it's just that plain elements never natively fire one. CSS
  // Grid/flex layout changes (e.g. a sibling banner appearing/disappearing)
  // resize this container without ever firing a window resize, which left
  // the WebGL canvas stuck at its old size. Dispatching a synthetic "resize"
  // on the container itself activates that existing listener for any such
  // layout-only resize, with no overlap with genuine window resizes.
  useElementResize(container, () => {
    container?.dispatchEvent(new Event("resize"));
  });

  return (
    <div
      data-testid="scene"
      data-scene-ready={still && warmedUp ? "true" : undefined}
      className={mergeClassNames(className, styles.viewport, {
        [styles.splashHidden]: warmedUp,
      })}
      style={{ width: "100%", height: "100%" }}
      ref={setContainer}
    >
      {container && hasRequired && !is3dDisabled() && (
        <MB.Mathbox
          container={container}
          options={mathboxOptions}
          focus={focus}
          ref={handleMathbox}
        >
          <ViewportContent />
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Viewport;
