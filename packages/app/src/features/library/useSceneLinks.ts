import { CARRIED_SCENE_PARAMS } from "@/config/sceneParams";
import { Drawer } from "@/ui/Drawer";
import { useMediaQuery } from "@/util/hooks";
import { useOverlay } from "@/services/overlays/useOverlay";
import { useUrlLayerSearchParams } from "@/services/overlays/UrlLayer";
import { SCENES_DRAWER_SIZE } from "./constants";
import type { ListType } from "./constants";

type Params = Record<string, string>;

/** The URL layer's `CARRIED_SCENE_PARAMS`, for a link to a scene. */
const useCarriedParams = (): Params => {
  const search = useUrlLayerSearchParams();
  return Object.fromEntries(
    Object.entries(CARRIED_SCENE_PARAMS).filter(
      ([name, value]) => search.get(name) === value,
    ),
  );
};

const scenePath = (key: string, params: Params) => {
  const search = new URLSearchParams(params).toString();
  return search ? `/${key}?${search}` : `/${key}`;
};

/**
 * Links for a tab's scene cards, keeping `CARRIED_SCENE_PARAMS`. Beside the
 * scene, the drawer stays open on `list`; where it covers the scene, opening
 * one closes it.
 */
const useSceneLinks = (list: ListType) => {
  const coversScene = useMediaQuery(
    Drawer.fillsViewportQuery(SCENES_DRAWER_SIZE),
  );
  const { close } = useOverlay();
  const carried = useCarriedParams();
  return {
    href: (key: string) =>
      scenePath(
        key,
        coversScene ? carried : { overlay: "scenes", list, ...carried },
      ),
    /** For the open scene's card, which doesn't follow its link. */
    onCurrentClick: coversScene ? close : undefined,
  };
};

export default useSceneLinks;
export { useCarriedParams, scenePath };
