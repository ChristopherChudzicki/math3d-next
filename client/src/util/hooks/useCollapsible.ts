/* eslint-disable no-param-reassign */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { assertNotNil } from "util/predicates";

const getMs = (duration: string): number => {
  if (duration.endsWith("ms")) {
    return +duration.slice(0, -2);
  }
  if (duration.endsWith("s")) {
    return +duration.slice(0, -1) * 1000;
  }
  return 0;
};

const useCollapsible = (
  isOpen: boolean,
  refCb?: React.RefCallback<HTMLElement>
): React.RefCallback<HTMLElement> => {
  const elRef = useRef<HTMLElement>();
  const overflowY = useRef("");
  const expandInterval = useRef(-1);
  const collapseInterval = useRef(-1);
  const shouldExpandCollapse = useRef(false);
  const collapsing = useRef(false);

  const [hasRendered, setHasRendered] = useState(false);
  const collapse = useCallback(() => {
    collapsing.current = true;
    clearInterval(expandInterval.current);
    const el = elRef.current;
    assertNotNil(el);

    overflowY.current = el.style.overflowY;

    /**
     * Measure the height and set it explicitly so that it will be affected
     * by transform
     */
    const pxHeight = el.getBoundingClientRect().height;
    el.style.height = `${pxHeight}px`;
    el.style.overflowY = "hidden";
    /**
     * Not 100% sure why this is necessary, but it seems reasonable...
     * We need to wait a sec for the browser to "realize" the height has been
     * set numerically and is therefore transformable
     */
    setTimeout(() => {
      el.style.height = "0px";
    }, 0);
    const duration = getMs(window.getComputedStyle(el).transitionDuration);
    collapseInterval.current = window.setTimeout(() => {
      collapsing.current = false;
    }, duration);
  }, []);

  const expand = useCallback(() => {
    clearInterval(collapseInterval.current);
    const el = elRef.current;
    assertNotNil(el);

    /**
     * Measure the height before we hit expand.
     * This might not be zero if we are currently collapsing.
     */
    const heightBeforeExpand = el.getBoundingClientRect().height;
    /**
     * Measure what the height "should" be, then set back to 0px.
     */
    el.style.height = "";
    const { height } = el.getBoundingClientRect();
    el.style.height = `${heightBeforeExpand}px`;

    /**
     * Ensure the overflow is invisible during transformation.
     */
    el.style.overflowY = "hidden";
    setTimeout(() => {
      el.style.height = `${height}px`;
    }, 0);

    const duration = getMs(window.getComputedStyle(el).transitionDuration);
    expandInterval.current = window.setTimeout(() => {
      el.style.height = "";
      el.style.overflowY = overflowY.current;
    }, duration);
  }, []);

  useEffect(() => {
    if (!hasRendered) {
      setHasRendered(true);
    }
  }, [hasRendered]);

  useEffect(() => {
    if (!hasRendered) return;
    if (!shouldExpandCollapse.current) {
      shouldExpandCollapse.current = true;
      return;
    }
    if (isOpen) {
      expand();
    } else {
      collapse();
    }
  }, [hasRendered, isOpen, expand, collapse]);

  return (node) => {
    if (refCb) {
      refCb(node);
    }
    if (!node) return;
    elRef.current = node;
  };
};

export default useCollapsible;
