import { CARRIED_SCENE_PARAMS } from "@/config/sceneParams";
import { Drawer } from "@/ui/Drawer";
import { useMediaQuery } from "@/util/hooks";
import { useOverlay } from "@/services/overlays/useOverlay";
import { useUrlLayerSearchParams } from "@/services/overlays/UrlLayer";
import { SCENES_DRAWER_SIZE } from "./constants";
import type { ListType } from "./constants";

type Params = Record<string, string>;

/** The `CARRIED_SCENE_PARAMS` in the current URL, for a link to a scene. */
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
 * Hrefs for a tab's scene cards, keeping `CARRIED_SCENE_PARAMS`. While the
 * drawer leaves the scene visible, a card keeps it open on `list`; where the
 * drawer fills the viewport, a card opens the scene alone, closing it.
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
    carried,
  };
};

export default useSceneLinks;
export { useCarriedParams, scenePath };
