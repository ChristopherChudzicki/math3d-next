import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import type { Location } from "react-router";

type Layer = { open: boolean; location: Location };

const LayerContext = createContext<Layer | null>(null);

/**
 * The location an overlay reads. While it closes, that is the location it last
 * had open, so its content doesn't react to params that already left the URL.
 */
export const useLayerLocation = (): Location => {
  const live = useLocation();
  return useContext(LayerContext)?.location ?? live;
};

export const useLayerSearchParams = (): URLSearchParams => {
  const { search } = useLayerLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

/** Whether the surrounding overlay is open. True outside any overlay. */
export const useLayerOpen = (): boolean =>
  useContext(LayerContext)?.open ?? true;

/**
 * True while the surrounding overlay is open and the caller is mounted; a ref so
 * stale callbacks read the current value. Set before any passive effect runs.
 */
export const useLayerLiveRef = () => {
  const open = useLayerOpen();
  const live = useRef(open);
  useLayoutEffect(() => {
    live.current = open;
    return () => {
      live.current = false;
    };
  }, [open]);
  return live;
};

type OverlayLayerProps = { open: boolean; children: React.ReactNode };

/**
 * Wraps one overlay, which stays mounted while closed so Base UI can animate
 * it in and out. Layers nest: a layer inside another reads its parent's
 * location.
 */
export const OverlayLayer: React.FC<OverlayLayerProps> = ({
  open,
  children,
}) => {
  const location = useLayerLocation();
  const [frozen, setFrozen] = useState(location);
  if (open && frozen !== location) setFrozen(location);
  const value = useMemo(
    () => ({ open, location: open ? location : frozen }),
    [open, location, frozen],
  );
  return (
    <LayerContext.Provider value={value}>{children}</LayerContext.Provider>
  );
};
