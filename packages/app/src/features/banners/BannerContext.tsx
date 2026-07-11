import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import invariant from "tiny-invariant";

const DEFAULT_CONFIRMATION_DURATION_MS = 7000;

type BannerSeverity = "error" | "warning" | "info" | "success";

type BannerSpec = {
  /** Stable identity. Calling show() again with an id already present is a no-op. */
  id: string;
  severity: BannerSeverity;
  content: React.ReactNode;
  /** aria-label for the dismiss button. Defaults to "Dismiss notice". */
  ariaLabel?: string;
  /**
   * When set, dismissing with "remember" checked persists to localStorage
   * under this key, and future show() calls with this persistKey are
   * suppressed until the key is cleared.
   */
  persistKey?: string;
  /** Label for the "remember" checkbox. Only shown when persistKey is set. */
  rememberLabel?: string;
  /**
   * Content shown briefly after a remembered dismissal, before the banner
   * auto-closes. If omitted, a remembered dismissal closes immediately.
   */
  confirmedContent?: React.ReactNode;
  confirmedSeverity?: BannerSeverity;
  /** How long confirmedContent stays up before auto-closing. */
  confirmationDurationMs?: number;
};

type Banner = BannerSpec & { stage: "shown" | "confirming" };

type BannersContextResult = {
  banners: Banner[];
  show: (spec: BannerSpec) => void;
  dismiss: (id: string, remember?: boolean) => void;
};

const BannersContext = createContext<BannersContextResult>({
  banners: [],
  show: () => {
    throw new Error("BannersContext not provided");
  },
  dismiss: () => invariant(false, "BannersContext not provided"),
});

const BannersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);

  const remove = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const show: BannersContextResult["show"] = useCallback((spec) => {
    if (spec.persistKey && localStorage.getItem(spec.persistKey) === "true") {
      return;
    }
    setBanners((prev) => {
      if (prev.some((b) => b.id === spec.id)) return prev;
      return [...prev, { ...spec, stage: "shown" }];
    });
  }, []);

  const dismiss: BannersContextResult["dismiss"] = useCallback(
    (id, remember = false) => {
      setBanners((prev) => {
        const entry = prev.find((b) => b.id === id);
        if (!entry) return prev;
        // Already confirming a remembered dismissal: a second dismiss click
        // always closes immediately, regardless of the checkbox state.
        if (entry.stage === "confirming") {
          return prev.filter((b) => b.id !== id);
        }
        if (remember) {
          if (entry.persistKey) localStorage.setItem(entry.persistKey, "true");
          if (entry.confirmedContent) {
            const duration =
              entry.confirmationDurationMs ?? DEFAULT_CONFIRMATION_DURATION_MS;
            setTimeout(() => remove(id), duration);
            return prev.map((b) =>
              b.id === id ? { ...b, stage: "confirming" } : b,
            );
          }
        }
        return prev.filter((b) => b.id !== id);
      });
    },
    [remove],
  );

  const result = useMemo(
    () => ({ banners, show, dismiss }),
    [banners, show, dismiss],
  );

  return (
    <BannersContext.Provider value={result}>{children}</BannersContext.Provider>
  );
};

const useBanners = (): BannersContextResult => useContext(BannersContext);

export { BannersProvider, useBanners };
export type { Banner, BannerSpec, BannerSeverity };
