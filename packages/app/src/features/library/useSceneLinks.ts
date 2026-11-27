import { linkOptions } from "@tanstack/react-router";
import { Drawer } from "@/ui/Drawer";
import { useMediaQuery } from "@/util/hooks";
import { sceneLink } from "@/services/navigation/links";
import { useOverlay } from "@/services/overlays/useOverlay";
import { useUrlLayerLocation } from "@/services/overlays/UrlLayer";
import type { ListType } from "@/services/overlays/search";
import { SCENES_DRAWER_SIZE } from "./constants";

/**
 * Params a link to a scene keeps from the current URL, each only when it has
 * the listed value. Copying params wholesale would give crawlers unboundedly
 * many URLs per scene.
 */
const CARRIED_SEARCH = { controls: 0 } as const;

type CarriedSearch = Partial<typeof CARRIED_SEARCH>;

/** The `CARRIED_SEARCH` in the current URL, for a link to a scene. */
const useCarriedSearch = (): CarriedSearch => {
  const { search } = useUrlLayerLocation();
  return Object.fromEntries(
    Object.entries(CARRIED_SEARCH).filter(
      ([name, value]) => search[name as keyof CarriedSearch] === value,
    ),
  );
};

type SceneCardSearch = CarriedSearch & { overlay?: "scenes"; list?: ListType };

/** A link to a scene from its card. */
const sceneCardLink = (key: string | undefined, search: SceneCardSearch) =>
  linkOptions({ ...sceneLink(key), search });

/**
 * Links for a tab's scene cards, keeping `CARRIED_SEARCH`. While the drawer
 * leaves the scene visible, a card keeps it open on `list`; where the drawer
 * fills the viewport, a card opens the scene alone, closing it.
 */
const useSceneLinks = (list: ListType) => {
  const coversScene = useMediaQuery(
    Drawer.fillsViewportQuery(SCENES_DRAWER_SIZE),
  );
  const { close } = useOverlay();
  const carried = useCarriedSearch();
  return {
    link: (key: string | undefined) =>
      sceneCardLink(
        key,
        coversScene ? carried : { overlay: "scenes", list, ...carried },
      ),
    /** For the open scene's card, which doesn't follow its link. */
    onCurrentClick: coversScene ? close : undefined,
    carried,
  };
};

export default useSceneLinks;
export { sceneCardLink };
