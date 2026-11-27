import { createFileRoute, notFound } from "@tanstack/react-router";
import MainPage from "@/app/pages/MainPage/MainPage";
import { SCENE_KEY_PATTERN } from "@/config/sceneKey";
import { rendererSearchFields } from "@/services/renderer/search";
import { lenientSearch } from "@/util/lenientSearch";

export const Route = createFileRoute("/{-$sceneKey}")({
  params: {
    // A key Django would never issue (`/app`, `/a`) is a missing page, not a
    // missing scene.
    parse: ({ sceneKey }) => {
      if (sceneKey !== undefined && !SCENE_KEY_PATTERN.test(sceneKey)) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal -- the router's own signal
        throw notFound();
      }
      return { sceneKey };
    },
  },
  validateSearch: lenientSearch(rendererSearchFields),
  component: MainPage,
});
