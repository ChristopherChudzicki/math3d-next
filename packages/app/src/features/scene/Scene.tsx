import mergeClassNames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";
import { isMathGraphic, MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { debounce } from "lodash-es";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useElementResize } from "@/util/hooks";
import {
  actions,
  select,
  useMathScope,
} from "../sceneControls/mathItems/sceneSlice";
import { Graphic, graphicNeedsRange } from "./graphics";
import useAxesInfo from "./useAxesInfo";
import Camera from "./Camera";
import type { OnMoveEnd } from "./Camera";
import { ZOOM_FACTOR } from "./dollyZoom";
import { useMathResults } from "../sceneControls/mathItems/mathScope";

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

// `still`-mode readiness. mathbox drains its warmup queue a couple objects per
// frame, so a fixed frame count under-renders any scene with more objects than
// the count covers (e.g. a 40-object scene needs ~20 frames; at 10 it screenshots
// half-drawn). Instead we poll `getPending()` and halt once the queue has been
// empty for a few consecutive frames — scaling with scene complexity, and (since
// it keys off drain state, not wall-clock) unaffected by the slow software-GL the
// headless screenshotter runs on.
const STILL_SETTLE_FRAMES = 3; // consecutive drained frames confirming quiescence
const STILL_MAX_FRAMES = 300; // frame-based backstop so we never spin forever
const STILL_FALLBACK_FRAMES = 30; // used only if `getPending` is ever unavailable

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];
const SceneContent = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(select.stableOrderedMathItems);
  const [x, y, z, camera] = useAppSelector((state) =>
    select.getItems(state, REQUIRED_ITEMS),
  );
  invariant(camera.type === MathItemType.Camera);
  const { scale, range } = useAxesInfo(x, y, z);

  const onCameraChange: OnMoveEnd = useMemo(() => {
    const cb: OnMoveEnd = (event) => {
      dispatch(
        actions.patchProperty({
          id: camera.id,
          path: "/position",
          value: `[${event.position.map((pos) => pos.toPrecision(6))}]`,
        }),
      );
      dispatch(
        actions.patchProperty({
          id: camera.id,
          path: "/target",
          value: `[${event.target.map((pos) => pos.toPrecision(6))}]`,
        }),
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
      {items.filter(isMathGraphic).map((item) => {
        const others = {
          ...(graphicNeedsRange(item.type) ? { range } : {}),
        };
        return <Graphic key={item.id} item={item} {...others} />;
      })}
    </MB.Cartesian>
  );
};

const cameraProps = ["isOrthographic"] as const;
const useIsOrthographic = () => {
  const scope = useMathScope();
  const { isOrthographic } = useMathResults(scope, "camera", cameraProps);
  return !!isOrthographic;
};

// E2E tests set this flag via Playwright's `disable3d` fixture to skip
// MathBox/WebGL initialization. Most E2E tests only interact with the
// controls sidebar, and disabling 3D rendering cuts test runtime from
// ~5 minutes to ~45 seconds.
const is3dDisabled = localStorage.getItem("disable3dScene") === "true";

const Scene: React.FC<Props> = ({ className, still }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [mathbox, setMathbox] = useState<MathboxSelection | null>(null);
  const [stillReady, setStillReady] = useState(false);
  const hasRequired = useAppSelector(select.hasItems(REQUIRED_ITEMS));

  const isOrthographic = useIsOrthographic();
  const focus = isOrthographic ? ZOOM_FACTOR : 1;

  const handleMathbox = useCallback((mb: MathboxSelection | null) => {
    // @ts-expect-error Exposed for debugging
    window.mathbox = mb;
    setMathbox(mb);
  }, []);

  // In `still` mode, wait for mathbox's warmup queue to drain, then halt the
  // render loop and flag readiness so a screenshotter can capture a static,
  // fully-rendered, CPU-idle frame.
  useEffect(() => {
    if (!still || !mathbox) return undefined;
    const context = (mathbox as MathboxRoot)._context;
    const readPending =
      typeof context?.getPending === "function"
        ? () => context.getPending()
        : null;

    let frame = 0;
    let settled = 0;
    // Guard against halting at frame 1, before any object has been queued: only
    // count "drained" frames once we've seen the queue non-empty at least once.
    let sawPending = false;
    let raf = requestAnimationFrame(function tick() {
      frame += 1;
      if (readPending) {
        const pending = readPending();
        if (pending > 0) sawPending = true;
        settled = sawPending && pending === 0 ? settled + 1 : 0;
      }
      const drained = readPending
        ? settled >= STILL_SETTLE_FRAMES
        : frame >= STILL_FALLBACK_FRAMES;
      if (drained || frame >= STILL_MAX_FRAMES) {
        (mathbox as MathboxRoot).stop();
        setStillReady(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [still, mathbox]);

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
      data-scene-ready={still && stillReady ? "true" : undefined}
      className={mergeClassNames(className)}
      style={{ width: "100%", height: "100%" }}
      ref={setContainer}
    >
      {container && hasRequired && !is3dDisabled && (
        <MB.Mathbox
          container={container}
          options={mathboxOptions}
          focus={focus}
          ref={handleMathbox}
        >
          <SceneContent />
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Scene;
