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

type UrlLayerContextValue = { open: boolean; location: Location };

const UrlLayerContext = createContext<UrlLayerContextValue | null>(null);

/**
 * The location a layer's dialog reads. While it closes, that is the location
 * it last had open, so its content doesn't react to params that already left
 * the URL.
 */
export const useUrlLayerLocation = (): Location => {
  const routerLocation = useLocation();
  return useContext(UrlLayerContext)?.location ?? routerLocation;
};

export const useUrlLayerSearchParams = (): URLSearchParams => {
  const { search } = useUrlLayerLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

/** Whether the surrounding layer is open. True outside any layer. */
export const useUrlLayerOpen = (): boolean =>
  useContext(UrlLayerContext)?.open ?? true;

/**
 * True while the surrounding layer is open and the caller is mounted; a ref so
 * stale callbacks read the current value. Set before any passive effect runs.
 */
export const useUrlLayerStillOpenRef = () => {
  const open = useUrlLayerOpen();
  const stillOpen = useRef(open);
  useLayoutEffect(() => {
    stillOpen.current = open;
    return () => {
      stillOpen.current = false;
    };
  }, [open]);
  return stillOpen;
};

type UrlLayerProps = { open: boolean; children: React.ReactNode };

/**
 * Wraps one dialog whose open state lives in the URL — an `?overlay=` entry or
 * sign-in. It stays mounted while closed so Base UI can animate it in and out.
 * Layers nest: a layer inside another reads its parent's location.
 */
export const UrlLayer: React.FC<UrlLayerProps> = ({ open, children }) => {
  const location = useUrlLayerLocation();
  const [lastOpenLocation, setLastOpenLocation] = useState(location);
  if (open && lastOpenLocation !== location) setLastOpenLocation(location);
  const value = useMemo(
    () => ({ open, location: open ? location : lastOpenLocation }),
    [open, location, lastOpenLocation],
  );
  return (
    <UrlLayerContext.Provider value={value}>
      {children}
    </UrlLayerContext.Provider>
  );
};
