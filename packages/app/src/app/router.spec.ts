import { createAppRouter } from "@/app/router";
import { SCENE_KEY_PATTERN } from "@/config/sceneKey";
import { memoryHistory } from "@/test_util/routerTesting";
import { ROUTE_PATHS, matchRoute } from "@/worker/routes";

/** The route the app renders `path` with, or null for its not-found page. */
const routerRoute = async (path: string) => {
  const router = createAppRouter({ history: memoryHistory(path) });
  await router.load();
  const [, rawParams, found] = router.getMatchedRoutes(
    router.state.location.pathname,
  );
  const notFound =
    found === undefined ||
    rawParams["**"] !== undefined ||
    router.state.matches.some((match) => match.paramsError !== undefined);
  return notFound ? null : found.id;
};

/** The route the metadata Worker serves `path` as, or null where it 404s
 * without a lookup. */
const workerRoute = (path: string) => {
  const route = matchRoute(path);
  if (route === null) return null;
  const { sceneKey } = route.params;
  if (route.path === "/{-$sceneKey}" && sceneKey !== undefined) {
    return SCENE_KEY_PATTERN.test(sceneKey) ? route.path : null;
  }
  return route.path;
};

/** Each route's path with its params filled in, an optional one both ways. */
const routeSamples = ROUTE_PATHS.flatMap((path) => {
  const filled = path.replace(/\{-\$\w+\}|\$\w+/g, "abc123");
  const omitted = path.replace(/\/\{-\$\w+\}/g, "") || "/";
  return filled === omitted ? [filled] : [filled, omitted];
});

const otherSamples = [
  "/abc123/",
  "//abc123",
  "/app",
  "/app/",
  "/x",
  "/app/nope",
  "/abc123/def",
  "/app/frame/",
  "/app/frame/abc123/x",
  "/app//help/reference",
  "/App/help/reference",
  "/app/help/%72eference",
  "/app%2Fhelp%2Freference",
  "/ab%2Fcd",
  "/%zz",
];

it.each([...routeSamples, ...otherSamples])(
  "the Worker and the router agree on %s",
  async (path) => {
    expect(workerRoute(path)).toBe(await routerRoute(path));
  },
);

describe("the canonical link", () => {
  const canonical = () => document.querySelector('link[rel="canonical"]');
  const loaded = async (path: string) => {
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = `https://math3d.test${path}`;
    document.head.append(link);
    const router = createAppRouter({ history: memoryHistory(path) });
    await router.load();
    return router;
  };
  afterEach(() => canonical()?.remove());

  it("stays through the first load and a change of query alone", async () => {
    const router = await loaded("/abc123");
    await router.navigate({ href: "/abc123?overlay=scenes" });
    expect(canonical()).not.toBeNull();
  });

  it("goes once the app navigates to another path", async () => {
    const router = await loaded("/abc123");
    await router.navigate({ to: "/app/help/reference" });
    expect(canonical()).toBeNull();
  });
});
