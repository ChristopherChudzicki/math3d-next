// Use `react-router` (not `react-router-dom`) to match the repo convention (21 src files).
import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

export type OverlayName =
  | "login"
  | "register"
  | "logout"
  | "settings"
  | "reset-request"
  | "scenes";

export const useOverlay = () => {
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const current = search.get("overlay");

  const open = useCallback(
    (name: OverlayName, companion?: { list?: string }) => {
      const next = new URLSearchParams(search);
      const switching = next.has("overlay");
      next.set("overlay", name);
      next.delete("list");
      if (companion?.list) next.set("list", companion.list);
      navigate(
        { search: next.toString(), hash: location.hash },
        { replace: switching },
      );
    },
    [search, location.hash, navigate],
  );

  const close = useCallback(() => {
    const next = new URLSearchParams(search);
    next.delete("overlay");
    next.delete("list");
    navigate(
      { search: next.toString(), hash: location.hash },
      { replace: true },
    );
  }, [search, location.hash, navigate]);

  return { current, open, close } as const;
};
