import { Drawer } from "@/ui/Drawer";
import { useMediaQuery } from "@/util/hooks";
import { useOverlay } from "@/services/overlays/useOverlay";
import { SCENES_DRAWER_SIZE } from "./constants";
import type { ListType } from "./constants";

/**
 * Links for a tab's scene cards. Beside the scene, the drawer stays open on
 * `list`; where it covers the scene, opening one closes it.
 */
const useSceneLinks = (list: ListType) => {
  const coversScene = useMediaQuery(
    Drawer.fillsViewportQuery(SCENES_DRAWER_SIZE),
  );
  const { close } = useOverlay();
  return {
    href: (key: string) =>
      coversScene ? `/${key}` : `/${key}?overlay=scenes&list=${list}`,
    /** For the open scene's card, which doesn't follow its link. */
    onCurrentClick: coversScene ? close : undefined,
  };
};

export default useSceneLinks;
