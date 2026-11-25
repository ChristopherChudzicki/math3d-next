import { CARRIED_SCENE_PARAMS } from "@/config/sceneParams";
import { Drawer } from "@/ui/Drawer";
import { useMediaQuery } from "@/util/hooks";
import { useOverlay } from "@/services/overlays/useOverlay";
import { useUrlLayerSearchParams } from "@/services/overlays/UrlLayer";
import { SCENES_DRAWER_SIZE } from "./constants";
import type { ListType } from "./constants";

/** The current URL's `CARRIED_SCENE_PARAMS`, for a link to another scene. */
const useCarriedParams = (): URLSearchParams => {
  const search = useUrlLayerSearchParams();
  const carried = new URLSearchParams();
  CARRIED_SCENE_PARAMS.forEach(([name, value]) => {
    if (search.get(name) === value) carried.set(name, value);
  });
  return carried;
};

const scenePath = (key: string, params: URLSearchParams) => {
  const search = params.toString();
  return search ? `/${key}?${search}` : `/${key}`;
};

/**
 * Links for a tab's scene cards. Beside the scene, the drawer stays open on
 * `list`; where it covers the scene, opening one closes it.
 */
const useSceneLinks = (list: ListType) => {
  const coversScene = useMediaQuery(
    Drawer.fillsViewportQuery(SCENES_DRAWER_SIZE),
  );
  const { close } = useOverlay();
  const carried = useCarriedParams();
  return {
    href: (key: string) => {
      const params = new URLSearchParams(
        coversScene ? {} : { overlay: "scenes", list },
      );
      carried.forEach((value, name) => params.append(name, value));
      return scenePath(key, params);
    },
    /** For the open scene's card, which doesn't follow its link. */
    onCurrentClick: coversScene ? close : undefined,
  };
};

export default useSceneLinks;
export { useCarriedParams, scenePath };
