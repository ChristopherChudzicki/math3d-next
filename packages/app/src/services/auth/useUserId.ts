import { useUserMe } from "@math3d/api";
import { useAuthStatus } from "./useAuthStatus";

/** The signed-in user's id; null when signed out, undefined while unknown. */
const useUserId = (): number | null | undefined => {
  const status = useAuthStatus();
  const { data: me } = useUserMe();
  if (status === "loading") return undefined;
  return me?.id ?? null;
};

export { useUserId };
