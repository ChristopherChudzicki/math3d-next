/**
 * The SPA's routes as TanStack path strings; `app/router.ts` checks them against
 * the route tree's `fullPaths`. That check pulls this file into the app's
 * program too, so it imports nothing and uses no runtime-specific globals.
 *
 * First match wins, as listed, so a route with a literal segment goes before
 * one with a param there, as the router prefers it. A spec checks the matcher
 * against the router.
 */
export const ROUTE_PATHS = [
  "/app/frame/$sceneKey",
  "/app/help/reference",
  "/app/sign-in-error",
  "/{-$sceneKey}",
] as const;

type Params = Record<string, string | undefined>;

export interface RouteMatch {
  path: (typeof ROUTE_PATHS)[number];
  params: Params;
}

type Segment =
  | { kind: "literal"; value: string }
  | { kind: "param"; name: string; optional: boolean };

const parseSegment = (segment: string): Segment => {
  const param = /^\$(\w+)$/.exec(segment);
  if (param) return { kind: "param", name: param[1], optional: false };
  const optional = /^\{-\$(\w+)\}$/.exec(segment);
  if (optional) return { kind: "param", name: optional[1], optional: true };
  if (/[$*{}]/.test(segment)) {
    throw new Error(`Unsupported route segment: ${segment}`);
  }
  return { kind: "literal", value: segment };
};

const matchSegments = (
  pattern: Segment[],
  segments: string[],
): Params | null => {
  const [head, ...rest] = pattern;
  if (head === undefined) return segments.length === 0 ? {} : null;
  const [segment, ...remaining] = segments;
  if (head.kind === "literal") {
    return segment === head.value ? matchSegments(rest, remaining) : null;
  }
  const taken = segment === undefined ? null : matchSegments(rest, remaining);
  if (taken) return { ...taken, [head.name]: segment };
  return head.optional ? matchSegments(rest, segments) : null;
};

const PATTERNS = ROUTE_PATHS.map((path) => ({
  path,
  segments: path.split("/").filter(Boolean).map(parseSegment),
}));

/**
 * The route the router would render `pathname` with, and its decoded params,
 * or null where it renders not-found. Like the router: case-sensitive, leading
 * and trailing slashes ignored, segments decoded after splitting.
 */
export const matchRoute = (pathname: string): RouteMatch | null => {
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  let segments: string[];
  try {
    segments = trimmed === "" ? [] : trimmed.split("/").map(decodeURIComponent);
  } catch {
    return null; // a malformed escape
  }
  if (segments.includes("")) return null; // a doubled slash inside the path
  return PATTERNS.reduce<RouteMatch | null>(
    (found, { path, segments: pattern }) => {
      if (found) return found;
      const params = matchSegments(pattern, segments);
      return params && { path, params };
    },
    null,
  );
};
